import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../rag-service/src/prisma/prisma.service'
import { RedisService } from './redis.service'
import fetch from 'node-fetch'
import path from 'path'
import { scanWorkspaces } from './scanner'
import { parseNpm, parsePyProject, parseRequirements, parseCargo } from './parsers'
import { OsvService } from './osv.service'
import { latestNpmVersion, latestPyPiVersion, latestCratesVersion } from './providers'
import { sameMajorMinor, gt, sameMajorMinorPep, gtPep } from './version'
import { openPR } from './pr.client'

@Injectable()
export class AuditService {
  private _status = { lastRun: null as null | string }
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService, private readonly osv: OsvService) {}

  async runAuditNow() {
    const root = process.cwd()
    const manifests = scanWorkspaces(root)
    // TODO: if vulnerable packages with safe patch updates are detected, prepare PR request(s)
    for (const m of manifests) {
      let deps: Record<string,string> = {}
      if (m.ecosystem === 'npm') deps = parseNpm(path.join(m.path,'package.json'))
      if (m.ecosystem === 'pypi') {
        const reqf = path.join(m.path, 'requirements.txt')
        const pyproj = path.join(m.path, 'pyproject.toml')
        if (require('fs').existsSync(reqf)) Object.assign(deps, parseRequirements(reqf))
        if (require('fs').existsSync(pyproj)) Object.assign(deps, parsePyProject(pyproj))
      }
      if (m.ecosystem === 'cargo') deps = parseCargo(path.join(m.path,'Cargo.toml'))
      const bumpChanges: Array<{ path: string, content: string }> = []
      for (const [name, version] of Object.entries(deps)) {
        await this.upsertDependency(m.ecosystem, name, version)
        const vulns = await this.osv.query(this.toOSVEcosystem(m.ecosystem), name, version)
        for (const v of vulns) await this.storeVulnerability(m.ecosystem, name, v)
        const latest = await this.latestFor(m.ecosystem, name)
        if (latest) {
          const safe = this.isSafePatch(m.ecosystem, version, latest)
          if (safe && this.gtWrapper(m.ecosystem, latest, version)) {
            const filePath = this.bumpInFile(m.ecosystem, m.file, name, latest)
            if (filePath) bumpChanges.push({ path: filePath.path, content: filePath.content })
          }
        }
      }
      if (bumpChanges.length) {
        try { await openPR(bumpChanges, { branch: 'chore/auto-patch-bumps', title: 'chore: auto patch bumps', message: 'Automated safe patch updates' }) } catch {}
      }
    }
    const key = 'nx:last-audit'
    await this.redis.client.set(key, new Date().toISOString())
    this._status.lastRun = new Date().toISOString()
    return { ok: true }
  }

  private toOSVEcosystem(ec: string) {
    if (ec === 'npm') return 'npm'
    if (ec === 'pypi') return 'PyPI'
    if (ec === 'cargo') return 'crates.io'
    return ec
  }

  private async latestFor(ecosystem: string, name: string) {
    if (ecosystem==='npm') return await latestNpmVersion(name)
    if (ecosystem==='pypi') return await latestPyPiVersion(name)
    if (ecosystem==='cargo') return await latestCratesVersion(name)
    return null
  }

  private gtWrapper(ecosystem: string, a: string, b: string) {
    if (ecosystem==='npm' || ecosystem==='cargo') return gt(a,b)
    if (ecosystem==='pypi') return gtPep(a,b)
    return false
  }

  private isSafePatch(ecosystem: string, current: string, latest: string) {
    if (ecosystem==='npm' || ecosystem==='cargo') return sameMajorMinor(current, latest)
    if (ecosystem==='pypi') return sameMajorMinorPep(current, latest)
    return false
  }

  private async upsertDependency(ecosystem: string, name: string, version: string) {
    const dep = await this.prisma.dependency.upsert({
      where: { name_ecosystem: { name, ecosystem } as any },
      update: { currentVersion: version },
      create: { name, ecosystem, currentVersion: version }
    })
    await this.prisma.dependencyVersion.create({ data: { dependencyId: dep.id, version } })
  }

  private async storeVulnerability(ecosystem: string, name: string, v: any) {
    const dep = await this.prisma.dependency.findUnique({ where: { name_ecosystem: { name, ecosystem } as any } })
    if (!dep) return
    const existing = await this.prisma.dependencyVulnerability.findFirst({ where: { dependencyId: dep.id, identifier: v.id } })
    if (existing) return
    const severity = v.severity?.[0]?.score ? String(v.severity[0].score) : undefined
    const url = v.references?.find((r:any)=>r.type==='ADVISORY' || r.type==='WEB')?.url
    await this.prisma.dependencyVulnerability.create({ data: { dependencyId: dep.id, identifier: v.id, severity: severity || 'unknown', summary: v.summary||null, url: url||null } })
  }

  status() { return this._status }
}

