import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
	nodeEnv: process.env.NODE_ENV!,
	metricsPort: Number(process.env.METRICS_PORT),
	grpcHost: process.env.GRPC_HOST,
	grpcPort: Number(process.env.GRPC_PORT)
}))

