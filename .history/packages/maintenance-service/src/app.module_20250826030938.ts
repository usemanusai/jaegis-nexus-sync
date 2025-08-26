import { Module } from '@nestjs/common'
import { PrismaService } from '../../packages/rag-service/src/prisma/prisma.service'
import { AuditModule } from './audit/audit.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [AuditModule, HealthModule],
  providers: [PrismaService],
})
export class AppModule {}

