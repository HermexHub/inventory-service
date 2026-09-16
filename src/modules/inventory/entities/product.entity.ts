import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryColumn,
	UpdateDateColumn
} from 'typeorm'

@Entity('products')
export class ProductEntity {
	@PrimaryColumn({ type: 'varchar', length: 64 })
	id!: string

	@Column({ type: 'varchar', length: 255 })
	name!: string

	@Column({ type: 'varchar', length: 64, unique: true })
	sku!: string

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	price!: number

	@Column({ type: 'int', default: 0 })
	stockQuantity!: number

	@CreateDateColumn({ type: 'timestamp with time zone' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamp with time zone' })
	updatedAt!: Date
}
