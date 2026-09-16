import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'

export enum ReservationStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED'
}

@Entity('stock_reservations')
export class StockReservationEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@Column({ type: 'uuid' })
	orderId!: string

	@Column({ type: 'varchar', length: 64 })
	productId!: string

	@Column({ type: 'int' })
	quantity!: number

	@Column({
		type: 'varchar',
		length: 32,
		default: ReservationStatus.PENDING
	})
	status!: ReservationStatus

	@CreateDateColumn({ type: 'timestamp with time zone' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamp with time zone' })
	updatedAt!: Date
}
