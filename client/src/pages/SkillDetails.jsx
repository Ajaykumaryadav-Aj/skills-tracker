import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Archive,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  Copy,
  Gauge,
  GripVertical,
  Link2,
  NotebookPen,
  Pencil,
  Plus,
  Save,
  Star,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import Modal from '../components/Modal'
import NotesEditor from '../components/NotesEditor'
import PageHeader from '../components/PageHeader'
import ResourceManager from '../components/ResourceManager'
import * as skillService from '../services/skillService'

const topicStatuses = ['Not Started', 'Learning', 'Revision', 'Completed', 'Skipped']
const topicPriorities = ['Low', 'Medium', 'High']
const statusClass = (status) => ({
  'Not Started': 'status-badge--idle',
  Learning: 'status-badge--active',
  Paused: 'status-badge--revision',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')
const topicClass = (status) => ({
  'Not Started': 'status-badge--idle',
  Learning: 'status-badge--active',
  Revision: 'status-badge--revision',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')

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
  const [topicFilters, setTopicFilters] = useState({ search: '', status: '', priority: '', sort: 'order' })
  const [draggedTopicId, setDraggedTopicId] = useState(null)

  useEffect(() => {
    let ignore = false

    const loadSkill = async () => {
      try {
        const res = await skillService.getSkill(id)
        const topicsRes = await skillService.getTopics(id, topicFilters)
        if (!ignore) {
          setSkill(res.data.skill)
          setTopics(topicsRes.data.topics || [])
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
      const [res, topicsRes] = await Promise.all([
        skillService.getSkill(id),
        skillService.getTopics(id, topicFilters),
      ])
      setSkill(res.data.skill)
      setTopics(topicsRes.data.topics || [])
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
      const response = editingTopic
        ? await skillService.updateTopic(id, editingTopic._id, payload)
        : await skillService.addTopic(id, payload)
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

  if (loading) return <div className="skeleton-panel" role="status" aria-label="Loading skill" />
  if (!skill) return <div className="alert alert--danger" role="alert">Skill not found.</div>

  const progress = Math.min(100, Math.max(0, Number(skill.progress) || 0))

  return (
    <div className="skill-detail-page">
      <Link to="/skills" className="back-link"><ArrowLeft size={16} /> Back to skills</Link>
      <PageHeader
        eyebrow={skill.category}
        title={skill.title}
        description={skill.description || 'No description added.'}
        icon={BookOpenCheck}
        actions={(
          <>
            <button type="button" onClick={handleFavorite} className="button button--secondary"><Star size={16} /> {skill.isFavorite ? 'Unfavorite' : 'Favorite'}</button>
            <button type="button" onClick={handleArchive} className="button button--secondary"><Archive size={16} /> {skill.isArchived ? 'Unarchive' : 'Archive'}</button>
            <Link to={`/skills/${skill._id}/edit`} className="button button--primary"><Pencil size={16} /> Edit skill</Link>
          </>
        )}
      />

      {error && <div className="alert alert--danger" role="alert">{error}</div>}

      <section className="skill-summary detail-panel reveal-item" aria-label="Skill summary">
        <div className="skill-summary__status"><span className={`status-badge ${statusClass(skill.status)}`}>{skill.status}</span></div>
        <div className="skill-summary__metrics">
          <div><span><Tags size={16} /> Category</span><strong>{skill.category}</strong></div>
          <div><span><CalendarDays size={16} /> Target date</span><strong>{(skill.targetCompletionDate || skill.targetDate) ? new Date(skill.targetCompletionDate || skill.targetDate).toLocaleDateString() : 'Not set'}</strong></div>
          <div><span><Tags size={16} /> Difficulty</span><strong>{skill.difficulty || 'Beginner'}</strong></div>
          <div><span><Gauge size={16} /> Estimated hours</span><strong>{skill.estimatedHours ? `${skill.estimatedHours}h` : 'Not set'}</strong></div>
          <div className="skill-summary__progress">
            <span><Gauge size={16} /> Progress</span>
            <div><strong>{progress}%</strong><div className="progress-track"><i className="progress-fill" style={{ '--progress': `${progress}%` }} /></div></div>
          </div>
        </div>
      </section>

      <section className="topics-section" aria-labelledby="topics-title">
        <div className="section-heading-line"><div><p>Learning units</p><h2 id="topics-title">Topics</h2></div><button type="button" onClick={openCreateTopic} className="button button--primary"><Plus size={16} /> Add topic</button></div>
        <div className="topic-filter-bar">
          <div className="field-control"><input value={topicFilters.search} onChange={(event) => setTopicFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search topics" /></div>
          <div className="field-control"><select value={topicFilters.status} onChange={(event) => setTopicFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{topicStatuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div>
          <div className="field-control"><select value={topicFilters.priority} onChange={(event) => setTopicFilters((current) => ({ ...current, priority: event.target.value }))}><option value="">All priorities</option>{topicPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div>
          <div className="field-control"><select value={topicFilters.sort} onChange={(event) => setTopicFilters((current) => ({ ...current, sort: event.target.value }))}><option value="order">Order</option><option value="dueDate">Due date</option><option value="title">Title</option><option value="status">Status</option></select><ChevronDown className="select-chevron" size={16} /></div>
        </div>
        {!topics.length ? (
          <div className="empty-state"><BookOpenCheck size={24} /><p>No topics match this view.</p></div>
        ) : (
          <div className="topic-accordion">
            {topics.map((topic, index) => {
              const expanded = Boolean(expandedTopics[topic._id])
              return (
                <article
                  className={`topic-item ${expanded ? 'topic-item--expanded' : ''} reveal-item`}
                  draggable
                  onDragStart={() => handleDragStart(topic._id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(topic._id)}
                  style={{ '--reveal-delay': `${index * 55}ms` }}
                  key={topic._id}
                >
                  <button type="button" className="topic-item__toggle" onClick={() => setExpandedTopics((current) => ({ ...current, [topic._id]: !expanded }))} aria-expanded={expanded} aria-controls={`topic-${topic._id}`}>
                    <span className="topic-item__number"><GripVertical size={14} /> {String(index + 1).padStart(2, '0')}</span>
                    <span className="topic-item__copy"><strong>{topic.title}</strong><small className={`status-badge ${topicClass(topic.status)}`}>{topic.status}</small></span>
                    <span className={`status-badge status-badge--${String(topic.priority || 'Medium').toLowerCase()}`}>{topic.priority || 'Medium'}</span>
                    <ChevronDown size={19} className="topic-item__chevron" aria-hidden="true" />
                  </button>

                  {expanded && (
                    <div id={`topic-${topic._id}`} className="topic-item__body">
                      <section className="topic-tool" aria-labelledby={`notes-${topic._id}`}>
                        <div className="topic-tool__heading"><NotebookPen size={18} /><h3 id={`notes-${topic._id}`}>Notes</h3></div>
                        <NotesEditor key={`${topic._id}-${topic.notes?.updatedAt || 'empty'}`} skillId={id} topicId={topic._id} initialContent={topic.notes?.content || ''} onSave={reload} />
                      </section>

                      <section className="topic-tool" aria-labelledby={`resources-${topic._id}`}>
                        <div className="topic-tool__heading"><Link2 size={18} /><h3 id={`resources-${topic._id}`}>Resources</h3></div>
                        <ResourceManager skillId={id} topicId={topic._id} onUpdated={reload} />
                      </section>

                      <div className="topic-item__controls">
                        <div><label className="field-label" htmlFor={`topic-status-${topic._id}`}>Topic status</label><div className="field-control"><select id={`topic-status-${topic._id}`} value={topic.status} onChange={(event) => handleUpdateTopic(topic._id, { status: event.target.value })}>{topicStatuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
                        <span className="topic-meta">Est {topic.estimatedHours || 0}h | Actual {topic.actualHours || 0}h | Due {topic.dueDate ? new Date(topic.dueDate).toLocaleDateString() : 'Not set'}</span>
                        <button type="button" onClick={() => openEditTopic(topic)} className="button button--secondary"><Pencil size={16} /> Edit</button>
                        <button type="button" onClick={() => handleDuplicateTopic(topic._id)} className="button button--secondary"><Copy size={16} /> Duplicate</button>
                        <button type="button" onClick={() => setDeletingTopic(topic)} className="button button--danger"><Trash2 size={16} /> Delete topic</button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
      <Modal open={topicModalOpen} onClose={() => setTopicModalOpen(false)} title={editingTopic ? 'Edit topic' : 'Create topic'}>
        <form onSubmit={handleTopicSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-grid__wide"><label className="field-label" htmlFor="topic-title">Title</label><div className="field-control"><input id="topic-title" name="title" autoComplete="off" value={topicForm.title} onChange={handleTopicFormChange} required /></div></div>
            <div><label className="field-label" htmlFor="topic-status">Status</label><div className="field-control"><select id="topic-status" name="status" value={topicForm.status} onChange={handleTopicFormChange}>{topicStatuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
            <div><label className="field-label" htmlFor="topic-priority">Priority</label><div className="field-control"><select id="topic-priority" name="priority" value={topicForm.priority} onChange={handleTopicFormChange}>{topicPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
            <div><label className="field-label" htmlFor="topic-estimated">Estimated hours</label><div className="field-control"><input id="topic-estimated" name="estimatedHours" type="number" min="0" step="0.5" value={topicForm.estimatedHours} onChange={handleTopicFormChange} /></div></div>
            <div><label className="field-label" htmlFor="topic-actual">Actual hours</label><div className="field-control"><input id="topic-actual" name="actualHours" type="number" min="0" step="0.5" value={topicForm.actualHours} onChange={handleTopicFormChange} /></div></div>
            <div><label className="field-label" htmlFor="topic-due">Due date</label><div className="field-control"><input id="topic-due" name="dueDate" type="date" value={topicForm.dueDate} onChange={handleTopicFormChange} /></div></div>
            <div className="form-grid__wide"><label className="field-label" htmlFor="topic-description">Description</label><div className="field-control"><textarea id="topic-description" name="description" value={topicForm.description} onChange={handleTopicFormChange} /></div></div>
          </div>
          <div className="form-actions"><button type="submit" disabled={topicLoading} className="button button--primary"><Save size={16} /> {topicLoading ? 'Saving...' : 'Save topic'}</button><button type="button" onClick={() => setTopicModalOpen(false)} className="button button--secondary"><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(deletingTopic)} onClose={() => setDeletingTopic(null)} title="Delete topic">
        <p className="modal-copy">Delete "{deletingTopic?.title}"? Notes and resources inside this topic will also be removed.</p>
        <div className="form-actions"><button type="button" onClick={handleDeleteTopic} className="button button--danger"><Trash2 size={16} /> Delete topic</button><button type="button" onClick={() => setDeletingTopic(null)} className="button button--secondary"><X size={16} /> Cancel</button></div>
      </Modal>
    </div>
  )
}
