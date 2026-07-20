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

test('GET /admin/settings returns 401 Unauthenticated when token is missing', async () => {
  const response = await fetch(`${baseUrl}/api/admin/settings`)
  assert.strictEqual(response.status, 401)
})

test('GET /admin/users returns 401 when token is missing', async () => {
  const response = await fetch(`${baseUrl}/api/admin/users`)
  assert.strictEqual(response.status, 401)
})

test('GET /admin/audit-logs returns 401 when token is missing', async () => {
  const response = await fetch(`${baseUrl}/api/admin/audit-logs`)
  assert.strictEqual(response.status, 401)
})
