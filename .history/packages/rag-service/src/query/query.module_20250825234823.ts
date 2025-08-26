import { Module } from '@nestjs/common';
import { QueryController } from './query.controller.js';
import { QueryService } from './query.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [QueryController],
  providers: [QueryService, PrismaService],
})
export class QueryModule {}

