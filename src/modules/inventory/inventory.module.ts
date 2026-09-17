import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { ProcessedEventEntity } from './entities/processed-event.entity'
import { ProductEntity } from './entities/product.entity'
import { StockReservationEntity } from './entities/stock-reservation.entity'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ProductEntity,
			StockReservationEntity,
			ProcessedEventEntity
		]),
		RabbitMQModule
	],
	controllers: [InventoryController],
	providers: [InventoryService],
	exports: [InventoryService]
})
export class InventoryModule {}

