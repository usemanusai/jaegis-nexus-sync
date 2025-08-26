import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

dotenv.config({ path: process.env.MODE === 'hybrid' ? '.env.hybrid' : '.env.local' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const port = Number(process.env.PORT || 33001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`RAG service listening on http://localhost:${port}`);
}
bootstrap();

