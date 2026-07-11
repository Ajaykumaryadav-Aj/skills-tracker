import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, ChevronDown, Download, ExternalLink, Eye, FileText, Filter, Heart, Image as ImageIcon, Pencil, Pin, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import CommentsPanel from '../components/CommentsPanel'
import * as collaborationService from '../services/collaborationService'
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

export default function Notes() {
  const [skills, setSkills] = useState([])
  const [selection, setSelection] = useState({ skillId: '', topicId: '' })
  const [notes, setNotes] = useState([])
  const [resources, setResources] = useState([])
  const [globalResults, setGlobalResults] = useState({ notes: [], resources: [] })
  const [stats, setStats] = useState({ totalNotes: 0, totalResources: 0, recentlyUpdatedNotes: [], favoriteResources: [] })
  const [filters, setFilters] = useState({ search: '', tag: '', type: '', sort: 'updated-desc', page: 1, limit: 6 })
  const [pagination, setPagination] = useState({ notes: { page: 1, totalPages: 1, total: 0 }, resources: { page: 1, totalPages: 1, total: 0 } })
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [resourceModalOpen, setResourceModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [editingResource, setEditingResource] = useState(null)
  const [noteForm, setNoteForm] = useState(emptyNote)
  const [resourceForm, setResourceForm] = useState(emptyResource)
  const [preview, setPreview] = useState(false)
  const [openComments, setOpenComments] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedSkill = useMemo(() => skills.find((skill) => skill._id === selection.skillId), [skills, selection.skillId])
  const topicOptions = selectedSkill?.topics || []
  const activeTopic = topicOptions.find((topic) => topic._id === selection.topicId)
  const tagOptions = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags || []))).sort(), [notes])

  const loadStats = async () => {
    const res = await noteResourceService.getKnowledgeStats()
    setStats(res.data)
  }

  const loadHub = async (nextSelection = selection, nextFilters = filters) => {
    if (!nextSelection.skillId || !nextSelection.topicId) return
    setLoading(true)
    try {
      const [hubRes] = await Promise.all([
        noteResourceService.getKnowledgeHub(nextSelection.skillId, nextSelection.topicId, nextFilters),
        loadStats(),
      ])
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

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const [skillsRes, statsRes] = await Promise.all([skillService.getAllSkills(), noteResourceService.getKnowledgeStats()])
        if (ignore) return
        const nextSkills = skillsRes.data.skills || []
        const firstSkill = nextSkills.find((skill) => skill.topics?.length)
        const firstTopic = firstSkill?.topics?.[0]
        setSkills(nextSkills)
        setStats(statsRes.data)
        if (firstSkill && firstTopic) {
          const nextSelection = { skillId: firstSkill._id, topicId: firstTopic._id }
          setSelection(nextSelection)
          const hubRes = await noteResourceService.getKnowledgeHub(firstSkill._id, firstTopic._id, filters)
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
  // Initial load should use the default filters once; subsequent filter changes are applied explicitly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSelection = (field, value) => {
    const next = { ...selection, [field]: value, ...(field === 'skillId' ? { topicId: '' } : {}) }
    if (field === 'skillId') {
      const skill = skills.find((item) => item._id === value)
      next.topicId = skill?.topics?.[0]?._id || ''
    }
    setSelection(next)
    if (next.skillId && next.topicId) loadHub(next, filters)
  }

  const applyFilters = async () => {
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    await loadHub(selection, nextFilters)
    if (filters.search.trim()) {
      const res = await noteResourceService.globalKnowledgeSearch({ search: filters.search.trim() })
      setGlobalResults(res.data)
    } else {
      setGlobalResults({ notes: [], resources: [] })
    }
  }
  const resetFilters = () => { const next = { search: '', tag: '', type: '', sort: 'updated-desc', page: 1, limit: 6 }; setFilters(next); setGlobalResults({ notes: [], resources: [] }); loadHub(selection, next) }
  const changePage = (page) => {
    const next = { ...filters, page }
    setFilters(next)
    loadHub(selection, next)
  }

  const openNoteModal = (note = null) => {
    setEditingNote(note)
    setNoteForm(note ? { title: note.title || '', content: note.content || '', tags: (note.tags || []).join(', '), pinned: Boolean(note.pinned), favorite: Boolean(note.favorite) } : emptyNote)
    setPreview(false)
    setNoteModalOpen(true)
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

  const openResourceModal = (resource = null) => {
    setEditingResource(resource)
    setResourceForm(resource ? { title: resource.title || '', url: resource.url || '', type: resource.type || 'Website', description: resource.description || '', file: null } : emptyResource)
    setResourceModalOpen(true)
  }

  const bookmarkTarget = async (targetType, targetId) => {
    try {
      await collaborationService.toggleBookmark(targetType, targetId)
      setSuccess(targetType === 'note' ? 'Note bookmark updated.' : 'Resource bookmark updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update bookmark')
    }
  }

  return (
    <div className="grid gap-5">
      <Toast message={success} onClose={() => setSuccess('')} />
      <PageHeader eyebrow="Knowledge hub" title="Notes & Resources" description="Capture topic notes, files, links, and references." icon={BookOpenText} actions={<button type="button" className={cn(ui.button.base, ui.button.primary)} onClick={() => openNoteModal()} disabled={!selection.topicId}><Plus size={17} /> Add note</button>} />

      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total notes', stats.totalNotes || 0],
          ['Total resources', stats.totalResources || 0],
          ['Recent notes', stats.recentlyUpdatedNotes?.length || 0],
          ['Favorite resources', stats.favoriteResources?.length || 0],
        ].map(([label, value]) => (
          <article className={cn(ui.card, 'p-5')} key={label}>
            <span className="text-xs font-extrabold uppercase text-ink-soft">{label}</span>
            <p className="mt-3 text-3xl font-black text-ink">{value}</p>
          </article>
        ))}
      </section>

      <section className={ui.panel}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div><label className={ui.field.label} htmlFor="hub-skill">Skill</label><div className={ui.field.control}><select className={ui.field.input} id="hub-skill" value={selection.skillId} onChange={(event) => updateSelection('skillId', event.target.value)}><option value="">Choose skill</option>{skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div></div>
          <div><label className={ui.field.label} htmlFor="hub-topic">Topic</label><div className={ui.field.control}><select className={ui.field.input} id="hub-topic" value={selection.topicId} onChange={(event) => updateSelection('topicId', event.target.value)}><option value="">Choose topic</option>{topicOptions.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div></div>
          <div><label className={ui.field.label} htmlFor="hub-search">Search</label><div className={ui.field.control}><Search size={17} className="text-ink-muted" /><input className={ui.field.input} id="hub-search" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></div></div>
          <div><label className={ui.field.label} htmlFor="hub-tag">Tag</label><div className={ui.field.control}><select className={ui.field.input} id="hub-tag" value={filters.tag} onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}><option value="">All tags</option>{tagOptions.map((tag) => <option key={tag}>{tag}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div></div>
          <div><label className={ui.field.label} htmlFor="hub-type">Resource type</label><div className={ui.field.control}><select className={ui.field.input} id="hub-type" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="">All types</option>{resourceTypes.map((type) => <option key={type}>{type}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div></div>
          <div><label className={ui.field.label} htmlFor="hub-sort">Sort</label><div className={ui.field.control}><select className={ui.field.input} id="hub-sort" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}><option value="updated-desc">Recently updated</option><option value="updated-asc">Oldest updated</option><option value="created-desc">Newest created</option><option value="created-asc">Oldest created</option><option value="title-asc">A-Z</option><option value="title-desc">Z-A</option></select><ChevronDown className="text-ink-muted" size={16} /></div></div>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3"><button type="button" className={cn(ui.button.base, ui.button.primary)} onClick={applyFilters}><Filter size={16} /> Apply</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={resetFilters}><X size={16} /> Reset</button></div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={cn(ui.panel, 'grid gap-4')}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">{activeTopic?.title || 'Topic'}</p><h2 className="mt-1 text-xl font-black text-ink">Notes</h2></div><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => openNoteModal()} disabled={!selection.topicId}><Plus size={16} /> Note</button></div>
          {loading ? <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-6 text-center text-sm text-ink-soft">Loading notes...</p> : notes.length === 0 ? <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-6 text-center text-sm text-ink-soft">No notes found.</p> : (
            <div className="grid gap-4">{notes.map((note) => (
              <article key={note._id} className={cn(ui.card, 'grid gap-4 p-5', note.pinned && 'border-emerald-brand')}>
                <div><h3 className="text-lg font-black text-ink">{note.title}</h3><p className="mt-2 flex flex-wrap gap-2">{(note.tags || []).map((tag) => <span key={tag} className="rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-extrabold text-ink-soft">{tag}</span>)}</p></div>
                <div className="prose prose-sm max-w-none rounded-card border border-line bg-surface-raised p-4 text-ink" dangerouslySetInnerHTML={{ __html: markdownToHtml(note.content) }} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={ui.button.icon} onClick={() => noteResourceService.toggleNotePin(selection.skillId, selection.topicId, note._id).then(() => loadHub())} title="Pin note"><Pin size={16} fill={note.pinned ? 'currentColor' : 'none'} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => noteResourceService.toggleNoteFavorite(selection.skillId, selection.topicId, note._id).then(() => loadHub())} title="Favorite note"><Heart size={16} fill={note.favorite ? 'currentColor' : 'none'} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => bookmarkTarget('note', note._id)} title="Bookmark note"><BookOpenText size={16} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => setOpenComments((current) => current === `note:${note._id}` ? '' : `note:${note._id}`)} title="Comments"><Search size={16} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => openNoteModal(note)} title="Edit note"><Pencil size={16} /></button>
                  <button type="button" className={cn(ui.button.icon, 'border-red-200 text-red-700 hover:bg-red-50')} onClick={() => deleteNote(note._id)} title="Delete note"><Trash2 size={16} /></button>
                </div>
                {openComments === `note:${note._id}` && <CommentsPanel targetType="note" targetId={note._id} />}
              </article>
            ))}</div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4"><span className="text-sm text-ink-soft">{pagination.notes.total || 0} notes</span><div className="flex gap-2"><button type="button" className={cn(ui.button.base, ui.button.secondary)} disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Prev</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} disabled={filters.page >= (pagination.notes.totalPages || 1)} onClick={() => changePage(filters.page + 1)}>Next</button></div></div>
        </section>

        <section className={cn(ui.panel, 'grid gap-4')}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">References</p><h2 className="mt-1 text-xl font-black text-ink">Resources</h2></div><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => openResourceModal()} disabled={!selection.topicId}><Plus size={16} /> Resource</button></div>
          {resources.length === 0 ? <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-6 text-center text-sm text-ink-soft">No resources found.</p> : (
            <div className="grid gap-4">{resources.map((resource) => (
              <article key={resource._id} className={cn(ui.card, 'grid gap-4 p-5')}>
                <div><span className="rounded-full border border-emerald-brand/20 bg-emerald-pale px-3 py-1 text-xs font-extrabold text-emerald-dark-brand">{resource.type}</span><h3 className="mt-3 text-lg font-black text-ink">{resource.title}</h3><p className="mt-2 break-words text-sm leading-6 text-ink-soft">{resource.description || resource.url}</p></div>
                <div className="flex flex-wrap gap-2">
                  {resource.file?.url ? <a href={resource.file.url} target="_blank" rel="noreferrer" className={ui.button.icon} title="Preview file"><Eye size={16} /></a> : null}
                  <a href={resource.file?.url || resource.url} target="_blank" rel="noreferrer" className={ui.button.icon} title="Open resource">{resource.file?.mimetype?.startsWith('image/') ? <ImageIcon size={16} /> : resource.type === 'PDF' ? <FileText size={16} /> : <ExternalLink size={16} />}</a>
                  {resource.file?.url ? <a href={resource.file.url} download className={ui.button.icon} title="Download"><Download size={16} /></a> : null}
                  <button type="button" className={ui.button.icon} onClick={() => noteResourceService.toggleResourceFavorite(selection.skillId, selection.topicId, resource._id).then(() => loadHub())} title="Favorite"><Heart size={16} fill={resource.favorite ? 'currentColor' : 'none'} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => bookmarkTarget('resource', resource._id)} title="Bookmark resource"><BookOpenText size={16} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => setOpenComments((current) => current === `resource:${resource._id}` ? '' : `resource:${resource._id}`)} title="Comments"><Search size={16} /></button>
                  <button type="button" className={ui.button.icon} onClick={() => openResourceModal(resource)} title="Edit"><Pencil size={16} /></button>
                  <button type="button" className={cn(ui.button.icon, 'border-red-200 text-red-700 hover:bg-red-50')} onClick={() => deleteResource(resource._id)} title="Delete"><Trash2 size={16} /></button>
                </div>
                {openComments === `resource:${resource._id}` && <CommentsPanel targetType="resource" targetId={resource._id} />}
              </article>
            ))}</div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4"><span className="text-sm text-ink-soft">{pagination.resources.total || 0} resources</span><div className="flex gap-2"><button type="button" className={cn(ui.button.base, ui.button.secondary)} disabled={filters.page <= 1} onClick={() => changePage(filters.page - 1)}>Prev</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} disabled={filters.page >= (pagination.resources.totalPages || 1)} onClick={() => changePage(filters.page + 1)}>Next</button></div></div>
        </section>
      </div>

      {filters.search.trim() && (
        <section className={cn(ui.panel, 'grid gap-4')}>
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Global search</p><h2 className="mt-1 text-xl font-black text-ink">Matches across all topics</h2></div><Search size={20} className="text-emerald-dark-brand" /></div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div>
              <h3 className={ui.field.label}>Notes</h3>
              {(globalResults.notes || []).length === 0 ? <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-6 text-center text-sm text-ink-soft">No note matches.</p> : (globalResults.notes || []).map((note) => <article key={note._id} className={cn(ui.card, 'p-4')}><h3 className="font-black text-ink">{note.title}</h3><p className="mt-1 text-sm text-ink-soft">{note.skill?.title} / {note.topic?.title}</p></article>)}
            </div>
            <div>
              <h3 className={ui.field.label}>Resources</h3>
              {(globalResults.resources || []).length === 0 ? <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-6 text-center text-sm text-ink-soft">No resource matches.</p> : (globalResults.resources || []).map((resource) => <article key={resource._id} className={cn(ui.card, 'p-4')}><h3 className="font-black text-ink">{resource.title}</h3><p className="mt-1 text-sm text-ink-soft">{resource.skill?.title} / {resource.topic?.title}</p></article>)}
            </div>
          </div>
        </section>
      )}

      <Modal open={noteModalOpen} onClose={() => setNoteModalOpen(false)} title={editingNote ? 'Edit note' : 'Create note'}>
        <form onSubmit={saveNote} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={ui.field.label} htmlFor="note-title">Title</label><div className={ui.field.control}><input className={ui.field.input} id="note-title" value={noteForm.title} onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))} required /></div></div>
            <div><label className={ui.field.label} htmlFor="note-tags">Tags</label><div className={ui.field.control}><input className={ui.field.input} id="note-tags" value={noteForm.tags} onChange={(event) => setNoteForm((current) => ({ ...current, tags: event.target.value }))} placeholder="react, hooks" /></div></div>
            <div className="md:col-span-2"><div className="mb-2 flex items-center justify-between gap-3"><label className={ui.field.label} htmlFor="note-content">Markdown</label><button type="button" className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3 py-1.5 text-xs')} onClick={() => setPreview((current) => !current)}><Eye size={16} /> {preview ? 'Edit' : 'Preview'}</button></div>{preview ? <div className="prose prose-sm max-w-none rounded-card border border-line bg-surface-raised p-4 text-ink" dangerouslySetInnerHTML={{ __html: markdownToHtml(noteForm.content) }} /> : <div className={ui.field.control}><textarea className={ui.field.input} id="note-content" rows="12" value={noteForm.content} onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))} required /></div>}</div>
          </div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {saving ? 'Saving...' : 'Save note'}</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => setNoteModalOpen(false)}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>

      <Modal open={resourceModalOpen} onClose={() => setResourceModalOpen(false)} title={editingResource ? 'Edit resource' : 'Create resource'}>
        <form onSubmit={saveResource} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={ui.field.label} htmlFor="resource-title">Title</label><div className={ui.field.control}><input className={ui.field.input} id="resource-title" value={resourceForm.title} onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))} required /></div></div>
            <div><label className={ui.field.label} htmlFor="resource-type">Type</label><div className={ui.field.control}><select className={ui.field.input} id="resource-type" value={resourceForm.type} onChange={(event) => setResourceForm((current) => ({ ...current, type: event.target.value }))}>{resourceTypes.map((type) => <option key={type}>{type}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div></div>
            <div className="md:col-span-2"><label className={ui.field.label} htmlFor="resource-url">URL</label><div className={ui.field.control}><input className={ui.field.input} id="resource-url" value={resourceForm.url} onChange={(event) => setResourceForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://..." /></div></div>
            <div className="md:col-span-2"><label className={ui.field.label} htmlFor="resource-file">Attachment</label><div className={ui.field.control}><Upload size={17} className="text-ink-muted" /><input className={ui.field.input} id="resource-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.zip" onChange={(event) => setResourceForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} /></div></div>
            <div className="md:col-span-2"><label className={ui.field.label} htmlFor="resource-description">Description</label><div className={ui.field.control}><textarea className={ui.field.input} id="resource-description" rows="4" value={resourceForm.description} onChange={(event) => setResourceForm((current) => ({ ...current, description: event.target.value }))} /></div></div>
          </div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {saving ? 'Saving...' : 'Save resource'}</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => setResourceModalOpen(false)}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}
