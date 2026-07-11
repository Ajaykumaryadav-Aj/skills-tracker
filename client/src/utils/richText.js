const allowedTags = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DIV',
  'EM',
  'H3',
  'H4',
  'I',
  'LI',
  'OL',
  'P',
  'PRE',
  'S',
  'STRONG',
  'U',
  'UL',
])

const normalizeHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || '').trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    return parsed.href
  } catch {
    return ''
  }
}

const cleanNode = (node, doc) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent)
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const tagName = node.tagName.toUpperCase()
  const children = Array.from(node.childNodes)

  if (!allowedTags.has(tagName)) {
    const fragment = doc.createDocumentFragment()
    children.forEach((child) => {
      const cleanChild = cleanNode(child, doc)
      if (cleanChild) fragment.appendChild(cleanChild)
    })
    return fragment
  }

  const cleanElement = doc.createElement(tagName.toLowerCase())

  if (tagName === 'A') {
    const href = normalizeHttpUrl(node.getAttribute('href'))
    if (href) {
      cleanElement.setAttribute('href', href)
      cleanElement.setAttribute('target', '_blank')
      cleanElement.setAttribute('rel', 'noopener noreferrer')
    }
  }

  children.forEach((child) => {
    const cleanChild = cleanNode(child, doc)
    if (cleanChild) cleanElement.appendChild(cleanChild)
  })

  return cleanElement
}

export const sanitizeRichText = (html = '') => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return String(html || '')
  }

  const parser = new DOMParser()
  const sourceDoc = parser.parseFromString(`<div>${String(html || '')}</div>`, 'text/html')
  const output = document.createElement('div')

  Array.from(sourceDoc.body.firstChild?.childNodes || []).forEach((node) => {
    const cleanChild = cleanNode(node, document)
    if (cleanChild) output.appendChild(cleanChild)
  })

  return output.innerHTML
}

export const getRichTextPlainText = (html = '') => {
  if (typeof document === 'undefined') {
    return String(html || '').replace(/<[^>]*>/g, '').trim()
  }

  const container = document.createElement('div')
  container.innerHTML = sanitizeRichText(html)
  return container.textContent.trim()
}

export const isRichTextEmpty = (html = '') => getRichTextPlainText(html).length === 0

