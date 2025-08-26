import { Controller, Get, Post } from '@nestjs/common'
import { AuditService } from './audit.service'

@Controller('audit')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Post('run')
  run() { return this.svc.runAuditNow() }

  @Get('status')
  status() { return this.svc.status() }
}

