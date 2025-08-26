import { Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { RedisService } from './redis.service'
import { PrismaService } from '../../rag-service/src/prisma/prisma.service'
import { OsvService } from './osv.service'

@Module({
  providers: [AuditService, RedisService, PrismaService, OsvService],
  controllers: [AuditController]
})
export class AuditModule {}

