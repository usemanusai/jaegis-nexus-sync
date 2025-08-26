import 'dotenv/config'
import Fastify from 'fastify'
import { registerWebhook } from './webhook.js'
import { startScheduler } from './scheduler.js'
import { registerHealth } from './health.js'
import { registerPR } from './pr.js'
import { requireJWT } from './auth.js'

const app = Fastify({ logger: true })
app.addHook('preHandler', requireJWT)

await registerWebhook(app)
await registerHealth(app)
await registerPR(app)
startScheduler()

const port = Number(process.env.GH_SYNC_PORT || 33031)
app.listen({ port, host: '0.0.0.0' }).catch((e)=>{
  app.log.error(e)
  process.exit(1)
})

