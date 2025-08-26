import 'dotenv/config'
import Fastify from 'fastify'
import { syncRepo } from './index.js'

const app = Fastify({ logger: true })

app.post('/webhook/github', async (req, reply) => {
  // Placeholder: trigger a sync for a configured repo on webhook
  const owner = process.env.GH_OWNER
  const repo = process.env.GH_REPO
  if (!owner || !repo) return reply.code(400).send({error:'missing GH_OWNER/GH_REPO'})
  await syncRepo(owner, repo, process.env.GITHUB_TOKEN)
  return { ok: true }
})

const port = Number(process.env.GH_SYNC_PORT || 33031)
app.listen({ port, host: '0.0.0.0' }).catch((e)=>{
  app.log.error(e)
  process.exit(1)
})

