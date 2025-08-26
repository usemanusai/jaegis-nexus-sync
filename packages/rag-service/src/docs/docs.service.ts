import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DocsService {
  constructor(private readonly prisma: PrismaService) {}

  recent(limit = 10) {
    return this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: { id: true, title: true, source: true, createdAt: true }
    })
  }
}

