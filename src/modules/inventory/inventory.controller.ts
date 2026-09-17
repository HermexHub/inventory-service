import { Controller } from '@nestjs/common'
import { GrpcMethod, Payload } from '@nestjs/microservices'
import {
	GetProductByIdRequest,
	GetProductByIdResponse,
	GetProductsRequest,
	GetProductsResponse,
	INVENTORY_GRPC_METHODS,
	INVENTORY_SERVICE_NAME,
	ValidateCartRequest,
	ValidateCartResponse
} from '@hermex/contracts'
import { InventoryService } from './inventory.service'

@Controller()
export class InventoryController {
	constructor(private readonly inventoryService: InventoryService) {}

	@GrpcMethod(INVENTORY_SERVICE_NAME, INVENTORY_GRPC_METHODS.GET_PRODUCTS)
	async getProducts(
		@Payload() data: GetProductsRequest
	): Promise<GetProductsResponse> {
		return this.inventoryService.getProducts(data)
	}

	@GrpcMethod(INVENTORY_SERVICE_NAME, INVENTORY_GRPC_METHODS.GET_PRODUCT_BY_ID)
	async getProductById(
		@Payload() data: GetProductByIdRequest
	): Promise<GetProductByIdResponse> {
		const product = await this.inventoryService.getProductById(data.id)
		return { product }
	}

	@GrpcMethod(INVENTORY_SERVICE_NAME, INVENTORY_GRPC_METHODS.VALIDATE_CART)
	async validateCart(
		@Payload() data: ValidateCartRequest
	): Promise<ValidateCartResponse> {
		return this.inventoryService.validateCart(data.items || [])
	}
}
