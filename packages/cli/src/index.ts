#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import fetch from 'node-fetch'

const program = new Command()
program.name('nexus').description('NexusSync CLI').version('0.1.0')

const RAG = process.env.RAG_URL || 'http://localhost:33001'
const GH_SVC = process.env.GH_SYNC_URL || 'http://localhost:33031'
const RAG_API_KEY = process.env.RAG_API_KEY
const authHeaders = () => ({ 'Content-Type': 'application/json', ...(RAG_API_KEY ? { 'x-api-key': RAG_API_KEY } : {}) })
const MS = process.env.MAINTENANCE_URL || 'http://localhost:33041'


program
  .command('query')
  .description('Query the RAG service')
  .argument('<text>', 'query text')
  .action(async (text) => {
    const res = await fetch(`${RAG}/api/v1/query`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ query: text }) })
    const json = await res.json()
    console.log(JSON.stringify(json, null, 2))
  })

program
  .command('resync')
  .description('Trigger GitHub resync (uses GH_OWNER/GH_REPO env)')
  .action(async () => {
    const res = await fetch(`${GH_SVC}/webhook/github`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-github-event': 'push' }, body: JSON.stringify({}) })
    const json = await res.json()
    console.log(json)
  })

program
  .command('recent')
  .description('Show recent ingests')
  .option('--limit <n>', 'limit results', '10')
  .action(async (opts) => {
    const res = await fetch(`${RAG}/api/v1/docs/recent?limit=${encodeURIComponent(opts.limit)}`, { headers: authHeaders() })
    const json = await res.json()

program
  .command('maint')
  .description('Maintenance controls')
  .command('run')
  .action(async ()=>{
    const r = await fetch(`${MS}/api/v1/audit/run`, { method:'POST' })
    console.log(await r.json())
  })

program
  .command('maint:status')
  .description('Maintenance status')
  .action(async ()=>{
    const r = await fetch(`${MS}/api/v1/audit/status`)
    console.log(await r.json())
  })

program
  .command('maint:list')
  .description('List deps (vulnerable first)')
  .option('--limit <n>','limit','50')
  .action(async (opts)=>{
    const r = await fetch(`${MS}/api/v1/deps?vulnerableOnly=true&limit=${encodeURIComponent(opts.limit)}`)
    console.log(await r.json())
  })

    console.log(JSON.stringify(json, null, 2))
  })

program.parseAsync()

