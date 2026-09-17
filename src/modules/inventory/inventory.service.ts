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
		await this.seedProductsIfEmpty()
	}

	private async seedProductsIfEmpty(): Promise<void> {
		try {
			const count = await this.productRepository.count()
			if (count > 0) {
				const first = await this.productRepository.findOne({ where: {} })
				if (first && Number(first.price) < 5000 && first.category === 'Laptops') {
					this.logger.log('Updating catalog prices from USD to UAH (грн)...')
					await this.productRepository.clear()
				} else {
					return
				}
			}

			this.logger.log('Seeding initial products catalog with UAH prices...')
			const seedData: Partial<ProductEntity>[] = [
				{
					id: 'prod-mbp-16',
					name: 'MacBook Pro 16" M3 Max (36GB, 1TB)',
					sku: 'TECH-MBP-16-M3',
					price: 139999,
					stockQuantity: 12,
					category: 'Laptops',
					description: 'Supercharged for pros with Apple M3 Max chip, Liquid Retina XDR display, and 36GB Unified Memory.',
					imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-mba-15',
					name: 'MacBook Air 15" M3 (16GB, 512GB) Space Gray',
					sku: 'TECH-MBA-15-M3',
					price: 64999,
					stockQuantity: 18,
					category: 'Laptops',
					description: 'Impossibly thin design with brilliant 15.3-inch Liquid Retina display and up to 18 hours of battery life.',
					imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-asus-g16',
					name: 'ASUS ROG Zephyrus G16 OLED (RTX 4070, 32GB)',
					sku: 'TECH-ROG-G16',
					price: 89999,
					stockQuantity: 7,
					category: 'Laptops',
					description: 'Ultra-slim gaming powerhouse featuring ROG Nebula OLED 240Hz display and Intel Core Ultra 9 processor.',
					imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-ip15-pro',
					name: 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
					sku: 'SMART-IP15PM-256',
					price: 54999,
					stockQuantity: 24,
					category: 'Smartphones',
					description: 'Aerospace-grade titanium design, A17 Pro chip, customizable Action button, and 5x Telephoto camera.',
					imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-s24-ultra',
					name: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
					sku: 'SMART-S24U-512',
					price: 52999,
					stockQuantity: 15,
					category: 'Smartphones',
					description: 'Galaxy AI is here. Epic camera with 200MP, built-in S Pen, and Snapdragon 8 Gen 3 for Galaxy.',
					imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-sony-xm5',
					name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
					sku: 'AUDIO-SONY-XM5',
					price: 14999,
					stockQuantity: 30,
					category: 'Audio',
					description: 'Industry-leading noise canceling with two processors and 8 microphones for magnificent call quality.',
					imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-bose-ultra',
					name: 'Bose QuietComfort Ultra Headphones',
					sku: 'AUDIO-BOSE-QC',
					price: 16499,
					stockQuantity: 14,
					category: 'Audio',
					description: 'World-class noise cancellation, breakthrough spatialized audio, and elevated luxury design.',
					imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-keychron-q1',
					name: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
					sku: 'PERIPH-KEY-Q1PRO',
					price: 7999,
					stockQuantity: 20,
					category: 'Keyboards',
					description: 'Full aluminum 75% QMK/VIA wireless mechanical keyboard with double-gasket design and PBT keycaps.',
					imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-logi-mx3s',
					name: 'Logitech MX Master 3S Performance Wireless Mouse',
					sku: 'PERIPH-LOGI-MX3S',
					price: 3999,
					stockQuantity: 45,
					category: 'Peripherals',
					description: 'Quiet clicks and 8K DPI any-surface tracking with ultra-fast MagSpeed electromagnetic scrolling wheel.',
					imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-dell-u32',
					name: 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
					sku: 'DISP-DELL-U32',
					price: 36999,
					stockQuantity: 9,
					category: 'Monitors',
					description: 'Brilliant IPS Black technology with 2000:1 contrast ratio, 98% DCI-P3, and integrated 90W USB-C hub.',
					imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-apple-watch',
					name: 'Apple Watch Ultra 2 GPS + Cellular 49mm Titanium',
					sku: 'WEAR-AW-ULTRA2',
					price: 35999,
					stockQuantity: 11,
					category: 'Wearables',
					description: 'Rugged and capable titanium case with precision dual-frequency GPS and up to 36 hours of battery life.',
					imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
				},
				{
					id: 'prod-anker-prime',
					name: 'Anker Prime 20,000mAh 200W Portable Power Bank',
					sku: 'ACC-ANKER-PRIME',
					price: 4699,
					stockQuantity: 35,
					category: 'Accessories',
					description: 'Ultra-fast multi-device charging with smart digital display and compact aerodynamic casing.',
					imageUrl: 'https://images.unsplash.com/photo-1609592426508-cc29a8f4c473?auto=format&fit=crop&w=800&q=80'
				}
			]

			for (const data of seedData) {
				const product = this.productRepository.create(data)
				await this.productRepository.save(product)
			}
			this.logger.log(`Successfully seeded ${seedData.length} products in UAH`)
		} catch (err) {
			this.logger.warn(`Could not seed initial products: ${(err as Error).message}`)
		}
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
				currency: 'UAH'
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
			currency: 'UAH'
		}
	}
}


