import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn
} from 'typeorm'

@Entity('products')
@Index(['category'])
@Index(['brand'])
@Index(['stockQuantity'])
@Index(['createdAt'])
@Index(['price'])
export class ProductEntity {
	@PrimaryColumn({ type: 'varchar', length: 64 })
	id!: string

	@Column({ type: 'varchar', length: 255 })
	name!: string

	@Column({ type: 'varchar', length: 64, unique: true })
	sku!: string

	@Column({ type: 'varchar', length: 100, nullable: true })
	brand?: string | null

	@Column({ type: 'varchar', length: 150, nullable: true })
	model?: string | null

	@Column({ type: 'varchar', length: 255, nullable: true })
	slug?: string | null

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	price!: number

	@Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
	oldPrice?: number | null

	@Column({ type: 'int', default: 0 })
	stockQuantity!: number

	@Column({ type: 'int', default: 5 })
	maxOrderQuantity!: number

	@Column({ type: 'boolean', default: true })
	isActive!: boolean

	@Column({ type: 'boolean', default: false })
	isFeatured!: boolean

	@Column({ type: 'varchar', length: 50, nullable: true })
	badge?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true })
	category?: string | null

	@Column({ type: 'varchar', length: 500, nullable: true })
	imageUrl?: string | null

	@Column({ type: 'jsonb', default: () => "'[]'" })
	images!: string[]

	@Column({ type: 'varchar', length: 50, nullable: true })
	color?: string | null

	@Column({ type: 'varchar', length: 10, nullable: true })
	colorHex?: string | null

	@Column({ type: 'jsonb', default: () => "'{}'" })
	description!: Record<string, string>

	@Column({ type: 'jsonb', default: () => "'{}'" })
	specs!: Record<string, string>

	@Column({ type: 'int', default: 24 })
	warrantyMonths!: number

	@Column({ type: 'int', default: 500 })
	weightGrams!: number

	@Column({ type: 'decimal', precision: 3, scale: 1, default: 5.0 })
	rating!: number

	@Column({ type: 'int', default: 0 })
	reviewsCount!: number

	@CreateDateColumn({ type: 'timestamp with time zone' })
	createdAt!: Date

	@UpdateDateColumn({ type: 'timestamp with time zone' })
	updatedAt!: Date
}
