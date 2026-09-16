import {
	Injectable,
	Logger,
	OnApplicationBootstrap
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import {
	BaseEvent,
	FailedItemPayload,
	InventoryCompensationPayload,
	InventoryFailedPayload,
	InventoryReservedPayload,
	InventoryRoutingKeys,
	OrderCreatedPayload,
	PaymentFailedPayload,
	RabbitExchanges,
	RabbitQueues,
	ReservedItemPayload
} from '@hermex/contracts'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { ProcessedEventEntity } from './entities/processed-event.entity'
import { ProductEntity } from './entities/product.entity'
import {
	ReservationStatus,
	StockReservationEntity
} from './entities/stock-reservation.entity'

@Injectable()
export class InventoryService implements OnApplicationBootstrap {
	private readonly logger = new Logger(InventoryService.name)

	constructor(
		private readonly dataSource: DataSource,
		@InjectRepository(ProductEntity)
		private readonly productRepository: Repository<ProductEntity>,
		@InjectRepository(StockReservationEntity)
		private readonly reservationRepository: Repository<StockReservationEntity>,
		@InjectRepository(ProcessedEventEntity)
		private readonly processedEventRepository: Repository<ProcessedEventEntity>,
		private readonly rabbitMQService: RabbitMQService
	) { }

	async onApplicationBootstrap(): Promise<void> {
		await this.listenToSagaEvents()
	}

	/**
	 * Main Saga step: Handle order.created, verify stock, reserve items or publish failure
	 */
	async handleOrderCreated(
		event: BaseEvent<OrderCreatedPayload>
	): Promise<void> {
		const { eventId, correlationId, payload } = event
		const { orderId, userId, items, totalAmount, currency } = payload

		this.logger.log(
			`[${correlationId}] Processing order.created for Order: ${orderId}`
		)

		// 1. Idempotency Check
		const alreadyProcessed = await this.processedEventRepository.findOne({
			where: { eventId }
		})
		if (alreadyProcessed) {
			this.logger.warn(
				`[${correlationId}] Event ${eventId} for Order ${orderId} has already been processed. Skipping duplicate.`
			)
			return
		}

		// 2. Transactional Stock Verification & Reservation
		const queryRunner = this.dataSource.createQueryRunner()
		await queryRunner.connect()
		await queryRunner.startTransaction()

		try {
			const failedItems: FailedItemPayload[] = []
			const productsToUpdate: { product: ProductEntity; requestedQty: number }[] =
				[]

			for (const item of items) {
				// Lock row with pessimistic write to prevent race conditions during concurrent orders
				const product = await queryRunner.manager
					.createQueryBuilder(ProductEntity, 'product')
					.setLock('pessimistic_write')
					.where('product.id = :id', { id: item.productId })
					.getOne()

				if (!product) {
					failedItems.push({
						productId: item.productId,
						requestedQuantity: item.quantity,
						availableQuantity: 0
					})
				} else if (product.stockQuantity < item.quantity) {
					failedItems.push({
						productId: item.productId,
						requestedQuantity: item.quantity,
						availableQuantity: product.stockQuantity
					})
				} else {
					productsToUpdate.push({ product, requestedQty: item.quantity })
				}
			}

			// If ANY item has insufficient stock -> Rollback & Publish inventory.failed
			if (failedItems.length > 0) {
				await queryRunner.rollbackTransaction()

				this.logger.warn(
					`[${correlationId}] Out of stock for Order ${orderId}: ${JSON.stringify(failedItems)}`
				)

				// Record event as processed to prevent re-runs
				await this.recordProcessedEvent(eventId, 'order.created.failed')

				const inventoryFailedEvent: BaseEvent<InventoryFailedPayload> = {
					eventId: uuidv4(),
					correlationId,
					timestamp: new Date().toISOString(),
					payload: {
						orderId,
						userId,
						reason: `Insufficient stock for product(s): ${failedItems.map((f) => f.productId).join(', ')}`,
						failedItems,
						failedAt: new Date().toISOString()
					}
				}

				this.rabbitMQService.publishEvent(
					RabbitExchanges.INVENTORY,
					InventoryRoutingKeys.FAILED,
					inventoryFailedEvent
				)
				return
			}

			// All items in stock: Decrement quantities and create reservations
			const reservationId = uuidv4()
			const reservedItems: ReservedItemPayload[] = []

			for (const { product, requestedQty } of productsToUpdate) {
				product.stockQuantity -= requestedQty
				await queryRunner.manager.save(product)

				const reservation = queryRunner.manager.create(
					StockReservationEntity,
					{
						orderId,
						productId: product.id,
						quantity: requestedQty,
						status: ReservationStatus.PENDING
					}
				)
				await queryRunner.manager.save(reservation)

				reservedItems.push({
					productId: product.id,
					quantity: requestedQty,
					price: Number(product.price)
				})
			}

			// Record idempotency inside transaction
			const processedEvent = queryRunner.manager.create(
				ProcessedEventEntity,
				{
					eventId,
					eventType: 'order.created'
				}
			)
			await queryRunner.manager.save(processedEvent)

			await queryRunner.commitTransaction()

			this.logger.log(
				`[${correlationId}] Stock successfully reserved for Order: ${orderId} (Reservation: ${reservationId})`
			)

			// 3. Publish Saga progress event: inventory.reserved
			const inventoryReservedEvent: BaseEvent<InventoryReservedPayload> = {
				eventId: uuidv4(),
				correlationId,
				timestamp: new Date().toISOString(),
				payload: {
					orderId,
					reservationId,
					userId,
					items: reservedItems,
					totalAmount,
					currency,
					reservedAt: new Date().toISOString()
				}
			}

			this.rabbitMQService.publishEvent(
				RabbitExchanges.INVENTORY,
				InventoryRoutingKeys.RESERVED,
				inventoryReservedEvent
			)
		} catch (error) {
			await queryRunner.rollbackTransaction()
			this.logger.error(
				`[${correlationId}] Error processing stock reservation for Order ${orderId}: ${(error as Error).message}`,
				(error as Error).stack
			)
			throw error
		} finally {
			await queryRunner.release()
		}
	}

	/**
	 * Compensating Transaction (Saga Rollback):
	 * When payment fails, release reserved stock back into available warehouse inventory
	 */
	async handlePaymentFailed(
		event: BaseEvent<PaymentFailedPayload>
	): Promise<void> {
		const { eventId, correlationId, payload } = event
		const { orderId, reason } = payload

		this.logger.log(
			`[${correlationId}] Processing payment.failed compensation for Order: ${orderId}`
		)

		// 1. Idempotency Check
		const alreadyProcessed = await this.processedEventRepository.findOne({
			where: { eventId }
		})
		if (alreadyProcessed) {
			this.logger.warn(
				`[${correlationId}] Event ${eventId} for compensation has already been processed. Skipping.`
			)
			return
		}

		// 2. Transactional Stock Return
		const queryRunner = this.dataSource.createQueryRunner()
		await queryRunner.connect()
		await queryRunner.startTransaction()

		try {
			const reservations = await queryRunner.manager.find(
				StockReservationEntity,
				{
					where: {
						orderId,
						status: ReservationStatus.PENDING
					}
				}
			)

			if (reservations.length === 0) {
				this.logger.warn(
					`[${correlationId}] No pending reservations found for Order ${orderId} to compensate.`
				)
				await queryRunner.rollbackTransaction()
				return
			}

			for (const reservation of reservations) {
				const product = await queryRunner.manager
					.createQueryBuilder(ProductEntity, 'product')
					.setLock('pessimistic_write')
					.where('product.id = :id', { id: reservation.productId })
					.getOne()

				if (product) {
					product.stockQuantity += reservation.quantity
					await queryRunner.manager.save(product)
				}

				reservation.status = ReservationStatus.CANCELLED
				await queryRunner.manager.save(reservation)
			}

			// Record idempotency
			const processedEvent = queryRunner.manager.create(
				ProcessedEventEntity,
				{
					eventId,
					eventType: 'payment.failed.compensation'
				}
			)
			await queryRunner.manager.save(processedEvent)

			await queryRunner.commitTransaction()

			this.logger.log(
				`[${correlationId}] Stock compensation completed for Order: ${orderId}`
			)

			// 3. Publish Saga compensation event
			const compensationEvent: BaseEvent<InventoryCompensationPayload> = {
				eventId: uuidv4(),
				correlationId,
				timestamp: new Date().toISOString(),
				payload: {
					orderId,
					reason: `Payment failed: ${reason}`,
					compensatedAt: new Date().toISOString()
				}
			}

			this.rabbitMQService.publishEvent(
				RabbitExchanges.INVENTORY,
				InventoryRoutingKeys.COMPENSATED,
				compensationEvent
			)
		} catch (error) {
			await queryRunner.rollbackTransaction()
			this.logger.error(
				`[${correlationId}] Error compensating stock for Order ${orderId}: ${(error as Error).message}`,
				(error as Error).stack
			)
			throw error
		} finally {
			await queryRunner.release()
		}
	}

	private async recordProcessedEvent(
		eventId: string,
		eventType: string
	): Promise<void> {
		try {
			const record = this.processedEventRepository.create({
				eventId,
				eventType
			})
			await this.processedEventRepository.save(record)
		} catch {
			// Ignore duplicate key error on event recording
		}
	}

	private async listenToSagaEvents(): Promise<void> {
		// 1. Subscribe to order.created
		await this.rabbitMQService.consumeEvents<OrderCreatedPayload>(
			RabbitQueues.INVENTORY_ORDER_EVENTS,
			async (event) => {
				await this.handleOrderCreated(event)
			}
		)

		// 2. Subscribe to payment.failed (Compensating rollback)
		await this.rabbitMQService.consumeEvents<PaymentFailedPayload>(
			RabbitQueues.INVENTORY_PAYMENT_EVENTS,
			async (event) => {
				await this.handlePaymentFailed(event)
			}
		)

		this.logger.log('Inventory Service Saga listeners successfully activated')
	}
}
