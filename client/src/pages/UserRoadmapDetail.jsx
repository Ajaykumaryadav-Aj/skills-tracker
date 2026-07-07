import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpenCheck, ChevronDown, Map, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'

const statusOptions = ['Not Started', 'In progress', 'Completed']
const levelOptions = ['Beginner', 'Intermediate', 'Advanced']
const statusClass = (status) => ({
  'Not Started': 'status-badge--idle',
  'In progress': 'status-badge--active',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')

export default function UserRoadmapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSkills, setExpandedSkills] = useState({})
  const [addSkillOpen, setAddSkillOpen] = useState(false)
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkill, setNewSkill] = useState({ title: '', description: '', level: 'Beginner', estimatedHours: '' })

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const res = await roadmapService.getRoadmap(id)
        setRoadmap(res.data.roadmap)
      } catch {
        setError('Failed to load roadmap')
      } finally {
        setLoading(false)
      }
    }
    loadRoadmap()
  }, [id])

  const updateSkillStatus = async (skillId, status) => {
    try {
      const response = await roadmapService.updateRoadmapSkill(id, skillId, { status })
      setRoadmap(response.data.roadmap)
    } catch { setError('Failed to update skill') }
  }

  const updateSkillProgress = async (skillId, progress) => {
    try {
      const response = await roadmapService.updateRoadmapSkill(id, skillId, { progress })
      setRoadmap(response.data.roadmap)
    } catch { setError('Failed to update skill progress') }
  }

  const deleteSkill = async (skillId) => {
    if (!window.confirm('Delete this skill from the roadmap?')) return
    try {
      const response = await roadmapService.deleteRoadmapSkill(id, skillId)
      setRoadmap(response.data.roadmap)
    } catch { setError('Failed to delete skill') }
  }

  const deleteRoadmap = async () => {
    if (!window.confirm('Delete this roadmap? This cannot be undone.')) return
    try { await roadmapService.deleteRoadmap(id); navigate('/roadmaps') }
    catch { setError('Failed to delete roadmap') }
  }

  const handleAddSkill = async (event) => {
    event.preventDefault()
    try {
      setAddingSkill(true)
      setError(null)
      const payload = {
        title: newSkill.title.trim(),
        description: newSkill.description.trim(),
        level: newSkill.level,
        ...(newSkill.estimatedHours ? { estimatedHours: Number(newSkill.estimatedHours) } : {}),
      }
      const response = await roadmapService.addSkillToRoadmap(id, payload)
      setRoadmap(response.data.roadmap)
      setNewSkill({ title: '', description: '', level: 'Beginner', estimatedHours: '' })
      setAddSkillOpen(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add skill')
    } finally {
      setAddingSkill(false)
    }
  }

  if (loading) return <div className="skeleton-panel" role="status" aria-label="Loading roadmap" />
  if (error && !roadmap) return <div className="alert alert--danger" role="alert">{error}</div>

  const overallProgress = Math.round((roadmap.skills || []).reduce((sum, skill) => sum + (skill.progress || 0), 0) / (roadmap.skills?.length || 1))
  const completedSkills = roadmap.skills?.filter((skill) => skill.status === 'Completed').length || 0

  return (
    <div className="user-roadmap-page">
      <PageHeader
        eyebrow={roadmap.category}
        title={roadmap.title}
        description={roadmap.description || 'No description added.'}
        icon={Map}
        actions={<><button type="button" onClick={() => navigate(`/roadmaps/${id}/edit`)} className="button button--secondary"><Pencil size={16} /> Edit</button><button type="button" onClick={deleteRoadmap} className="button button--danger"><Trash2 size={16} /> Delete</button></>}
      />
      {error && <div className="alert alert--danger" role="alert">{error}</div>}

      <section className="roadmap-overview detail-panel reveal-item">
        <div className="roadmap-overview__progress"><span>Overall progress</span><strong>{overallProgress}%</strong><div className="progress-track"><i className="progress-fill" style={{ '--progress': `${overallProgress}%` }} /></div></div>
        <div><span>Total skills</span><strong>{roadmap.skills?.length || 0}</strong></div>
        <div><span>Completed</span><strong>{completedSkills}</strong></div>
        <div><span>Status</span><i className={`status-badge ${statusClass(roadmap.status)}`}>{roadmap.status}</i></div>
      </section>

      <section className="managed-skills" aria-labelledby="managed-skills-title">
        <div className="section-heading-line"><div><p>Roadmap curriculum</p><h2 id="managed-skills-title">Skills</h2></div><button type="button" onClick={() => setAddSkillOpen(true)} className="button button--primary"><Plus size={16} /> Add skill</button></div>
        {!roadmap.skills?.length ? <div className="empty-state"><BookOpenCheck size={24} /><p>No skills added yet.</p></div> : (
          <div className="managed-skill-list">
            {roadmap.skills.map((skill, index) => {
              const expanded = Boolean(expandedSkills[skill._id])
              const progress = Number(skill.progress) || 0
              return (
                <article className={`managed-skill ${expanded ? 'is-expanded' : ''}`} key={skill._id}>
                  <div className="managed-skill__header">
                    <button type="button" onClick={() => setExpandedSkills((current) => ({ ...current, [skill._id]: !expanded }))} aria-expanded={expanded} className="managed-skill__toggle">
                      <span>{String(index + 1).padStart(2, '0')}</span><div><strong>{skill.title}</strong>{skill.description && <small>{skill.description}</small>}</div><ChevronDown size={19} />
                    </button>
                    <div className="managed-skill__status"><div className="field-control"><select value={skill.status} onChange={(event) => updateSkillStatus(skill._id, event.target.value)} aria-label={`${skill.title} status`}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
                  </div>
                  <div className="managed-skill__progress"><div><span>Progress</span><strong>{progress}%</strong></div><input type="range" min="0" max="100" value={progress} onChange={(event) => updateSkillProgress(skill._id, Number(event.target.value))} aria-label={`${skill.title} progress`} style={{ '--range-progress': `${progress}%` }} /></div>
                  {expanded && (
                    <div className="managed-skill__body">
                      {!skill.topics?.length ? <p>No topics in this skill.</p> : skill.topics.map((topic) => <div className="managed-topic" key={topic._id}><div><strong>{topic.title}</strong>{topic.description && <p>{topic.description}</p>}</div><span className="status-badge status-badge--idle">{topic.status}</span></div>)}
                      <button type="button" onClick={() => deleteSkill(skill._id)} className="button button--danger"><Trash2 size={16} /> Delete skill</button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Modal open={addSkillOpen} onClose={() => setAddSkillOpen(false)} title="Add skill to roadmap">
        <form onSubmit={handleAddSkill} className="modal-form">
          <div className="form-grid">
            <div className="form-grid__wide"><label className="field-label" htmlFor="roadmap-skill-title">Title</label><div className="field-control"><input id="roadmap-skill-title" value={newSkill.title} onChange={(event) => setNewSkill((current) => ({ ...current, title: event.target.value }))} maxLength="200" required /></div></div>
            <div><label className="field-label" htmlFor="roadmap-skill-level">Level</label><div className="field-control"><select id="roadmap-skill-level" value={newSkill.level} onChange={(event) => setNewSkill((current) => ({ ...current, level: event.target.value }))}>{levelOptions.map((level) => <option key={level}>{level}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
            <div><label className="field-label" htmlFor="roadmap-skill-hours">Estimated hours</label><div className="field-control"><input id="roadmap-skill-hours" type="number" min="1" max="10000" value={newSkill.estimatedHours} onChange={(event) => setNewSkill((current) => ({ ...current, estimatedHours: event.target.value }))} /></div></div>
            <div className="form-grid__wide"><label className="field-label" htmlFor="roadmap-skill-description">Description</label><div className="field-control"><textarea id="roadmap-skill-description" value={newSkill.description} onChange={(event) => setNewSkill((current) => ({ ...current, description: event.target.value }))} maxLength="1000" /></div></div>
          </div>
          <div className="form-actions"><button type="submit" disabled={addingSkill} className="button button--primary"><Save size={16} /> {addingSkill ? 'Adding...' : 'Add skill'}</button><button type="button" onClick={() => setAddSkillOpen(false)} className="button button--secondary"><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}
