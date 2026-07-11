import { test, before, after } from 'node:test'
import assert from 'node:assert'
import mongoose from 'mongoose'
import app from '../app.js'
import connectDB from '../config/db.js'

let server
let baseUrl

before(async () => {
  // Connect to database
  await connectDB()
  
  // Start server on a random port
  server = app.listen(0)
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  // Clean up connections
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await mongoose.disconnect()
})

test('GET /health returns healthy status', async () => {
  const response = await fetch(`${baseUrl}/health`)
  assert.strictEqual(response.status, 200)
  const data = await response.json()
  assert.strictEqual(data.status, 'ok')
  assert.strictEqual(data.database, 'connected')
})

test('GET /readiness returns database connected', async () => {
  const response = await fetch(`${baseUrl}/readiness`)
  assert.strictEqual(response.status, 200)
  const data = await response.json()
  assert.strictEqual(data.status, 'ready')
  assert.strictEqual(data.database, 'connected')
})

test('GET /api-docs returns swagger page', async () => {
  const response = await fetch(`${baseUrl}/api-docs/`)
  assert.ok(response.status === 200 || response.status === 301 || response.status === 302)
})

test('Security headers (Helmet/CSP) are present', async () => {
  const response = await fetch(`${baseUrl}/health`)
  const csp = response.headers.get('content-security-policy')
  assert.ok(csp, 'Content-Security-Policy header should be present')
  assert.ok(csp.includes("default-src 'self'"), 'CSP should include self source restriction')
})

test('NoSQL Injection check is active', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      '$gt': 'test',
      'password': 'test'
    })
  })
  
  // rejectUnsafeRequestKeys should reject $ keys with 400 Bad Request
  assert.strictEqual(response.status, 400)
  const data = await response.json()
  assert.strictEqual(data.code, 'INVALID_REQUEST')
})

test('xssSanitizer middleware sanitizes HTML but ignores passwords, tokens, and URLs', () => {
  const req = {
    body: {
      name: '<script>alert(1)</script> Ajay',
      password: 'password&with/special/chars',
      website: 'https://example.com/user',
      token: 'some/token/value'
    }
  }
  const res = {}
  const next = () => {}

  // Run the middleware
  import('../middlewares/xssMiddleware.js').then((module) => {
    const xssSanitizer = module.default
    xssSanitizer(req, res, next)

    assert.strictEqual(req.body.name, '&lt;script&gt;alert(1)&lt;&#x2F;script&gt; Ajay')
    assert.strictEqual(req.body.password, 'password&with/special/chars')
    assert.strictEqual(req.body.website, 'https://example.com/user')
    assert.strictEqual(req.body.token, 'some/token/value')
  })
})
