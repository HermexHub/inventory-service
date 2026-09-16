import { Injectable } from '@nestjs/common'
import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client'

@Injectable()
export class MetricsService {
	private readonly registry: Registry

	public readonly inventoryOperationsTotal: Counter<string>
	public readonly stockLevels: Gauge<string>

	constructor() {
		this.registry = new Registry()

		// System and process metrics
		collectDefaultMetrics({
			register: this.registry,
			prefix: 'hermex_'
		})

		this.inventoryOperationsTotal = new Counter({
			name: 'hermex_inventory_operations_total',
			help: 'Total warehouse inventory operations (reserve, compensate)',
			labelNames: ['operation', 'status'],
			registers: [this.registry]
		})

		this.stockLevels = new Gauge({
			name: 'hermex_inventory_stock_quantity',
			help: 'Current inventory stock quantity per product',
			labelNames: ['product_id'],
			registers: [this.registry]
		})
	}

	recordReservation(status: 'success' | 'failed'): void {
		this.inventoryOperationsTotal.inc({ operation: 'reserve', status })
	}

	recordCompensation(status: 'success' | 'failed'): void {
		this.inventoryOperationsTotal.inc({ operation: 'compensate', status })
	}

	updateStockLevel(productId: string, quantity: number): void {
		this.stockLevels.set({ product_id: productId }, quantity)
	}

	async getMetrics(): Promise<string> {
		return this.registry.metrics()
	}

	getContentType(): string {
		return this.registry.contentType
	}
}
