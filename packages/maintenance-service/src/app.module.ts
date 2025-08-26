import { Module } from '@nestjs/common'
import { PrismaService } from '../../packages/rag-service/src/prisma/prisma.service'
import { AuditModule } from './audit/audit.module'
import { HealthModule } from './health/health.module'
import { DepsController } from './deps/deps.controller'
import { DepsService } from './deps/deps.service'
import { NarrativeService } from './narrative/narrative.service'

@Module({
  imports: [AuditModule, HealthModule],
  controllers: [DepsController],
  providers: [PrismaService, DepsService, NarrativeService],
})
export class AppModule {}

