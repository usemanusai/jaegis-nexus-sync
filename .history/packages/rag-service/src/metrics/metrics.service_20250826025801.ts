import { Injectable } from '@nestjs/common'
import client, { Counter } from 'prom-client'

@Injectable()
export class MetricsService {
  private registered = false
  ingestsQueued!: Counter<string>
  queriesServed!: Counter<string>

  constructor() {
    if (!this.registered) {
      client.collectDefaultMetrics()
      this.ingestsQueued = new client.Counter({ name: 'nexus_ingests_queued_total', help: 'Total ingests queued' })
      this.queriesServed = new client.Counter({ name: 'nexus_queries_served_total', help: 'Total queries served' })
      this.registered = true
    }
  }

  async render() {
    return await client.register.metrics()
  }
}

