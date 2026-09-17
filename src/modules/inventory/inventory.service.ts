import {
	Injectable,
	Logger,
	OnApplicationBootstrap
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { RpcException } from '@nestjs/microservices'
import { status as GrpcStatus } from '@grpc/grpc-js'
import {
	BaseEvent,
	CartItemInput,
	CartItemValidationResult,
	CartStockStatus,
	FailedItemPayload,
	GetProductsRequest,
	GetProductsResponse,
	InventoryCompensationPayload,
	InventoryFailedPayload,
	InventoryReservedPayload,
	InventoryRoutingKeys,
	OrderCreatedPayload,
	PaymentFailedPayload,
	PaymentSucceededPayload,
	ProductItemMessage,
	RabbitExchanges,
	RabbitQueues,
	ReservedItemPayload,
	ValidateCartRequest,
	ValidateCartResponse
} from '@hermex/contracts'
import { MetricsService } from '../metrics/metrics.service'
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
		private readonly rabbitMQService: RabbitMQService,
		private readonly metricsService: MetricsService
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
				this.metricsService.recordReservation('failed')

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

			this.metricsService.recordReservation('success')
			for (const { product } of productsToUpdate) {
				this.metricsService.updateStockLevel(product.id, product.stockQuantity)
			}

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

			this.metricsService.recordCompensation('success')

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

	/**
	 * Saga Step: Payment Succeeded
	 * Confirms stock reservations for the fulfilled order
	 */
	async handlePaymentSucceeded(
		event: BaseEvent<PaymentSucceededPayload>
	): Promise<void> {
		const { eventId, correlationId, payload } = event
		const { orderId } = payload

		this.logger.log(
			`[${correlationId}] Processing payment.succeeded confirmation for Order: ${orderId}`
		)

		// 1. Idempotency Check
		const alreadyProcessed = await this.processedEventRepository.findOne({
			where: { eventId }
		})
		if (alreadyProcessed) {
			this.logger.warn(
				`[${correlationId}] Event ${eventId} for payment confirmation has already been processed. Skipping.`
			)
			return
		}

		// 2. Transactional Reservation Confirmation
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
					`[${correlationId}] No pending reservations found for Order ${orderId} to confirm.`
				)
				await queryRunner.rollbackTransaction()
				return
			}

			for (const reservation of reservations) {
				reservation.status = ReservationStatus.CONFIRMED
				await queryRunner.manager.save(reservation)
			}

			// Record idempotency
			const processedEvent = queryRunner.manager.create(
				ProcessedEventEntity,
				{
					eventId,
					eventType: 'payment.succeeded.confirmation'
				}
			)
			await queryRunner.manager.save(processedEvent)

			await queryRunner.commitTransaction()

			this.logger.log(
				`[${correlationId}] Stock reservations for Order ${orderId} confirmed successfully (${reservations.length} items)`
			)
		} catch (error) {
			await queryRunner.rollbackTransaction()
			this.logger.error(
				`[${correlationId}] Error confirming stock reservations for Order ${orderId}: ${(error as Error).message}`,
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

		// 2. Subscribe to payment events (both success confirmation and failed compensation)
		await this.rabbitMQService.consumeEvents<
			PaymentSucceededPayload | PaymentFailedPayload
		>(RabbitQueues.INVENTORY_PAYMENT_EVENTS, async (event) => {
			const payload = event.payload
			if ('paymentId' in payload) {
				await this.handlePaymentSucceeded(
					event as BaseEvent<PaymentSucceededPayload>
				)
			} else {
				await this.handlePaymentFailed(
					event as BaseEvent<PaymentFailedPayload>
				)
			}
		})

		this.logger.log('Inventory Service Saga listeners successfully activated')
	}

	/**
	 * gRPC Catalog Query: Paginated products with stock filter, search, and sorting
	 */
	async getProducts(request: GetProductsRequest): Promise<GetProductsResponse> {
		const page = Math.max(1, Number(request.page) || 1)
		const limit = Math.min(100, Math.max(1, Number(request.limit) || 20))
		const skip = (page - 1) * limit

		const queryBuilder = this.productRepository.createQueryBuilder('product')

		if (request.inStockOnly) {
			queryBuilder.andWhere('product.stockQuantity > 0')
		}

		if (request.search && request.search.trim().length > 0) {
			const searchTerm = `%${request.search.trim().toLowerCase()}%`
			queryBuilder.andWhere(
				'(LOWER(product.name) LIKE :searchTerm OR LOWER(product.description) LIKE :searchTerm OR LOWER(product.sku) LIKE :searchTerm)',
				{ searchTerm }
			)
		}

		const allowedSortFields = ['createdAt', 'price', 'name', 'stockQuantity']
		const sortBy = allowedSortFields.includes(request.sortBy || '')
			? request.sortBy!
			: 'createdAt'
		const sortOrder = request.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

		queryBuilder.orderBy(`product.${sortBy}`, sortOrder)
		queryBuilder.skip(skip).take(limit)

		const [products, totalItems] = await queryBuilder.getManyAndCount()
		const totalPages = Math.ceil(totalItems / limit) || 1

		const items: ProductItemMessage[] = products.map((product) => ({
			id: product.id,
			name: product.name,
			sku: product.sku,
			price: Number(product.price),
			stockQuantity: product.stockQuantity,
			description: product.description || '',
			category: product.category || 'General',
			imageUrl: product.imageUrl || '',
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString()
		}))

		return {
			items,
			meta: {
				page,
				limit,
				totalItems,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1
			}
		}
	}

	/**
	 * gRPC Product Detail Query: Retrieve product by ID
	 */
	async getProductById(id: string): Promise<ProductItemMessage> {
		const product = await this.productRepository.findOne({ where: { id } })
		if (!product) {
			throw new RpcException({
				code: GrpcStatus.NOT_FOUND,
				message: `Product with ID '${id}' not found`
			})
		}

		return {
			id: product.id,
			name: product.name,
			sku: product.sku,
			price: Number(product.price),
			stockQuantity: product.stockQuantity,
			description: product.description || '',
			category: product.category || 'General',
			imageUrl: product.imageUrl || '',
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString()
		}
	}

	/**
	 * gRPC Cart Batch Validation: Authoritative stock and pricing verification
	 */
	async validateCart(items: CartItemInput[]): Promise<ValidateCartResponse> {
		if (!items || items.length === 0) {
			return {
				isValid: true,
				canProceed: true,
				items: [],
				subtotal: 0,
				currency: 'USD'
			}
		}

		const productIds = Array.from(new Set(items.map((item) => item.productId)))
		const products = await this.productRepository.find({
			where: { id: In(productIds) }
		})
		const productMap = new Map<string, ProductEntity>()
		for (const p of products) {
			productMap.set(p.id, p)
		}

		let subtotal = 0
		let allValid = true
		let canProceed = true

		const validatedItems: CartItemValidationResult[] = items.map((cartItem) => {
			const product = productMap.get(cartItem.productId)
			const requestedQuantity = Math.max(1, Number(cartItem.quantity) || 1)

			if (!product) {
				allValid = false
				canProceed = false
				return {
					productId: cartItem.productId,
					name: 'Unknown Product',
					sku: 'UNKNOWN',
					currentPrice: 0,
					expectedPrice: cartItem.expectedPrice ? Number(cartItem.expectedPrice) : undefined,
					priceChanged: false,
					requestedQuantity,
					availableQuantity: 0,
					effectiveQuantity: 0,
					stockStatus: 'OUT_OF_STOCK',
					itemTotal: 0,
					hasIssue: true,
					issueReason: 'Product no longer exists in catalog'
				}
			}

			const currentPrice = Number(product.price)
			const priceChanged =
				cartItem.expectedPrice !== undefined &&
				Math.abs(Number(cartItem.expectedPrice) - currentPrice) > 0.001

			let stockStatus: CartStockStatus = 'IN_STOCK'
			let effectiveQuantity = requestedQuantity
			let hasIssue = false
			let issueReason: string | undefined

			if (product.stockQuantity <= 0) {
				stockStatus = 'OUT_OF_STOCK'
				effectiveQuantity = 0
				hasIssue = true
				issueReason = 'Item is currently out of stock'
				canProceed = false
			} else if (product.stockQuantity < requestedQuantity) {
				stockStatus = 'PARTIALLY_AVAILABLE'
				effectiveQuantity = product.stockQuantity
				hasIssue = true
				issueReason = `Only ${product.stockQuantity} item(s) available`
			} else if (product.stockQuantity <= 5) {
				stockStatus = 'LOW_STOCK'
			}

			if (priceChanged) {
				hasIssue = true
				issueReason = issueReason
					? `${issueReason}; Price changed from $${cartItem.expectedPrice} to $${currentPrice}`
					: `Price changed from $${cartItem.expectedPrice} to $${currentPrice}`
			}

			if (hasIssue) {
				allValid = false
			}

			const itemTotal = currentPrice * effectiveQuantity
			subtotal += itemTotal

			return {
				productId: product.id,
				name: product.name,
				sku: product.sku,
				currentPrice,
				expectedPrice: cartItem.expectedPrice ? Number(cartItem.expectedPrice) : undefined,
				priceChanged,
				requestedQuantity,
				availableQuantity: product.stockQuantity,
				effectiveQuantity,
				stockStatus,
				itemTotal: Math.round(itemTotal * 100) / 100,
				hasIssue,
				issueReason
			}
		})

		return {
			isValid: allValid,
			canProceed,
			items: validatedItems,
			subtotal: Math.round(subtotal * 100) / 100,
			currency: 'USD'
		}
	}
}


