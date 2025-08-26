import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../rag-service/src/prisma/prisma.service'

@Injectable()
export class DepsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ ecosystem, vulnerableOnly, limit }: { ecosystem?: string, vulnerableOnly?: boolean, limit?: number }) {
    const deps = await this.prisma.dependency.findMany({
      where: { ecosystem: ecosystem || undefined },
      include: { vulnerabilities: true },
      take: limit && limit > 0 ? Math.min(limit, 200) : 100
    })
    return deps.map(d => ({
      name: d.name,
      ecosystem: d.ecosystem,
      currentVersion: d.currentVersion,
      vulnerabilityCount: d.vulnerabilities.length,
      topSeverity: d.vulnerabilities.reduce((acc, v)=> (acc > (v.severity||'')) ? acc : (v.severity||''), ''),
    })).filter(x => vulnerableOnly ? x.vulnerabilityCount > 0 : true)
  }
}

