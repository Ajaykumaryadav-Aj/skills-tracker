import { useEffect, useMemo, useRef, useState } from 'react'
import { Bold, Braces, Heading3, Italic, Link2, List, ListOrdered, Pencil, Plus, Quote, Save, Underline, X } from 'lucide-react'
import * as noteResourceService from '../services/noteResourceService'
import { getRichTextPlainText, isRichTextEmpty, sanitizeRichText } from '../utils/richText'

const maxNoteLength = 10000

const toolbarGroups = [
  [
    { icon: Bold, title: 'Bold', command: 'bold' },
    { icon: Italic, title: 'Italic', command: 'italic' },
    { icon: Underline, title: 'Underline', command: 'underline' },
  ],
  [
    { icon: Heading3, title: 'Heading', command: 'formatBlock', value: 'h3' },
    { icon: Quote, title: 'Quote', command: 'formatBlock', value: 'blockquote' },
    { icon: Braces, title: 'Code block', command: 'formatBlock', value: 'pre' },
  ],
  [
    { icon: List, title: 'Bullet list', command: 'insertUnorderedList' },
    { icon: ListOrdered, title: 'Numbered list', command: 'insertOrderedList' },
  ],
]

const makeEmptyDocument = () => '<p><br></p>'

export default function NotesEditor({ skillId, topicId, initialContent = '', onSave }) {
  const editorRef = useRef(null)
  const cleanInitialContent = useMemo(() => sanitizeRichText(initialContent), [initialContent])
  const [content, setContent] = useState(cleanInitialContent)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState(null)

  useEffect(() => {
    if (!editing || !editorRef.current) return
    editorRef.current.innerHTML = content || makeEmptyDocument()
    // The editor DOM should be hydrated only when edit mode opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, topicId])

  const syncEditorContent = () => {
    if (!editorRef.current) return ''

    const sanitized = sanitizeRichText(editorRef.current.innerHTML)
    if (sanitized.length > maxNoteLength) {
      const trimmed = sanitized.slice(0, maxNoteLength)
      editorRef.current.innerHTML = trimmed
      setContent(trimmed)
      setError(`Note must be ${maxNoteLength} characters or less.`)
      return trimmed
    }

    setContent(sanitized)
    setError('')
    return sanitized
  }

  const runCommand = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncEditorContent()
  }

  const addLink = () => {
    const rawUrl = window.prompt('Paste a URL')
    if (!rawUrl) return

    try {
      const parsed = new URL(rawUrl.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('Links must use http or https.')
        return
      }
      runCommand('createLink', parsed.href)
    } catch {
      setError('Enter a valid URL.')
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    const remaining = maxNoteLength - content.length
    document.execCommand('insertText', false, text.slice(0, Math.max(remaining, 0)))
    syncEditorContent()
  }

  const handleSave = async () => {
    const cleanContent = sanitizeRichText(editorRef.current?.innerHTML || content)

    if (cleanContent.length > maxNoteLength) {
      setError(`Note must be ${maxNoteLength} characters or less.`)
      return
    }

    try {
      setSaving(true)
      setError('')

      if (isRichTextEmpty(cleanContent)) {
        if (!isRichTextEmpty(cleanInitialContent)) {
          await noteResourceService.deleteNote(skillId, topicId)
        }
        setContent('')
      } else {
        await noteResourceService.updateNote(skillId, topicId, { content: cleanContent })
        setContent(cleanContent)
      }

      setLastSavedAt(new Date())
      setEditing(false)
      onSave?.()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(cleanInitialContent)
    setEditing(false)
    setError('')
  }

  const textCount = getRichTextPlainText(content).length

  if (!editing && isRichTextEmpty(content)) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface-raised p-4 text-center">
        <p className="text-sm text-ink-soft">No notes yet.</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 rounded-lg border border-emerald-brand/20 px-3 py-2 text-sm font-medium text-emerald-dark-brand hover:bg-emerald-pale"
        >
          <Plus size={16} className="mr-1 inline" aria-hidden="true" /> Add note
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-raised p-2">
            {toolbarGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-1 border-r border-line pr-2 last:border-r-0">
                {group.map((item) => {
                  const Icon = item.icon
                  return (
                  <button
                    key={`${item.command}-${item.title}`}
                    type="button"
                    title={item.title}
                    aria-label={item.title}
                    onClick={() => runCommand(item.command, item.value)}
                    className="grid min-h-9 min-w-9 place-items-center rounded-md border border-line bg-white px-2 text-sm text-ink hover:bg-emerald-pale"
                  >
                    <Icon size={16} aria-hidden="true" />
                  </button>
                  )
                })}
              </div>
            ))}
            <button
              type="button"
              title="Link"
              aria-label="Add link"
              onClick={addLink}
              className="grid min-h-9 min-w-9 place-items-center rounded-md border border-line bg-white px-2 text-sm text-ink hover:bg-emerald-pale"
            >
              <Link2 size={16} aria-hidden="true" />
            </button>
            <span className="ml-auto text-xs text-ink-muted">{textCount} chars</span>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncEditorContent}
            onBlur={syncEditorContent}
            onPaste={handlePaste}
            className="min-h-44 rounded-lg border border-line bg-white px-4 py-3 text-left text-sm leading-6 text-ink outline-none focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/10 [&_blockquote]:border-l-4 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-md [&_pre]:bg-emerald-pale [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-6"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Boolean(error)}
              className="rounded-lg bg-emerald-brand px-4 py-2 text-sm font-medium text-white hover:bg-emerald-brand hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} className="mr-1 inline" aria-hidden="true" /> {saving ? 'Saving...' : 'Save notes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-surface-raised disabled:opacity-50"
            >
              <X size={16} className="mr-1 inline" aria-hidden="true" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-white p-4 text-left">
          <div
            className="text-sm leading-6 text-ink [&_a]:text-emerald-dark-brand [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-md [&_pre]:bg-emerald-pale [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-emerald-dark-brand hover:underline"
            >
              <Pencil size={15} className="mr-1 inline" aria-hidden="true" /> Edit
            </button>
            {lastSavedAt && (
              <span className="text-xs text-ink-muted">
                Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
