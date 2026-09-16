import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const logger = new Logger('InventoryServiceBootstrap')

	const app = await NestFactory.createApplicationContext(AppModule)
	app.enableShutdownHooks()

	logger.log(
		'🚀 Inventory Service is running'
	)
}

bootstrap()
