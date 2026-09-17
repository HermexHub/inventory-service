import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import {
	INVENTORY_PACKAGE_NAME,
	INVENTORY_PROTO_PATH
} from '@hermex/contracts'
import { GrpcTraceInterceptor, HermexLogger } from '@hermex/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const hermexLogger = new HermexLogger({ serviceName: 'inventory-service' })
	const logger = new Logger('InventoryServiceBootstrap')

	// Bootstrap Hybrid Application: gRPC Microservice + Internal Metrics / AMQP
	const app = await NestFactory.create(AppModule, {
		logger: hermexLogger
	})

	const configService = app.get(ConfigService)
	const grpcHost = configService.get<string>('app.grpcHost') || '0.0.0.0'
	const grpcPort = configService.get<number>('app.grpcPort') || 50053
	const metricsPort = configService.get<number>('app.metricsPort') || 3002

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: INVENTORY_PACKAGE_NAME,
			protoPath: INVENTORY_PROTO_PATH,
			url: `${grpcHost}:${grpcPort}`
		}
	})

	app.useLogger(hermexLogger)
	app.useGlobalInterceptors(new GrpcTraceInterceptor())
	app.enableShutdownHooks()

	await app.startAllMicroservices()
	await app.listen(metricsPort, '0.0.0.0')

	logger.log(
		`🚀 Inventory Service gRPC microservice is running on: ${grpcHost}:${grpcPort}`
	)
	logger.log(
		`📊 Inventory Service internal metrics listening on: http://0.0.0.0:${metricsPort}/metrics`
	)
}

bootstrap()

