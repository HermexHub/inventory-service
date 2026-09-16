import { CreateDateColumn, Entity, PrimaryColumn, Column } from 'typeorm'

@Entity('processed_events')
export class ProcessedEventEntity {
	@PrimaryColumn({ type: 'varchar', length: 128 })
	eventId!: string

	@Column({ type: 'varchar', length: 128 })
	eventType!: string

	@CreateDateColumn({ type: 'timestamp with time zone' })
	processedAt!: Date
}
