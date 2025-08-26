import 'reflect-metadata'
import * as dotenv from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api/v1')
  // Security headers & CORS
  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: '*', maxAge: 86400 })
  const port = Number(process.env.MAINTENANCE_PORT || 33041)
  const server = await app.listen(port)
  console.log(`Maintenance service on http://localhost:${port}`)
  // Graceful shutdown
  const shutdown = async ()=>{ await app.close(); process.exit(0) }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
bootstrap()

