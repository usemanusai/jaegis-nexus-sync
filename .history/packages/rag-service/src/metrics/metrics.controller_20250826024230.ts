import { Controller, Get, Res } from '@nestjs/common'
import type { Response } from 'express'
import { MetricsService } from './metrics.service'

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async get(@Res() res: Response) {
    const body = await this.metrics.render()
    res.setHeader('Content-Type', 'text/plain; version=0.0.4')
    res.send(body)
  }
}

