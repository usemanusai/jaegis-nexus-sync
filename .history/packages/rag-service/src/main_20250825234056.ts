import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

dotenv.config({ path: process.env.MODE === 'hybrid' ? '.env.hybrid' : '.env.local' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT || 3000);
  // eslint-disable-next-line no-console
  console.log(`RAG service listening on http://localhost:${process.env.PORT || 3000}`);
}
bootstrap();

