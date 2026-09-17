import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn
} from 'typeorm'

@Entity('products')
@Index(['stockQuantity'])
@Index(['createdAt'])
@Index(['category'])
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

	@Column({ type: 'text', nullable: true })
	description?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true })
	category?: string | null

	@Column({ type: 'varchar', length: 500, nullable: true })
	imageUrl?: string | null

	@CreateDateColumn({ type: 'timestamp with time zone' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamp with time zone' })
	updatedAt!: Date
}

