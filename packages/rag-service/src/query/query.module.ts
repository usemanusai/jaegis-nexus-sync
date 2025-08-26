import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [QueryController],
  providers: [QueryService, PrismaService],
})
export class QueryModule {}

