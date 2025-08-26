import { Injectable } from '@nestjs/common'
import IORedis from 'ioredis'

@Injectable()
export class RedisService {
  client: IORedis
  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:56379'
    this.client = new IORedis(url)
  }
}

