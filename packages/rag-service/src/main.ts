import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Load base .env then overlay MODE-specific file if present
dotenv.config();
dotenv.config({ path: process.env.MODE === 'hybrid' ? '.env.hybrid' : '.env.local' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // CORS + graceful shutdown
  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: '*', maxAge: 86400 });
  const port = Number(process.env.PORT || 33001);
  const server = await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`RAG service listening on http://localhost:${port}`);
  const shutdown = async ()=>{ await app.close(); process.exit(0) };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
bootstrap();

