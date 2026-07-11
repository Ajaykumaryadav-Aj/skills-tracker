const allowedTags = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h3',
  'h4',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'u',
  'ul',
])

const blockedTagPattern =
  /<\s*(script|style|iframe|object|embed|svg|math|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const blockedSelfClosingPattern =
  /<\s*(script|style|iframe|object|embed|svg|math|template)\b[^>]*\/?\s*>/gi

const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const normalizeHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || '').trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    return parsed.href
  } catch {
    return ''
  }
}

const decodeCommonEntities = (value) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

export const sanitizeRichText = (html = '') => {
  const source = String(html).slice(0, 10000)
  const withoutBlockedTags = source
    .replace(blockedTagPattern, '')
    .replace(blockedSelfClosingPattern, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  return withoutBlockedTags.replace(
    /<\s*(\/?)\s*([a-z0-9]+)([^>]*)>/gi,
    (match, closingSlash, rawTagName, rawAttributes = '') => {
      const tagName = rawTagName.toLowerCase()
      if (!allowedTags.has(tagName)) return ''

      if (closingSlash) return tagName === 'br' ? '' : `</${tagName}>`
      if (tagName === 'br') return '<br>'

      if (tagName === 'a') {
        const hrefMatch = rawAttributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i)
        const href = normalizeHttpUrl(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '')
        if (!href) return '<a>'
        return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
      }

      return `<${tagName}>`
    },
  )
}

export const richTextToPlainText = (html = '') =>
  decodeCommonEntities(
    sanitizeRichText(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h3|h4|blockquote|pre)>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )

export const isRichTextBlank = (html = '') => richTextToPlainText(html).trim().length === 0
