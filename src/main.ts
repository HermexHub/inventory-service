import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { HermexLogger } from '@hermex/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const hermexLogger = new HermexLogger({ serviceName: 'inventory-service' })
	const app = await NestFactory.createApplicationContext(AppModule, {
		logger: hermexLogger
	})
	app.useLogger(hermexLogger)
	app.enableShutdownHooks()

	const logger = new Logger('InventoryServiceBootstrap')
	logger.log('🚀 Inventory Service is running')
}

bootstrap()
