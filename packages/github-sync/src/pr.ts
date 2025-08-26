import type { FastifyInstance } from 'fastify'
import { Octokit } from 'octokit'

export async function registerPR(app: FastifyInstance) {
  app.post('/pr/create', async (req: any) => {
    const { owner = process.env.GH_OWNER, repo = process.env.GH_REPO, branch = 'chore/dep-bump', title = 'chore: dependency bumps', message = 'Automated bumps', changes = [] } = req.body||{}
    const token = process.env.GITHUB_TOKEN
    if (!owner || !repo || !token) return { ok: false, error: 'missing owner/repo/token' }
    const octokit = new Octokit({ auth: token })
    // create branch from default
    const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo })
    const base = repoInfo.default_branch
    const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${base}` })
    const baseSha = ref.object.sha
    try {
      await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseSha })
    } catch {}
    for (const ch of changes) {
      const path = ch.path
      const content = Buffer.from(ch.content,'utf8').toString('base64')
      let sha: string | undefined
      try {
        const existing = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch })
        if (!Array.isArray(existing.data) && 'sha' in existing.data) sha = (existing.data as any).sha
      } catch {}
      await octokit.rest.repos.createOrUpdateFileContents({ owner, repo, path, message: message, content, branch, sha })
    }
    const pr = await octokit.rest.pulls.create({ owner, repo, head: branch, base, title })
    return { ok: true, number: pr.data.number, url: pr.data.html_url }
  })
}

