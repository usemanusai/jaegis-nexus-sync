import 'dotenv/config'
import Fastify from 'fastify'
import { registerWebhook } from './webhook.js'
import { startScheduler } from './scheduler.js'

const app = Fastify({ logger: true })

await registerWebhook(app)
startScheduler()

const port = Number(process.env.GH_SYNC_PORT || 33031)
app.listen({ port, host: '0.0.0.0' }).catch((e)=>{
  app.log.error(e)
  process.exit(1)
})

