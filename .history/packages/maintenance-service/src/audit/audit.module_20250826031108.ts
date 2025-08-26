import { Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { RedisService } from './redis.service'
import { PrismaService } from '../../rag-service/src/prisma/prisma.service'

@Module({
  providers: [AuditService, RedisService, PrismaService],
  controllers: [AuditController]
})
export class AuditModule {}

