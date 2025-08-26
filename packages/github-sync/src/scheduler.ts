import cron from 'node-cron'
import { syncRepo } from './index.js'

export function startScheduler() {
  const owner = process.env.GH_OWNER
  const repo = process.env.GH_REPO
  if (!owner || !repo) return
  const spec = process.env.GH_SYNC_CRON || '0 * * * *' // hourly
  cron.schedule(spec, async () => {
    console.log('Scheduled GitHub sync start')
    await syncRepo(owner, repo, process.env.GITHUB_TOKEN)
    console.log('Scheduled GitHub sync done')
  })
}

