import { useEffect, useMemo, useState, useRef } from 'react'
import {
  BookOpenText,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  Image as ImageIcon,
  Pencil,
  Pin,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
  Video,
  Terminal,
  Bold,
  Italic,
  List,
  CheckSquare,
  Globe
} from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as noteResourceService from '../services/noteResourceService'
import * as skillService from '../services/skillService'
import { cn, ui } from '../utils/tw'

const resourceTypes = ['YouTube', 'Documentation', 'GitHub', 'Website', 'PDF', 'Course']
const emptyNote = { title: '', content: '', tags: '', pinned: false, favorite: false }
const emptyResource = { title: '', url: '', type: 'Website', description: '', file: null }

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const highlightCode = (code) => escapeHtml(code)
  .replace(/\b(const|let|var|function|return|import|export|from|if|else|for|while|class|new|async|await|try|catch)\b/g, '<span class="code-keyword">$1</span>')
  .replace(/\b(true|false|null|undefined)\b/g, '<span class="code-literal">$1</span>')
  .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="code-string">$1</span>')

const markdownToHtml = (markdown) => {
  const blocks = []
  let text = String(markdown || '').replace(/```(\w+)?\n([\s\S]*?)```/g, (_, language = 'text', code) => {
    const token = `@@CODE_${blocks.length}@@`
    blocks.push(`<pre class="markdown-code"><span>${escapeHtml(language)}</span><code>${highlightCode(code)}</code></pre>`)
    return token
  })
  text = escapeHtml(text)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- \[ \] (.*)$/gm, '<p class="checklist">[ ] $1</p>')
    .replace(/^- \[x\] (.*)$/gim, '<p class="checklist">[x] $1</p>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')
  text = `<p>${text}</p>`.replace(/<p><li>/g, '<ul><li>').replace(/<\/li><\/p>/g, '</li></ul>')
  blocks.forEach((html, index) => { text = text.replace(`@@CODE_${index}@@`, html) })
  return text
}

const getPlainExcerpt = (md) => {
  if (!md) return 'No content.'
  return md
    .replace(/#+\s+/g, '') 
    .replace(/`{3}[\s\S]*?`{3}/g, '') 
    .replace(/`.*?`/g, '') 
    .replace(/\[\s?[x ]\s?\]/gi, '') 
    .replace(/[-*+>]\s+/g, '') 
    .replace(/\*\*(.*?)\*\*/g, '$1') 
    .replace(/\*(.*?)\*/g, '$1') 
    .trim() || 'No preview text.'
}

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'

// ─── CUSTOM EMPTY STATE COMPONENT ───────────────────────────────────────────

function EmptyState({ title, description, icon: Icon, onAction, actionLabel, disabled }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-line bg-white p-8 text-center min-h-[220px]">
      <div className="flex size-11 items-center justify-center rounded-full bg-emerald-pale text-emerald-dark-brand mb-3">
        <Icon size={20} />
      </div>
      <h4 className="text-sm font-black text-ink">{title}</h4>
      <p className="mt-1 text-xs text-ink-soft max-w-xs">{description}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className={cn(ui.button.base, ui.button.primary, 'mt-4 px-3.5 py-1.5 text-xs bg-emerald-brand text-white border-emerald-brand hover:bg-emerald-dark-brand disabled:opacity-50')}
        >
          <Plus size={14} /> {actionLabel}
        </button>
      )}
    </div>
  )
}

// ─── MODULE RESOURCE ICON GETTER ─────────────────────────────────────────────

const getResourceIcon = (type) => {
  if (type === 'YouTube') return Video
  if (type === 'PDF') return FileText
  if (type === 'GitHub') return Terminal
  if (type === 'Documentation') return BookOpenText
  if (type === 'Course') return BookOpenText
  return Globe
}

// ─── MAIN NOTES & RESOURCES COMPONENT ────────────────────────────────────────

export default function Notes() {
  const [skills, setSkills] = useState([])
  const [selection, setSelection] = useState({ skillId: '', topicId: '' })
  const [notes, setNotes] = useState([])
  const [resources, setResources] = useState([])
  const [globalResults, setGlobalResults] = useState({ notes: [], resources: [] })
  
  // Instant search value state
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState({ tag: '', type: '', sort: 'updated-desc', page: 1, limit: 6 })
  const [pagination, setPagination] = useState({ notes: { page: 1, totalPages: 1, total: 0 }, resources: { page: 1, totalPages: 1, total: 0 } })
  
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [resourceModalOpen, setResourceModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [editingResource, setEditingResource] = useState(null)
  const [noteForm, setNoteForm] = useState(emptyNote)
  const [resourceForm, setResourceForm] = useState(emptyResource)
  const [viewingNote, setViewingNote] = useState(null)
  
  // Create Note modal layout tab (for mobile)
  const [noteModalTab, setNoteModalTab] = useState('write') // 'write' | 'preview'
  
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedSkill = useMemo(() => skills.find((skill) => skill._id === selection.skillId), [skills, selection.skillId])
  const topicOptions = selectedSkill?.topics || []
  const activeTopic = topicOptions.find((topic) => topic._id === selection.topicId)
  const tagOptions = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags || []))).sort(), [notes])

  // Combined filters for API query
  const apiFilters = useMemo(() => ({
    search: searchValue,
    ...filters
  }), [searchValue, filters])

  const loadHub = async (nextSelection = selection, nextFilters = apiFilters) => {
    if (!nextSelection.skillId || !nextSelection.topicId) return
    setLoading(true)
    try {
      const hubRes = await noteResourceService.getKnowledgeHub(nextSelection.skillId, nextSelection.topicId, nextFilters)
      setNotes(hubRes.data.notes || [])
      setResources(hubRes.data.resources || [])
      setPagination(hubRes.data.pagination || { notes: { page: 1, totalPages: 1, total: 0 }, resources: { page: 1, totalPages: 1, total: 0 } })
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load knowledge hub')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const skillsRes = await skillService.getAllSkills()
        if (ignore) return
        const nextSkills = skillsRes.data.skills || []
        const firstSkill = nextSkills.find((skill) => skill.topics?.length)
        const firstTopic = firstSkill?.topics?.[0]
        setSkills(nextSkills)
        if (firstSkill && firstTopic) {
          const nextSelection = { skillId: firstSkill._id, topicId: firstTopic._id }
          setSelection(nextSelection)
          const hubRes = await noteResourceService.getKnowledgeHub(firstSkill._id, firstTopic._id, apiFilters)
          if (!ignore) {
            setNotes(hubRes.data.notes || [])
            setResources(hubRes.data.resources || [])
            setPagination(hubRes.data.pagination || { notes: { page: 1, totalPages: 1, total: 0 }, resources: { page: 1, totalPages: 1, total: 0 } })
          }
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load notes')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  // Instantly search while typing (with 300ms debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (selection.skillId && selection.topicId) {
        loadHub(selection, apiFilters)
        if (searchValue.trim()) {
          noteResourceService.globalKnowledgeSearch({ search: searchValue.trim() }).then((res) => {
            setGlobalResults(res.data)
          }).catch(() => {})
        } else {
          setGlobalResults({ notes: [], resources: [] })
        }
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchValue])

  const handleFilterSelectChange = (name, value) => {
    const nextFilters = { ...filters, [name]: value, page: 1 }
    setFilters(nextFilters)
    loadHub(selection, { search: searchValue, ...nextFilters })
  }

  const updateSelection = (field, value) => {
    const next = { ...selection, [field]: value, ...(field === 'skillId' ? { topicId: '' } : {}) }
    if (field === 'skillId') {
      const skill = skills.find((item) => item._id === value)
      next.topicId = skill?.topics?.[0]?._id || ''
    }
    setSelection(next)
    if (next.skillId && next.topicId) loadHub(next, apiFilters)
  }

  const changePage = (page) => {
    const nextFilters = { ...filters, page }
    setFilters(nextFilters)
    loadHub(selection, { search: searchValue, ...nextFilters })
  }

  const openNoteModal = (note = null) => {
    setEditingNote(note)
    setNoteForm(note ? { title: note.title || '', content: note.content || '', tags: (note.tags || []).join(', '), pinned: Boolean(note.pinned), favorite: Boolean(note.favorite) } : emptyNote)
    setNoteModalTab('write')
    setNoteModalOpen(true)
  }

  const openResourceModal = (resource = null) => {
    setEditingResource(resource)
    setResourceForm(resource ? { title: resource.title || '', url: resource.url || '', type: resource.type || 'Website', description: resource.description || '', file: null } : emptyResource)
    setResourceModalOpen(true)
  }

  const saveNote = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...noteForm, tags: noteForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
      if (editingNote) await noteResourceService.updateNoteItem(selection.skillId, selection.topicId, editingNote._id, payload)
      else await noteResourceService.createNoteItem(selection.skillId, selection.topicId, payload)
      setNoteModalOpen(false)
      setSuccess(editingNote ? 'Note updated.' : 'Note created.')
      await loadHub()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Unable to save note')
    } finally {
      setSaving(false)
    }
  }

  const saveResource = async (event) => {
    event.preventDefault()
    if (resourceForm.url && !resourceForm.url.startsWith('http://') && !resourceForm.url.startsWith('https://')) {
      setError('Resource URL must be a valid link starting with http:// or https://')
      return
    }
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('title', resourceForm.title)
      payload.append('url', resourceForm.url)
      payload.append('type', resourceForm.type)
      payload.append('description', resourceForm.description)
      if (resourceForm.file) payload.append('file', resourceForm.file)
      if (editingResource) await noteResourceService.updateResource(selection.skillId, selection.topicId, editingResource._id, payload)
      else await noteResourceService.addResource(selection.skillId, selection.topicId, payload)
      setResourceModalOpen(false)
      setSuccess(editingResource ? 'Resource updated.' : 'Resource created.')
      await loadHub()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Unable to save resource')
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    await noteResourceService.deleteNoteItem(selection.skillId, selection.topicId, noteId)
    await loadHub()
  }

  const deleteResource = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return
    await noteResourceService.deleteResource(selection.skillId, selection.topicId, resourceId)
    await loadHub()
  }

  // Markdown editor insertion toolbar helper
  const insertMarkdown = (syntaxBefore, syntaxAfter = '') => {
    const textarea = document.getElementById('note-content')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = syntaxBefore + selected + syntaxAfter
    setNoteForm((curr) => ({ ...curr, content: text.substring(0, start) + replacement + text.substring(end) }))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + syntaxBefore.length, start + syntaxBefore.length + selected.length)
    }, 50)
  }

  return (
    <div className="grid gap-5">
      <Toast message={success} onClose={() => setSuccess('')} />
      <PageHeader
        eyebrow="Knowledge hub"
        title="Notes & Resources"
        description="Capture topic notes, files, links, and references."
        icon={BookOpenText}
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              className={cn(ui.button.base, ui.button.primary, 'w-full sm:w-auto bg-emerald-brand text-white border-emerald-brand hover:bg-emerald-dark-brand')}
              onClick={() => openNoteModal()}
              disabled={!selection.topicId}
            >
              <Plus size={17} /> Add note
            </button>
            <button
              type="button"
              className={cn(ui.button.base, ui.button.secondary, 'w-full sm:w-auto border-line bg-white hover:bg-surface text-ink')}
              onClick={() => openResourceModal()}
              disabled={!selection.topicId}
            >
              <Plus size={17} /> Add resource
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* COMPACT FILTER BAR IN ONE RESPONSIVE ROW */}
      <section className={cn(ui.panel, 'p-4')}>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end">
          <div>
            <label className="text-[10px] font-black uppercase text-ink-muted mb-1 block" htmlFor="hub-skill">Skill</label>
            <div className={ui.field.control}>
              <select className={cn(ui.field.input, 'appearance-none py-1.5 text-xs min-h-9')} id="hub-skill" value={selection.skillId} onChange={(event) => updateSelection('skillId', event.target.value)}>
                <option value="">Choose skill</option>
                {skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}
              </select>
              <ChevronDown className="text-ink-muted shrink-0" size={13} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-ink-muted mb-1 block" htmlFor="hub-topic">Topic</label>
            <div className={ui.field.control}>
              <select className={cn(ui.field.input, 'appearance-none py-1.5 text-xs min-h-9')} id="hub-topic" value={selection.topicId} onChange={(event) => updateSelection('topicId', event.target.value)}>
                <option value="">Choose topic</option>
                {topicOptions.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}
              </select>
              <ChevronDown className="text-ink-muted shrink-0" size={13} />
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 md:col-span-1">
            <label className="text-[10px] font-black uppercase text-ink-muted mb-1 block" htmlFor="hub-search">Search</label>
            <div className={ui.field.control}>
              <Search size={14} className="text-ink-muted shrink-0" />
              <input className={cn(ui.field.input, 'py-1.5 text-xs min-h-9')} id="hub-search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Type to search..." />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-ink-muted mb-1 block" htmlFor="hub-tag">Tag</label>
            <div className={ui.field.control}>
              <select className={cn(ui.field.input, 'appearance-none py-1.5 text-xs min-h-9')} id="hub-tag" value={filters.tag} onChange={(event) => handleFilterSelectChange('tag', event.target.value)}>
                <option value="">All tags</option>
                {tagOptions.map((tag) => <option key={tag}>{tag}</option>)}
              </select>
              <ChevronDown className="text-ink-muted shrink-0" size={13} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-ink-muted mb-1 block" htmlFor="hub-type">Resource type</label>
            <div className={ui.field.control}>
              <select className={cn(ui.field.input, 'appearance-none py-1.5 text-xs min-h-9')} id="hub-type" value={filters.type} onChange={(event) => handleFilterSelectChange('type', event.target.value)}>
                <option value="">All types</option>
                {resourceTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <ChevronDown className="text-ink-muted shrink-0" size={13} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-ink-muted mb-1 block" htmlFor="hub-sort">Sort</label>
            <div className={ui.field.control}>
              <select className={cn(ui.field.input, 'appearance-none py-1.5 text-xs min-h-9')} id="hub-sort" value={filters.sort} onChange={(event) => handleFilterSelectChange('sort', event.target.value)}>
                <option value="updated-desc">Recently updated</option>
                <option value="updated-asc">Oldest updated</option>
                <option value="created-desc">Newest created</option>
                <option value="created-asc">Oldest created</option>
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
              </select>
              <ChevronDown className="text-ink-muted shrink-0" size={13} />
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT PANEL GRID */}
      <div className="grid gap-5 lg:grid-cols-2">
        
        {/* NOTES SECTION */}
        <section className={cn(ui.panel, 'grid gap-4 min-w-0')}>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">{activeTopic?.title || 'Topic'}</p>
              <h2 className="mt-1 text-xl font-black text-ink">Notes</h2>
            </div>
            <span className="rounded-full bg-emerald-pale px-2.5 py-0.5 text-xs font-bold text-emerald-dark-brand">
              {pagination.notes.total || 0}
            </span>
          </div>

          {loading ? (
            <p className="rounded-card border border-dashed border-line bg-surface-raised p-6 text-center text-sm text-ink-soft">Loading notes...</p>
          ) : notes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Capture your thoughts, code explanations, and concepts for this topic."
              icon={FileText}
              onAction={() => openNoteModal()}
              actionLabel="Create first note"
              disabled={!selection.topicId}
            />
          ) : (
            <div className="grid gap-3">
              {notes.map((note) => (
                <article
                  key={note._id}
                  onClick={() => setViewingNote(note)}
                  className={cn(
                    'group relative rounded-card border border-line bg-white p-4 hover:border-line-strong hover:shadow-card-hover transition min-w-0 cursor-pointer',
                    note.pinned && 'border-emerald-brand bg-emerald-pale/5'
                  )}
                >
                  {/* Action buttons panel shown on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition absolute top-3 right-3 flex items-center gap-1.5 bg-white border border-line p-1 rounded-card shadow-xs z-10">
                    <button
                      type="button"
                      className="p-1 text-ink-muted hover:text-emerald-brand hover:bg-emerald-pale rounded transition"
                      onClick={(e) => {
                        e.stopPropagation()
                        noteResourceService.toggleNotePin(selection.skillId, selection.topicId, note._id).then(() => loadHub())
                      }}
                      title="Pin note"
                    >
                      <Pin size={13} className={note.pinned ? 'text-emerald-brand fill-emerald-brand' : ''} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-ink-muted hover:text-red-500 hover:bg-red-50 rounded transition"
                      onClick={(e) => {
                        e.stopPropagation()
                        noteResourceService.toggleNoteFavorite(selection.skillId, selection.topicId, note._id).then(() => loadHub())
                      }}
                      title="Favorite note"
                    >
                      <Heart size={13} className={note.favorite ? 'text-red-500 fill-red-500' : ''} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-ink-muted hover:text-blue-brand hover:bg-blue-pale rounded transition"
                      onClick={(e) => {
                        e.stopPropagation()
                        openNoteModal(note)
                      }}
                      title="Edit note"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded transition"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNote(note._id)
                      }}
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="min-w-0 pr-24">
                    <h3 className="text-base font-black text-ink truncate">{note.title}</h3>
                    <p className="mt-1 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                      {getPlainExcerpt(note.content)}
                    </p>
                    
                    {/* Tags & meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-ink-muted">
                      <span>Updated {formatDate(note.updatedAt)}</span>
                      {note.tags?.length > 0 && <span className="text-line-strong">•</span>}
                      {(note.tags || []).map((tag) => (
                        <span key={tag} className="rounded border border-line bg-surface-raised px-1.5 py-0.5 text-ink-soft">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {notes.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 mt-1">
              <span className="text-xs text-ink-soft">Page {filters.page} of {pagination.notes.totalPages || 1}</span>
              <div className="flex gap-2">
                <button type="button" className={cn(ui.button.base, ui.button.secondary, 'py-1 px-2.5 text-xs min-h-8')} disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Prev</button>
                <button type="button" className={cn(ui.button.base, ui.button.secondary, 'py-1 px-2.5 text-xs min-h-8')} disabled={filters.page >= (pagination.notes.totalPages || 1)} onClick={() => changePage(filters.page + 1)}>Next</button>
              </div>
            </div>
          )}
        </section>

        {/* RESOURCES SECTION */}
        <section className={cn(ui.panel, 'grid gap-4 min-w-0')}>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">References</p>
              <h2 className="mt-1 text-xl font-black text-ink">Resources</h2>
            </div>
            <span className="rounded-full bg-emerald-pale px-2.5 py-0.5 text-xs font-bold text-emerald-dark-brand">
              {pagination.resources.total || 0}
            </span>
          </div>

          {loading ? (
            <p className="rounded-card border border-dashed border-line bg-surface-raised p-6 text-center text-sm text-ink-soft">Loading resources...</p>
          ) : resources.length === 0 ? (
            <EmptyState
              title="No resources yet"
              description="Add web links, documents, videos, and articles for reference."
              icon={ExternalLink}
              onAction={() => openResourceModal()}
              actionLabel="Add first resource"
              disabled={!selection.topicId}
            />
          ) : (
            <div className="grid gap-3">
              {resources.map((resource) => {
                const Icon = getResourceIcon(resource.type)
                return (
                  <article
                    key={resource._id}
                    className="group relative rounded-card border border-line bg-white p-4 hover:border-line-strong hover:shadow-card-hover transition flex gap-3 min-w-0"
                  >
                    {/* Hover actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition absolute top-3 right-3 flex items-center gap-1.5 bg-white border border-line p-1 rounded-card shadow-xs z-10">
                      <button
                        type="button"
                        className="p-1 text-ink-muted hover:text-emerald-brand hover:bg-emerald-pale rounded transition"
                        onClick={() => openResourceModal(resource)}
                        title="Edit resource"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded transition"
                        onClick={() => deleteResource(resource._id)}
                        title="Delete resource"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Left Type Icon */}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-emerald-pale text-emerald-dark-brand">
                      <Icon size={16} />
                    </div>

                    {/* Right Info */}
                    <div className="min-w-0 flex-1 pr-16">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-ink truncate leading-tight">{resource.title}</h3>
                        <span className="shrink-0 text-[10px] rounded border border-line bg-surface-raised px-1 py-0.5 font-extrabold text-ink-soft">
                          {resource.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                        {resource.description || resource.url}
                      </p>

                      <div className="mt-3.5 flex flex-wrap gap-2 items-center">
                        <a
                          href={resource.file?.url || resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(ui.button.base, ui.button.secondary, 'py-1 px-2.5 text-[10px] min-h-7 inline-flex items-center gap-1 bg-white hover:bg-surface border-line')}
                        >
                          <ExternalLink size={10} /> Open link
                        </a>
                        {resource.file?.url && (
                          <a
                            href={resource.file.url}
                            download
                            className={cn(ui.button.base, ui.button.secondary, 'py-1 px-2.5 text-[10px] min-h-7 inline-flex items-center gap-1 bg-white hover:bg-surface border-line')}
                          >
                            <Download size={10} /> Download
                          </a>
                        )}
                        <button
                          type="button"
                          className={cn('p-1 rounded transition ml-auto', resource.favorite ? 'text-red-500 hover:bg-red-50' : 'text-ink-muted hover:bg-surface')}
                          onClick={() => noteResourceService.toggleResourceFavorite(selection.skillId, selection.topicId, resource._id).then(() => loadHub())}
                          title="Favorite"
                        >
                          <Heart size={13} className={resource.favorite ? 'fill-red-500 text-red-500' : ''} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {resources.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 mt-1">
              <span className="text-xs text-ink-soft">Page {filters.page} of {pagination.resources.totalPages || 1}</span>
              <div className="flex gap-2">
                <button type="button" className={cn(ui.button.base, ui.button.secondary, 'py-1 px-2.5 text-xs min-h-8')} disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Prev</button>
                <button type="button" className={cn(ui.button.base, ui.button.secondary, 'py-1 px-2.5 text-xs min-h-8')} disabled={filters.page >= (pagination.resources.totalPages || 1)} onClick={() => changePage(filters.page + 1)}>Next</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* GLOBAL MATCHES */}
      {searchValue.trim() && (
        <section className={cn(ui.panel, 'grid gap-4')}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Global search</p>
              <h2 className="mt-1 text-xl font-black text-ink">Matches across all topics</h2>
            </div>
            <Search size={20} className="text-emerald-dark-brand" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className={ui.field.label}>Notes</h3>
              {(globalResults.notes || []).length === 0 ? (
                <p className="rounded-card border border-dashed border-line bg-surface-raised p-6 text-center text-sm text-ink-soft">No note matches.</p>
              ) : (
                <div className="grid gap-2">
                  {(globalResults.notes || []).map((note) => (
                    <article key={note._id} className={cn(ui.card, 'p-4')}>
                      <h3 className="font-black text-ink text-sm">{note.title}</h3>
                      <p className="mt-1 text-[11px] text-ink-soft">{note.skill?.title} / {note.topic?.title}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className={ui.field.label}>Resources</h3>
              {(globalResults.resources || []).length === 0 ? (
                <p className="rounded-card border border-dashed border-line bg-surface-raised p-6 text-center text-sm text-ink-soft">No resource matches.</p>
              ) : (
                <div className="grid gap-2">
                  {(globalResults.resources || []).map((resource) => (
                    <article key={resource._id} className={cn(ui.card, 'p-4')}>
                      <h3 className="font-black text-ink text-sm">{resource.title}</h3>
                      <p className="mt-1 text-[11px] text-ink-soft">{resource.skill?.title} / {resource.topic?.title}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CREATE/EDIT NOTE MODAL WITH SIDE-BY-SIDE EDITOR & PREVIEW ── */}
      <Modal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNote ? 'Edit note' : 'Create note'}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={saveNote} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={ui.field.label} htmlFor="note-title">Title</label>
              <div className={ui.field.control}>
                <input className={cn(ui.field.input, 'min-h-10 text-sm')} id="note-title" value={noteForm.title} onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))} required />
              </div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="note-tags">Tags</label>
              <div className={ui.field.control}>
                <input className={cn(ui.field.input, 'min-h-10 text-sm')} id="note-tags" value={noteForm.tags} onChange={(event) => setNoteForm((current) => ({ ...current, tags: event.target.value }))} placeholder="react, hooks, css" />
              </div>
            </div>
          </div>

          {/* Desktop/Tablet side-by-side view, Mobile tabs view */}
          <div className="grid md:grid-cols-2 gap-4 border-t border-line pt-3">
            {/* Editor Pane (always visible on desktop, visible on mobile when tab is 'write') */}
            <div className={cn('flex flex-col min-w-0', noteModalTab !== 'write' && 'hidden md:flex')}>
              <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2">
                <span className="text-[10px] font-black uppercase text-ink-muted">Editor Workspace</span>
                
                {/* Mobile tab toggle */}
                <div className="flex md:hidden rounded border border-line p-0.5 bg-surface text-[10px] font-bold">
                  <button type="button" className={cn('px-2 py-0.5 rounded', noteModalTab === 'write' ? 'bg-white shadow-xs' : '')} onClick={() => setNoteModalTab('write')}>Write</button>
                  <button type="button" className={cn('px-2 py-0.5 rounded', noteModalTab === 'preview' ? 'bg-white shadow-xs' : '')} onClick={() => setNoteModalTab('preview')}>Preview</button>
                </div>
              </div>

              {/* Horizontal Markdown Toolbar */}
              <div className="flex flex-wrap gap-1 rounded bg-surface border border-line p-1.5 mb-2 text-xs">
                <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1 hover:bg-white rounded transition font-bold" title="Bold">B</button>
                <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-1 hover:bg-white rounded transition italic" title="Italic">I</button>
                <button type="button" onClick={() => insertMarkdown('`', '`')} className="p-1 hover:bg-white rounded transition font-mono" title="Inline code">Code</button>
                <button type="button" onClick={() => insertMarkdown('## ')} className="p-1 hover:bg-white rounded transition" title="Heading H2">H2</button>
                <button type="button" onClick={() => insertMarkdown('- ')} className="p-1 hover:bg-white rounded transition" title="Bullet List">• List</button>
                <button type="button" onClick={() => insertMarkdown('- [ ] ')} className="p-1 hover:bg-white rounded transition" title="Todo Checklist">☑ Todo</button>
              </div>

              <div className={ui.field.control}>
                <textarea
                  className={cn(ui.field.input, 'min-h-[280px] md:min-h-[350px] max-h-[480px] p-3 text-xs leading-5 font-mono overflow-y-auto')}
                  id="note-content"
                  placeholder="Start writing notes using markdown..."
                  value={noteForm.content}
                  onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Preview Pane (always visible on desktop, visible on mobile when tab is 'preview') */}
            <div className={cn('flex flex-col min-w-0', noteModalTab !== 'preview' && 'hidden md:flex')}>
              <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2">
                <span className="text-[10px] font-black uppercase text-ink-muted">Real-time Markdown Preview</span>
                
                {/* Mobile tab toggle */}
                <div className="flex md:hidden rounded border border-line p-0.5 bg-surface text-[10px] font-bold">
                  <button type="button" className={cn('px-2 py-0.5 rounded', noteModalTab === 'write' ? 'bg-white shadow-xs' : '')} onClick={() => setNoteModalTab('write')}>Write</button>
                  <button type="button" className={cn('px-2 py-0.5 rounded', noteModalTab === 'preview' ? 'bg-white shadow-xs' : '')} onClick={() => setNoteModalTab('preview')}>Preview</button>
                </div>
              </div>

              <div className="min-h-[280px] md:min-h-[400px] max-h-[480px] overflow-y-auto rounded-card border border-line bg-surface-raised p-4">
                {noteForm.content ? (
                  <div className="prose prose-sm max-w-none text-ink" dangerouslySetInnerHTML={{ __html: markdownToHtml(noteForm.content) }} />
                ) : (
                  <p className="text-xs text-ink-muted italic">Live rendering of your notes will appear here...</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end border-t border-line pt-3.5">
            <button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => setNoteModalOpen(false)}>
              <X size={16} /> Cancel
            </button>
            <button type="submit" disabled={saving} className={cn(ui.button.base, ui.button.primary, 'bg-emerald-brand text-white border-emerald-brand')}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── CREATE/EDIT RESOURCE MODAL WITH FILE DROP AREA & URL VALIDATION ── */}
      <Modal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title={editingResource ? 'Edit resource' : 'Create resource'}
      >
        <form onSubmit={saveResource} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={ui.field.label} htmlFor="resource-title">Title</label>
              <div className={ui.field.control}>
                <input className={cn(ui.field.input, 'min-h-10 text-sm')} id="resource-title" value={resourceForm.title} onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))} required />
              </div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="resource-type">Type</label>
              <div className={ui.field.control}>
                <select className={cn(ui.field.input, 'appearance-none py-1.5 text-xs min-h-10')} id="resource-type" value={resourceForm.type} onChange={(event) => setResourceForm((current) => ({ ...current, type: event.target.value }))}>
                  {resourceTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
                <ChevronDown className="text-ink-muted shrink-0" size={15} />
              </div>
            </div>
          </div>

          <div>
            <label className={ui.field.label} htmlFor="resource-url">URL</label>
            <div className={ui.field.control}>
              <input className={cn(ui.field.input, 'min-h-10 text-sm')} id="resource-url" value={resourceForm.url} onChange={(event) => setResourceForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={ui.field.label} htmlFor="resource-file">Attachment (Optional)</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-line rounded-card p-6 bg-surface hover:bg-surface-raised/40 transition relative cursor-pointer group">
              <Upload size={22} className="text-ink-muted group-hover:text-emerald-brand transition mb-1.5" />
              <p className="text-xs text-ink font-bold">
                {resourceForm.file ? resourceForm.file.name : 'Click to select or drop a file'}
              </p>
              <p className="text-[10px] text-ink-muted mt-0.5">Supports PDF, JPG, PNG, WEBP, ZIP (max 10MB)</p>
              <input
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="resource-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.zip"
                onChange={(event) => setResourceForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
              />
            </div>
          </div>

          <div>
            <label className={ui.field.label} htmlFor="resource-description">Description</label>
            <div className={ui.field.control}>
              <textarea className={cn(ui.field.input, 'min-h-24 p-3 text-xs leading-5')} id="resource-description" rows="3" value={resourceForm.description} onChange={(event) => setResourceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Provide a brief summary of this resource..." />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end border-t border-line pt-3.5">
            <button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => setResourceModalOpen(false)}>
              <X size={16} /> Cancel
            </button>
            <button type="submit" disabled={saving} className={cn(ui.button.base, ui.button.primary, 'bg-emerald-brand text-white border-emerald-brand')}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save resource'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW NOTE READ-ONLY MODAL */}
      <Modal
        open={Boolean(viewingNote)}
        onClose={() => setViewingNote(null)}
        title={viewingNote?.title || 'View Note'}
        maxWidth="max-w-3xl"
      >
        {viewingNote && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <span>Updated {formatDate(viewingNote.updatedAt)}</span>
              {viewingNote.tags?.length > 0 && <span className="text-line-strong">•</span>}
              {(viewingNote.tags || []).map((tag) => (
                <span key={tag} className="rounded border border-line bg-surface-raised px-1.5 py-0.5 text-ink-soft font-bold">
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-sm max-w-none text-ink bg-surface-raised p-5 border border-line rounded-card max-h-[55vh] overflow-y-auto leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(viewingNote.content) }} />
            </div>

            <div className="flex flex-wrap gap-2 justify-end border-t border-line pt-3">
              <button
                type="button"
                className={cn(ui.button.base, ui.button.secondary)}
                onClick={() => setViewingNote(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={cn(ui.button.base, ui.button.primary, 'bg-emerald-brand text-white border-emerald-brand inline-flex items-center gap-1.5')}
                onClick={() => {
                  const noteToEdit = viewingNote
                  setViewingNote(null)
                  openNoteModal(noteToEdit)
                }}
              >
                <Pencil size={14} /> Edit Note
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
