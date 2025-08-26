import { Controller, Get, Query } from '@nestjs/common'
import { DepsService } from './deps.service'

@Controller('deps')
export class DepsController {
  constructor(private readonly svc: DepsService) {}

  @Get()
  list(@Query('ecosystem') ecosystem?: string, @Query('vulnerableOnly') vulnerableOnly?: string, @Query('limit') limit?: string) {
    return this.svc.list({ ecosystem, vulnerableOnly: vulnerableOnly==='true', limit: limit?parseInt(limit,10):undefined })
  }
}

