import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { HermexLogger } from '@hermex/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const hermexLogger = new HermexLogger({ serviceName: 'inventory-service' })
	const app = await NestFactory.create(AppModule, {
		logger: hermexLogger
	})
	app.useLogger(hermexLogger)
	app.enableShutdownHooks()

	const configService = app.get(ConfigService)
	const metricsPort = configService.get<number>('app.metricsPort') || 3002

	await app.listen(metricsPort, '0.0.0.0')

	const logger = new Logger('InventoryServiceBootstrap')
	logger.log('🚀 Inventory Service AMQP worker is running')
	logger.log(
		`📊 Inventory Service internal metrics listening on: http://0.0.0.0:${metricsPort}/metrics`
	)
}

bootstrap()
