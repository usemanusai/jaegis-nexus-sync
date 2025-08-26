import { Controller, Get, Query } from '@nestjs/common'
import { DocsService } from './docs.service'

@Controller('docs')
export class DocsController {
  constructor(private readonly svc: DocsService) {}

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 10
    return this.svc.recent(isNaN(n) ? 10 : n)
  }
}

