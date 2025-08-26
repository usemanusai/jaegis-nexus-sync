import 'dotenv/config'
import Fastify from 'fastify'
import { registerWebhook } from './webhook.js'
import { startScheduler } from './scheduler.js'
import { registerHealth } from './health.js'
import fastifyRawBody from '@fastify/raw-body'

const app = Fastify({ logger: true })

await app.register(fastifyRawBody, { field: 'rawBody', global: true, encoding: 'utf8', runFirst: true })
await registerWebhook(app)
await registerHealth(app)
startScheduler()

const port = Number(process.env.GH_SYNC_PORT || 33031)
app.listen({ port, host: '0.0.0.0' }).catch((e)=>{
  app.log.error(e)
  process.exit(1)
})

