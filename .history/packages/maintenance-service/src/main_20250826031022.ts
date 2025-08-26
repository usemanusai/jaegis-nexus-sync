import 'reflect-metadata'
import * as dotenv from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api/v1')
  const port = Number(process.env.MAINTENANCE_PORT || 33041)
  await app.listen(port)
  console.log(`Maintenance service on http://localhost:${port}`)
}
bootstrap()

