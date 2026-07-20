import { test, before, after } from 'node:test'
import assert from 'node:assert'
import mongoose from 'mongoose'
import app from '../app.js'
import connectDB from '../config/db.js'

let server
let baseUrl

before(async () => {
  await connectDB()
  server = app.listen(0)
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await mongoose.disconnect()
})

test('GET /api/search returns 401 Unauthenticated when token is missing', async () => {
  const response = await fetch(`${baseUrl}/api/search?q=test`)
  assert.strictEqual(response.status, 401)
})

test('GET /health returns memory, cpu usage and latency stats', async () => {
  const response = await fetch(`${baseUrl}/health`)
  assert.strictEqual(response.status, 200)
  const data = await response.json()
  assert.ok(data.system, 'system information must exist')
  assert.ok(data.system.memory, 'memory usage info must exist')
  assert.ok(data.system.cpu, 'cpu usage info must exist')
  assert.ok(data.metrics, 'metrics block must exist')
  assert.ok(typeof data.metrics.apiLatencyAverageMs === 'number', 'latency must be a number')
})
