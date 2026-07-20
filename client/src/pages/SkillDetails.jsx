import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, BookOpenCheck, CalendarDays, ChevronDown, Copy, Gauge, GripVertical, Link2, NotebookPen, Pencil, Plus, Save, Star, Tags, Trash2, X } from 'lucide-react'
import Modal from '../components/Modal'
import NotesEditor from '../components/NotesEditor'
import PageHeader from '../components/PageHeader'
import ResourceManager from '../components/ResourceManager'
import * as skillService from '../services/skillService'
import { cn, statusTone, ui } from '../utils/tw'

const topicStatuses = ['Not Started', 'Learning', 'Revision', 'Completed', 'Skipped']
const topicPriorities = ['Low', 'Medium', 'High']

function SelectBox({ id, value, onChange, children }) {
  return <div className={ui.field.control}><select className={ui.field.input} id={id} value={value} onChange={onChange}>{children}</select><ChevronDown className="shrink-0 text-ink-muted" size={16} /></div>
}

function FormField({ id, label, children, wide }) {
  return <div className={wide ? 'md:col-span-2' : ''}><label className={ui.field.label} htmlFor={id}>{label}</label>{children}</div>
}

export default function SkillDetails() {
  const { id } = useParams()
  const [skill, setSkill] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [topicForm, setTopicForm] = useState({ title: '', description: '', status: 'Not Started', priority: 'Medium', estimatedHours: '', actualHours: '', dueDate: '' })
  const [topicLoading, setTopicLoading] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState({})
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [deletingTopic, setDeletingTopic] = useState(null)
  const [topicFilters, setTopicFilters] = useState({ search: '', status: '', priority: '', sort: 'order', page: 1, limit: 10 })
  const [topicPagination, setTopicPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [draggedTopicId, setDraggedTopicId] = useState(null)

  const handleTopicPageChange = (newPage) => {
    setTopicFilters((current) => ({ ...current, page: newPage }))
  }

  useEffect(() => {
    let ignore = false
    const loadSkill = async () => {
      try {
        const res = await skillService.getSkill(id)
        const topicsRes = await skillService.getTopics(id, topicFilters)
        if (!ignore) {
          setSkill(res.data.skill)
          setTopics(topicsRes.data.topics || [])
          if (topicsRes.data.pagination) {
            setTopicPagination(topicsRes.data.pagination)
          }
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load skill')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadSkill()
    return () => { ignore = true }
  }, [id, topicFilters])

  const reload = async () => {
    try {
      const [res, topicsRes] = await Promise.all([skillService.getSkill(id), skillService.getTopics(id, topicFilters)])
      setSkill(res.data.skill)
      setTopics(topicsRes.data.topics || [])
      if (topicsRes.data.pagination) {
        setTopicPagination(topicsRes.data.pagination)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to refresh skill')
    }
  }

  const openCreateTopic = () => {
    setEditingTopic(null)
    setTopicForm({ title: '', description: '', status: 'Not Started', priority: 'Medium', estimatedHours: '', actualHours: '', dueDate: '' })
    setTopicModalOpen(true)
  }

  const openEditTopic = (topic) => {
    setEditingTopic(topic)
    setTopicForm({
      title: topic.title || '',
      description: topic.description || '',
      status: topic.status || 'Not Started',
      priority: topic.priority || 'Medium',
      estimatedHours: topic.estimatedHours ?? '',
      actualHours: topic.actualHours ?? '',
      dueDate: topic.dueDate ? topic.dueDate.slice(0, 10) : '',
    })
    setTopicModalOpen(true)
  }

  const handleTopicFormChange = (event) => {
    const { name, value } = event.target
    setTopicForm((current) => ({ ...current, [name]: ['estimatedHours', 'actualHours'].includes(name) ? (value === '' ? '' : Number(value)) : value }))
  }

  const handleTopicSubmit = async (event) => {
    event.preventDefault()
    if (!topicForm.title.trim()) return
    setTopicLoading(true)
    try {
      const payload = { ...topicForm, title: topicForm.title.trim() }
      const response = editingTopic ? await skillService.updateTopic(id, editingTopic._id, payload) : await skillService.addTopic(id, payload)
      setSkill(response.data.skill)
      setTopicModalOpen(false)
      await reload()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save topic')
    } finally {
      setTopicLoading(false)
    }
  }

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return
    try {
      setTopics((current) => current.filter((topic) => topic._id !== deletingTopic._id))
      setDeletingTopic(null)
      await skillService.deleteTopic(id, deletingTopic._id)
      await reload()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete topic')
    }
  }

  const handleUpdateTopic = async (topicId, updates) => {
    try {
      setTopics((current) => current.map((topic) => topic._id === topicId ? { ...topic, ...updates } : topic))
      const response = await skillService.updateTopic(id, topicId, updates)
      setSkill(response.data.skill)
      await reload()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update topic')
    }
  }

  const handleDuplicateTopic = async (topicId) => {
    try {
      await skillService.duplicateTopic(id, topicId)
      await reload()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to duplicate topic')
    }
  }

  const handleDragStart = (topicId) => setDraggedTopicId(topicId)
  const handleDrop = async (targetTopicId) => {
    if (!draggedTopicId || draggedTopicId === targetTopicId) return
    const currentIds = topics.map((topic) => topic._id)
    const fromIndex = currentIds.indexOf(draggedTopicId)
    const toIndex = currentIds.indexOf(targetTopicId)
    const nextIds = [...currentIds]
    const [moved] = nextIds.splice(fromIndex, 1)
    nextIds.splice(toIndex, 0, moved)
    setTopics(nextIds.map((topicId) => topics.find((topic) => topic._id === topicId)).filter(Boolean))
    setDraggedTopicId(null)
    try {
      await skillService.reorderTopics(id, nextIds)
      await reload()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reorder topics')
      await reload()
    }
  }

  const handleFavorite = async () => {
    const response = await skillService.toggleFavoriteSkill(id, { isFavorite: !skill.isFavorite })
    setSkill(response.data.skill)
  }

  const handleArchive = async () => {
    const response = await skillService.toggleArchiveSkill(id, { isArchived: !skill.isArchived })
    setSkill(response.data.skill)
  }

  if (loading) return <div className="skeleton-shimmer h-80 rounded-panel" role="status" aria-label="Loading skill" />
  if (!skill) return <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">Skill not found.</div>

  const progress = Math.min(100, Math.max(0, Number(skill.progress) || 0))

  return (
    <div className="grid gap-5">
      <Link to="/skills" className={cn(ui.button.base, ui.button.secondary, 'w-fit')}><ArrowLeft size={16} /> Back to skills</Link>
      <PageHeader
        eyebrow={skill.category}
        title={skill.title}
        description={skill.description || 'No description added.'}
        icon={BookOpenCheck}
        actions={<><button type="button" onClick={handleFavorite} className={cn(ui.button.base, ui.button.secondary)}><Star size={16} /> {skill.isFavorite ? 'Unfavorite' : 'Favorite'}</button><button type="button" onClick={handleArchive} className={cn(ui.button.base, ui.button.secondary)}><Archive size={16} /> {skill.isArchived ? 'Unarchive' : 'Archive'}</button><Link to={`/skills/${skill._id}/edit`} className={cn(ui.button.base, ui.button.primary)}><Pencil size={16} /> Edit skill</Link></>}
      />

      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      <section className={cn(ui.panel, 'grid gap-4')} aria-label="Skill summary">
        <span className={cn(ui.badge.base, statusTone(skill.status), 'w-fit')}>{skill.status}</span>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div><span className="flex items-center gap-2 text-sm text-ink-soft"><Tags size={16} /> Category</span><strong className="mt-1 block text-ink">{skill.category}</strong></div>
          <div><span className="flex items-center gap-2 text-sm text-ink-soft"><CalendarDays size={16} /> Target date</span><strong className="mt-1 block text-ink">{(skill.targetCompletionDate || skill.targetDate) ? new Date(skill.targetCompletionDate || skill.targetDate).toLocaleDateString() : 'Not set'}</strong></div>
          <div><span className="flex items-center gap-2 text-sm text-ink-soft"><Tags size={16} /> Difficulty</span><strong className="mt-1 block text-ink">{skill.difficulty || 'Beginner'}</strong></div>
          <div><span className="flex items-center gap-2 text-sm text-ink-soft"><Gauge size={16} /> Estimated hours</span><strong className="mt-1 block text-ink">{skill.estimatedHours ? `${skill.estimatedHours}h` : 'Not set'}</strong></div>
          <div className="grid gap-2"><span className="flex items-center gap-2 text-sm text-ink-soft"><Gauge size={16} /> Progress</span><strong className="text-ink">{progress}%</strong><div className="h-2 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full bg-emerald-brand" style={{ width: `${progress}%` }} /></div></div>
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="topics-title">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Learning units</p><h2 id="topics-title" className="text-2xl font-black text-ink">Topics</h2></div><button type="button" onClick={openCreateTopic} className={cn(ui.button.base, ui.button.primary)}><Plus size={16} /> Add topic</button></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={ui.field.control}><input className={ui.field.input} value={topicFilters.search} onChange={(event) => setTopicFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder="Search topics" /></div>
          <SelectBox value={topicFilters.status} onChange={(event) => setTopicFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All statuses</option>{topicStatuses.map((status) => <option key={status}>{status}</option>)}</SelectBox>
          <SelectBox value={topicFilters.priority} onChange={(event) => setTopicFilters((current) => ({ ...current, priority: event.target.value, page: 1 }))}><option value="">All priorities</option>{topicPriorities.map((priority) => <option key={priority}>{priority}</option>)}</SelectBox>
          <SelectBox value={topicFilters.sort} onChange={(event) => setTopicFilters((current) => ({ ...current, sort: event.target.value, page: 1 }))}><option value="order">Order</option><option value="dueDate">Due date</option><option value="title">Title</option><option value="status">Status</option></SelectBox>
        </div>
        {!topics.length ? (
          <div className={ui.empty}><BookOpenCheck size={24} /><p>No topics match this view.</p></div>
        ) : (
          <div className="grid gap-3">
            {topics.map((topic, index) => {
              const expanded = Boolean(expandedTopics[topic._id])
              return (
                <article className={cn(ui.card, 'reveal-item grid gap-3 p-4')} draggable onDragStart={() => handleDragStart(topic._id)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(topic._id)} style={{ '--reveal-delay': `${index * 55}ms` }} key={topic._id}>
                  <button type="button" className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-left" onClick={() => setExpandedTopics((current) => ({ ...current, [topic._id]: !expanded }))} aria-expanded={expanded} aria-controls={`topic-${topic._id}`}>
                    <span className="inline-flex items-center gap-1 rounded-card bg-surface-raised px-2 py-1 text-xs font-black text-ink-soft"><GripVertical size={14} /> {String((topicPagination.page - 1) * topicPagination.limit + index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0"><strong className="block truncate text-ink">{topic.title}</strong><small className={cn(ui.badge.base, statusTone(topic.status), 'mt-2')}>{topic.status}</small></span>
                    <span className={cn(ui.badge.base, statusTone(topic.priority || 'Medium'))}>{topic.priority || 'Medium'}</span>
                    <ChevronDown size={19} className={cn('text-ink-muted transition', expanded && 'rotate-180')} aria-hidden="true" />
                  </button>
                  {expanded && (
                    <div id={`topic-${topic._id}`} className="grid gap-4 border-t border-line pt-4">
                      <section className="grid gap-3" aria-labelledby={`notes-${topic._id}`}><div className="flex items-center gap-2"><NotebookPen size={18} className="text-emerald-dark-brand" /><h3 id={`notes-${topic._id}`} className="font-black text-ink">Notes</h3></div><NotesEditor key={`${topic._id}-${topic.notes?.updatedAt || 'empty'}`} skillId={id} topicId={topic._id} initialContent={topic.notes?.content || ''} onSave={reload} /></section>
                      <section className="grid gap-3" aria-labelledby={`resources-${topic._id}`}><div className="flex items-center gap-2"><Link2 size={18} className="text-emerald-dark-brand" /><h3 id={`resources-${topic._id}`} className="font-black text-ink">Resources</h3></div><ResourceManager skillId={id} topicId={topic._id} onUpdated={reload} /></section>
                      <div className="flex flex-wrap items-end gap-3">
                        <div><label className={ui.field.label} htmlFor={`topic-status-${topic._id}`}>Topic status</label><SelectBox id={`topic-status-${topic._id}`} value={topic.status} onChange={(event) => handleUpdateTopic(topic._id, { status: event.target.value })}>{topicStatuses.map((status) => <option key={status}>{status}</option>)}</SelectBox></div>
                        <span className="text-sm text-ink-soft">Est {topic.estimatedHours || 0}h | Actual {topic.actualHours || 0}h | Due {topic.dueDate ? new Date(topic.dueDate).toLocaleDateString() : 'Not set'}</span>
                        <button type="button" onClick={() => openEditTopic(topic)} className={cn(ui.button.base, ui.button.secondary)}><Pencil size={16} /> Edit</button>
                        <button type="button" onClick={() => handleDuplicateTopic(topic._id)} className={cn(ui.button.base, ui.button.secondary)}><Copy size={16} /> Duplicate</button>
                        <button type="button" onClick={() => setDeletingTopic(topic)} className={cn(ui.button.base, ui.button.danger)}><Trash2 size={16} /> Delete topic</button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}

            {/* Pagination Controls */}
            {topicPagination.totalPages > 1 && (
              <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-ink-soft" aria-label="Topics pagination">
                <p>Showing <strong className="text-ink">{(topicPagination.page - 1) * topicPagination.limit + 1}-{Math.min(topicPagination.page * topicPagination.limit, topicPagination.total)}</strong> of {topicPagination.total}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => handleTopicPageChange(topicPagination.page - 1)} disabled={topicPagination.page <= 1} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}>Prev</button>
                  {Array.from({ length: topicPagination.totalPages || 1 }, (_, index) => index + 1).map((page) => (
                    <button key={page} type="button" onClick={() => handleTopicPageChange(page)} aria-current={page === topicPagination.page ? 'page' : undefined} className={cn('grid min-h-9 min-w-9 place-items-center rounded-card border px-3 text-sm font-black transition', page === topicPagination.page ? 'border-emerald-brand bg-emerald-brand text-white' : 'border-line bg-white text-ink hover:border-emerald-brand hover:bg-emerald-pale')}>
                      {page}
                    </button>
                  ))}
                  <button type="button" onClick={() => handleTopicPageChange(topicPagination.page + 1)} disabled={topicPagination.page >= topicPagination.totalPages} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}>Next</button>
                </div>
              </nav>
            )}
          </div>
        )}
      </section>

      <Modal open={topicModalOpen} onClose={() => setTopicModalOpen(false)} title={editingTopic ? 'Edit topic' : 'Create topic'}>
        <form onSubmit={handleTopicSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="topic-title" label="Title" wide><div className={ui.field.control}><input className={ui.field.input} id="topic-title" name="title" autoComplete="off" value={topicForm.title} onChange={handleTopicFormChange} required /></div></FormField>
            <FormField id="topic-status" label="Status"><SelectBox id="topic-status" value={topicForm.status} onChange={(event) => handleTopicFormChange({ target: { name: 'status', value: event.target.value } })}>{topicStatuses.map((status) => <option key={status}>{status}</option>)}</SelectBox></FormField>
            <FormField id="topic-priority" label="Priority"><SelectBox id="topic-priority" value={topicForm.priority} onChange={(event) => handleTopicFormChange({ target: { name: 'priority', value: event.target.value } })}>{topicPriorities.map((priority) => <option key={priority}>{priority}</option>)}</SelectBox></FormField>
            <FormField id="topic-estimated" label="Estimated hours"><div className={ui.field.control}><input className={ui.field.input} id="topic-estimated" name="estimatedHours" type="number" min="0" step="0.5" value={topicForm.estimatedHours} onChange={handleTopicFormChange} /></div></FormField>
            <FormField id="topic-actual" label="Actual hours"><div className={ui.field.control}><input className={ui.field.input} id="topic-actual" name="actualHours" type="number" min="0" step="0.5" value={topicForm.actualHours} onChange={handleTopicFormChange} /></div></FormField>
            <FormField id="topic-due" label="Due date"><div className={ui.field.control}><input className={ui.field.input} id="topic-due" name="dueDate" type="date" value={topicForm.dueDate} onChange={handleTopicFormChange} /></div></FormField>
            <FormField id="topic-description" label="Description" wide><div className={cn(ui.field.control, 'items-start')}><textarea className={cn(ui.field.input, 'min-h-28 py-3')} id="topic-description" name="description" value={topicForm.description} onChange={handleTopicFormChange} /></div></FormField>
          </div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={topicLoading} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {topicLoading ? 'Saving...' : 'Save topic'}</button><button type="button" onClick={() => setTopicModalOpen(false)} className={cn(ui.button.base, ui.button.secondary)}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(deletingTopic)} onClose={() => setDeletingTopic(null)} title="Delete topic">
        <p className="text-sm leading-6 text-ink-soft">Delete "{deletingTopic?.title}"? Notes and resources inside this topic will also be removed.</p>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={handleDeleteTopic} className={cn(ui.button.base, ui.button.danger)}><Trash2 size={16} /> Delete topic</button><button type="button" onClick={() => setDeletingTopic(null)} className={cn(ui.button.base, ui.button.secondary)}><X size={16} /> Cancel</button></div>
      </Modal>
    </div>
  )
}
