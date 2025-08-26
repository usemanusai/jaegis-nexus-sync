import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../rag-service/src/prisma/prisma.service'
import { RedisService } from './redis.service'
import fetch from 'node-fetch'

@Injectable()
export class AuditService {
  private _status = { lastRun: null as null | string }
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async runAuditNow() {
    const key = 'nx:last-audit'
    await this.redis.client.set(key, new Date().toISOString())
    this._status.lastRun = new Date().toISOString()
    // TODO: scan workspaces and record dependencies
    return { ok: true }
  }

  status() { return this._status }
}

