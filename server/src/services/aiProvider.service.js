import env from '../config/env.js'

const providerDefaults = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-3.5-flash',
  claude: 'claude-3-5-haiku-latest',
  mock: 'local-fallback',
}
const providerTimeoutMs = 30000
const geminiMinIntervalMs = 15000
let lastGeminiRequestAt = 0
let geminiQueue = Promise.resolve()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runGeminiQueued = async (task) => {
  const run = async () => {
    const elapsed = Date.now() - lastGeminiRequestAt
    if (elapsed < geminiMinIntervalMs) await wait(geminiMinIntervalMs - elapsed)
    lastGeminiRequestAt = Date.now()
    return task()
  }
  const result = geminiQueue.then(run, run)
  geminiQueue = result.catch(() => {})
  return result
}

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const normalizeProvider = (value) => {
  const provider = String(value || 'gemini').toLowerCase().trim()
  if (['gemni', 'google', 'google-gemini'].includes(provider)) return 'gemini'
  if (['openai', 'gemini', 'claude', 'mock'].includes(provider)) return provider
  return 'mock'
}

const parseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

const providerConfig = () => {
  const provider = normalizeProvider(env.aiProvider)
  const configuredModel = String(env.aiModel || '').trim()
  const model = configuredModel || providerDefaults[provider] || providerDefaults.mock
  return {
    provider,
    model,
    apiKey: provider === 'openai' ? env.openaiApiKey : provider === 'gemini' ? env.geminiApiKey : provider === 'claude' ? env.claudeApiKey : '',
  }
}

const systemInstruction = (schemaHint) => [
  'Return strict JSON only. Do not include markdown fences or commentary outside JSON.',
  schemaHint || '',
  'Write complete, professional, learner-friendly answers that a student can read and act on.',
  'Avoid one-word or two-word answers. Every recommendation, explanation, answer, and action item must be specific and useful.',
  'Use clear sentences, practical examples, and concrete next steps. Prefer 2-4 sentences for each explanation-like field and 4-8 useful items for arrays when the schema allows it.',
  'Keep the JSON keys exactly aligned with the requested schema.',
].filter(Boolean).join(' ')

const callOpenAI = async ({ prompt, schemaHint }) => {
  const config = providerConfig()
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction(schemaHint) },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`)
  const data = await response.json()
  return parseJson(data.choices?.[0]?.message?.content)
}

const callGeminiOnce = async ({ prompt, schemaHint, model }) => {
  const config = providerConfig()
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction(schemaHint)}\n\n${prompt}` }] }],
      generationConfig: { temperature: 0.35, responseMimeType: 'application/json', maxOutputTokens: 6000 },
    }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Gemini request failed: ${response.status}${detail ? ` ${detail.slice(0, 240)}` : ''}`)
  }
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n')
  return parseJson(text)
}

const callGemini = async ({ prompt, schemaHint }) => {
  const config = providerConfig()
  return runGeminiQueued(async () => {
    try {
      return await callGeminiOnce({ prompt, schemaHint, model: config.model })
    } catch (err) {
      if (config.model !== providerDefaults.gemini && /Gemini request failed: (400|404)/.test(err.message)) {
        return callGeminiOnce({ prompt, schemaHint, model: providerDefaults.gemini })
      }
      throw err
    }
  })
}

const callClaude = async ({ prompt, schemaHint }) => {
  const config = providerConfig()
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 3000,
      temperature: 0.4,
      system: systemInstruction(schemaHint),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) throw new Error(`Claude request failed: ${response.status}`)
  const data = await response.json()
  return parseJson(data.content?.[0]?.text)
}

export const generateWithProvider = async ({ prompt, schemaHint, fallback }) => {
  const config = providerConfig()
  if (!config.apiKey || config.provider === 'mock') {
    return { output: fallback(), provider: 'mock', model: providerDefaults.mock, fallback: true }
  }

  try {
    const caller = config.provider === 'openai' ? callOpenAI : config.provider === 'gemini' ? callGemini : config.provider === 'claude' ? callClaude : null
    if (!caller) throw new Error('Unsupported AI provider')
    const output = await caller({ prompt, schemaHint })
    if (!output) throw new Error('AI provider returned invalid JSON')
    return { output, provider: config.provider, model: config.model, fallback: false }
  } catch (err) {
    const message = err.name === 'AbortError'
      ? `AI provider timed out after ${providerTimeoutMs / 1000}s`
      : err.message
    return {
      output: { ...fallback(), providerWarning: 'AI provider failed, local fallback was used.' },
      provider: config.provider,
      model: config.model,
      fallback: true,
      error: message,
    }
  }
}
