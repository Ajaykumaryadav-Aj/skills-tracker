import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpenCheck, ChevronDown, Map, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'
import { cn, statusTone, ui } from '../utils/tw'

const statusOptions = ['Not Started', 'In progress', 'Completed']
const levelOptions = ['Beginner', 'Intermediate', 'Advanced']

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

  if (loading) return <div className="skeleton-shimmer h-80 rounded-panel" role="status" aria-label="Loading roadmap" />
  if (error && !roadmap) return <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>

  const overallProgress = Math.round((roadmap.skills || []).reduce((sum, skill) => sum + (skill.progress || 0), 0) / (roadmap.skills?.length || 1))
  const completedSkills = roadmap.skills?.filter((skill) => skill.status === 'Completed').length || 0

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5">
      <PageHeader
        eyebrow={roadmap.category}
        title={roadmap.title}
        description={roadmap.description || 'No description added.'}
        icon={Map}
        actions={<><button type="button" onClick={() => navigate(`/roadmaps/${id}/edit`)} className={cn(ui.button.base, ui.button.secondary)}><Pencil size={16} /> Edit</button><button type="button" onClick={deleteRoadmap} className={cn(ui.button.base, ui.button.danger)}><Trash2 size={16} /> Delete</button></>}
      />
      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={ui.panel}><span className="text-sm font-bold text-ink-soft">Overall progress</span><strong className="mt-2 block text-3xl font-black text-ink">{overallProgress}%</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full bg-emerald-brand" style={{ width: `${overallProgress}%` }} /></div></div>
        <div className={ui.panel}><span className="text-sm font-bold text-ink-soft">Total skills</span><strong className="mt-2 block text-3xl font-black text-ink">{roadmap.skills?.length || 0}</strong></div>
        <div className={ui.panel}><span className="text-sm font-bold text-ink-soft">Completed</span><strong className="mt-2 block text-3xl font-black text-ink">{completedSkills}</strong></div>
        <div className={ui.panel}><span className="text-sm font-bold text-ink-soft">Status</span><i className={cn(ui.badge.base, statusTone(roadmap.status), 'mt-3')}>{roadmap.status}</i></div>
      </section>

      <section className="grid gap-4" aria-labelledby="managed-skills-title">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Roadmap curriculum</p><h2 id="managed-skills-title" className="text-2xl font-black text-ink">Skills</h2></div><button type="button" onClick={() => setAddSkillOpen(true)} className={cn(ui.button.base, ui.button.primary)}><Plus size={16} /> Add skill</button></div>
        {!roadmap.skills?.length ? <div className={ui.empty}><BookOpenCheck size={24} /><p>No skills added yet.</p></div> : (
          <div className="grid gap-3">
            {roadmap.skills.map((skill, index) => {
              const expanded = Boolean(expandedSkills[skill._id])
              const progress = Number(skill.progress) || 0
              return (
                <article className={cn(ui.card, 'grid gap-4 p-4')} key={skill._id}>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <button type="button" onClick={() => setExpandedSkills((current) => ({ ...current, [skill._id]: !expanded }))} aria-expanded={expanded} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-left">
                      <span className="grid size-9 place-items-center rounded-card bg-surface-raised text-xs font-black text-ink-soft">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0"><strong className="block truncate text-ink">{skill.title}</strong>{skill.description && <small className="text-ink-soft">{skill.description}</small>}</div><ChevronDown size={19} className={cn('text-ink-muted transition', expanded && 'rotate-180')} />
                    </button>
                    <div className={ui.field.control}><select className={ui.field.input} value={skill.status} onChange={(event) => updateSkillStatus(skill._id, event.target.value)} aria-label={`${skill.title} status`}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div>
                  </div>
                  <div className="grid gap-2"><div className="flex justify-between text-sm"><span className="text-ink-soft">Progress</span><strong className="text-ink">{progress}%</strong></div><input className="h-2 w-full accent-emerald-brand" type="range" min="0" max="100" value={progress} onChange={(event) => updateSkillProgress(skill._id, Number(event.target.value))} aria-label={`${skill.title} progress`} /></div>
                  {expanded && <div className="grid gap-3 border-t border-line pt-3">{!skill.topics?.length ? <p className="text-sm text-ink-soft">No topics in this skill.</p> : skill.topics.map((topic) => <div className="flex flex-wrap items-start justify-between gap-3 rounded-card bg-surface-raised p-3" key={topic._id}><div><strong className="text-ink">{topic.title}</strong>{topic.description && <p className="text-sm text-ink-soft">{topic.description}</p>}</div><span className={cn(ui.badge.base, ui.badge.idle)}>{topic.status}</span></div>)}<button type="button" onClick={() => deleteSkill(skill._id)} className={cn(ui.button.base, ui.button.danger, 'w-fit')}><Trash2 size={16} /> Delete skill</button></div>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Modal open={addSkillOpen} onClose={() => setAddSkillOpen(false)} title="Add skill to roadmap">
        <form onSubmit={handleAddSkill} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className={ui.field.label} htmlFor="roadmap-skill-title">Title</label><div className={ui.field.control}><input className={ui.field.input} id="roadmap-skill-title" value={newSkill.title} onChange={(event) => setNewSkill((current) => ({ ...current, title: event.target.value }))} maxLength="200" required /></div></div>
            <div><label className={ui.field.label} htmlFor="roadmap-skill-level">Level</label><div className={ui.field.control}><select className={ui.field.input} id="roadmap-skill-level" value={newSkill.level} onChange={(event) => setNewSkill((current) => ({ ...current, level: event.target.value }))}>{levelOptions.map((level) => <option key={level}>{level}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div></div>
            <div><label className={ui.field.label} htmlFor="roadmap-skill-hours">Estimated hours</label><div className={ui.field.control}><input className={ui.field.input} id="roadmap-skill-hours" type="number" min="1" max="10000" value={newSkill.estimatedHours} onChange={(event) => setNewSkill((current) => ({ ...current, estimatedHours: event.target.value }))} /></div></div>
            <div className="md:col-span-2"><label className={ui.field.label} htmlFor="roadmap-skill-description">Description</label><div className={cn(ui.field.control, 'items-start')}><textarea className={cn(ui.field.input, 'min-h-28 py-3')} id="roadmap-skill-description" value={newSkill.description} onChange={(event) => setNewSkill((current) => ({ ...current, description: event.target.value }))} maxLength="1000" /></div></div>
          </div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={addingSkill} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {addingSkill ? 'Adding...' : 'Add skill'}</button><button type="button" onClick={() => setAddSkillOpen(false)} className={cn(ui.button.base, ui.button.secondary)}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}
