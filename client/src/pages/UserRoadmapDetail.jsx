import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Award, BookOpenCheck, ChevronDown, Clock3, Compass, GripVertical, Map, Medal, Pencil, Plus, Save, Trash2, Trophy, X } from 'lucide-react'
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
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await roadmapService.getRoadmap(id)
        if (!ignore) setRoadmap(res.data.roadmap)
      } catch {
        if (!ignore) setError('Failed to load roadmap')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [id])

  const loadRoadmap = async () => {
    try {
      const res = await roadmapService.getRoadmap(id)
      setRoadmap(res.data.roadmap)
    } catch {
      setError('Failed to load roadmap')
    }
  }

  const updateSkillStatus = async (skillId, status) => {
    try {
      const response = await roadmapService.updateRoadmapSkill(id, skillId, { status })
      setRoadmap(response.data.roadmap)
    } catch {
      setError('Failed to update skill')
    }
  }

  const updateSkillProgress = async (skillId, progress) => {
    try {
      const response = await roadmapService.updateRoadmapSkill(id, skillId, { progress })
      setRoadmap(response.data.roadmap)
    } catch {
      setError('Failed to update skill progress')
    }
  }

  const deleteSkill = async (skillId) => {
    if (!window.confirm('Delete this skill from the roadmap?')) return
    try {
      const response = await roadmapService.deleteRoadmapSkill(id, skillId)
      setRoadmap(response.data.roadmap)
    } catch {
      setError('Failed to delete skill')
    }
  }

  const deleteRoadmap = async () => {
    if (!window.confirm('Delete this roadmap? This cannot be undone.')) return
    try {
      await roadmapService.deleteRoadmap(id)
      navigate('/roadmaps')
    } catch {
      setError('Failed to delete roadmap')
    }
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

  // Drag and drop handlers
  const handleDragStart = (event, index) => {
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDrop = async (event, targetIndex) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const updatedSkills = [...roadmap.skills]
    const [draggedSkill] = updatedSkills.splice(draggedIndex, 1)
    updatedSkills.splice(targetIndex, 0, draggedSkill)

    // Optimistically update the local roadmap structure
    setRoadmap((prev) => ({ ...prev, skills: updatedSkills }))

    try {
      setIsReordering(true)
      const skillIds = updatedSkills.map((s) => s._id)
      const response = await roadmapService.reorderRoadmapSkills(id, skillIds)
      setRoadmap(response.data.roadmap)
    } catch {
      setError('Failed to save skill order')
      // Revert to original order by reloading
      await loadRoadmap()
    } finally {
      setIsReordering(false)
      setDraggedIndex(null)
    }
  }

  // Calculations for stats, milestones and learning state
  const {
    totalSkills,
    completedSkills,
    inProgressSkills,
    pendingSkills,
    overallProgress,
    estimatedHours,
    lastUpdated
  } = useMemo(() => {
    if (!roadmap) return { totalSkills: 0, completedSkills: 0, inProgressSkills: 0, pendingSkills: 0, overallProgress: 0, estimatedHours: 0, lastUpdated: 'Never' }

    const skillsList = roadmap.skills || []
    const total = skillsList.length
    const completed = skillsList.filter((s) => s.status === 'Completed').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    const inProgress = skillsList.filter((s) => s.status === 'In progress').length
    const pending = skillsList.filter((s) => s.status === 'Not Started').length
    const hours = skillsList.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)
    const updated = roadmap.updatedAt ? new Date(roadmap.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'

    return {
      totalSkills: total,
      completedSkills: completed,
      inProgressSkills: inProgress,
      pendingSkills: pending,
      overallProgress: progress,
      estimatedHours: hours,
      lastUpdated: updated
    }
  }, [roadmap])

  const milestones = useMemo(() => {
    return [
      { name: 'Beginner', req: '0%', unlocked: overallProgress >= 0 },
      { name: 'Intermediate', req: '25%', unlocked: overallProgress >= 25 },
      { name: 'Advanced', req: '60%', unlocked: overallProgress >= 60 },
      { name: 'Expert', req: '90%', unlocked: overallProgress >= 90 },
    ]
  }, [overallProgress])

  const latestIncompleteSkill = useMemo(() => {
    if (!roadmap || !roadmap.skills || roadmap.skills.length === 0) return null
    // 1st Priority: Skill marked "In progress"
    const active = roadmap.skills.find((s) => s.status === 'In progress')
    if (active) return active
    // 2nd Priority: First "Not Started" skill
    const pending = roadmap.skills.find((s) => s.status === 'Not Started')
    if (pending) return pending
    return null
  }, [roadmap])

  if (loading) return <div className="skeleton-shimmer h-80 rounded-panel" role="status" aria-label="Loading roadmap" />
  if (error && !roadmap) return <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5">
      <PageHeader
        eyebrow={roadmap.category}
        title={roadmap.title}
        description={roadmap.description || 'No description added.'}
        icon={Map}
        actions={
          <>
            <button type="button" onClick={() => navigate(`/roadmaps/${id}/edit`)} className={cn(ui.button.base, ui.button.secondary)}><Pencil size={16} /> Edit</button>
            <button type="button" onClick={deleteRoadmap} className={cn(ui.button.base, ui.button.danger)}><Trash2 size={16} /> Delete</button>
          </>
        }
      />
      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      {/* Statistics Dashboard */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn(ui.panel, 'sm:col-span-2 lg:col-span-2 grid gap-3')}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-ink-soft">Overall Progress</span>
            <strong className="text-3xl font-black text-emerald-dark-brand">{overallProgress}%</strong>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-line relative">
            <i className="block h-full rounded-full bg-emerald-brand transition-all duration-500 ease-out" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="text-xs text-ink-soft">Calculated automatically as completed skills / total skills</p>
        </div>

        <div className={cn(ui.panel, 'grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2')}>
          <div className="border-r border-line pr-2 flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Total Skills</span>
            <strong className="text-2xl font-black text-ink mt-1">{totalSkills}</strong>
          </div>
          <div className="flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Completed</span>
            <strong className="text-2xl font-black text-emerald-dark-brand mt-1">{completedSkills}</strong>
          </div>
        </div>

        <div className={cn(ui.panel, 'grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2')}>
          <div className="border-r border-line pr-2 flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">In Progress</span>
            <strong className="text-2xl font-black text-blue-brand mt-1">{inProgressSkills}</strong>
          </div>
          <div className="flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Pending</span>
            <strong className="text-2xl font-black text-ink-soft mt-1">{pendingSkills}</strong>
          </div>
        </div>

        <div className={cn(ui.panel, 'grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2')}>
          <div className="border-r border-line pr-2 flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Study Hours</span>
            <strong className="text-2xl font-black text-ink mt-1">{estimatedHours}h</strong>
          </div>
          <div className="flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Last Updated</span>
            <span className="text-sm font-black text-ink-soft mt-1 block truncate" title={lastUpdated}>{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Continue Learning Banner */}
      {latestIncompleteSkill && (
        <section className="rounded-panel border border-emerald-brand/20 bg-emerald-pale/15 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-card bg-emerald-brand text-white shadow"><Compass size={24} /></span>
            <div>
              <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Continue Learning</p>
              <h3 className="text-lg font-black text-ink">{latestIncompleteSkill.title}</h3>
              <p className="text-xs text-ink-soft">Skill Progress: {latestIncompleteSkill.progress || 0}%</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setExpandedSkills((prev) => ({ ...prev, [latestIncompleteSkill._id]: true }))
              document.getElementById(`skill-${latestIncompleteSkill._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className={cn(ui.button.base, ui.button.primary, 'w-full sm:w-auto')}
          >
            Resume Learning
          </button>
        </section>
      )}

      {/* Path Milestones Progression */}
      <section className={cn(ui.panel, 'p-5 flex flex-col gap-4')} aria-labelledby="milestones-title">
        <div>
          <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Progression milestones</p>
          <h3 id="milestones-title" className="text-lg font-black text-ink">Path Milestones</h3>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {milestones.map((m) => (
            <div key={m.name} className={cn('flex flex-col items-center p-3 rounded-card border transition-all duration-300', m.unlocked ? 'border-emerald-brand bg-emerald-pale/10 shadow-xs' : 'border-line bg-surface-raised opacity-60')}>
              <span className={cn('grid size-10 place-items-center rounded-full text-sm font-black', m.unlocked ? 'bg-emerald-brand text-white shadow-sm' : 'bg-line text-ink-muted')}>
                {m.unlocked ? '✓' : '🔒'}
              </span>
              <strong className="mt-2 text-sm text-ink">{m.name}</strong>
              <small className="mt-1 text-xs text-ink-soft text-center">{m.req} Progress Required</small>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Curriculum Section */}
      <section className="grid gap-4" aria-labelledby="managed-skills-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Roadmap curriculum</p>
            <h2 id="managed-skills-title" className="text-2xl font-black text-ink">Skills</h2>
          </div>
          <button type="button" onClick={() => setAddSkillOpen(true)} className={cn(ui.button.base, ui.button.primary)}><Plus size={16} /> Add skill</button>
        </div>

        {isReordering && <p className="text-xs text-emerald-dark-brand animate-pulse">Saving new skill order...</p>}

        {!roadmap.skills?.length ? (
          <div className={ui.empty}>
            <BookOpenCheck size={24} />
            <p>No skills added yet.</p>
            <button type="button" onClick={() => setAddSkillOpen(true)} className={cn(ui.button.base, ui.button.primary, 'mt-2')}><Plus size={16} /> Add first skill</button>
          </div>
        ) : (
          <div className="grid gap-3">
            {roadmap.skills.map((skill, index) => {
              const expanded = Boolean(expandedSkills[skill._id])
              const progress = Number(skill.progress) || 0

              const SkillIcon = skill.level === 'Advanced' ? Trophy : skill.level === 'Intermediate' ? Medal : Award
              const levelColor = skill.level === 'Advanced' ? 'text-amber-500 bg-amber-50 border-amber-200' : skill.level === 'Intermediate' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'

              return (
                <article
                  key={skill._id}
                  id={`skill-${skill._id}`}
                  draggable={!isReordering}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnd={() => setDraggedIndex(null)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={cn(
                    ui.card,
                    'grid gap-4 p-4 transition-all duration-150 relative border min-w-0 select-none',
                    draggedIndex === index ? 'opacity-40 scale-[0.98] border-dashed border-emerald-brand' : 'border-line hover:border-line-strong',
                    skill.status === 'Completed' ? 'bg-emerald-pale/5 border-emerald-brand/35' : ''
                  )}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_220px]">
                    <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 text-left w-full min-w-0">
                      {/* Drag Handle */}
                      <span className="cursor-grab text-ink-muted p-1 hover:text-ink transition" title="Drag to reorder">
                        <GripVertical size={18} />
                      </span>

                      {/* Level Icon */}
                      <span className={cn('grid size-9 place-items-center rounded-card border text-sm font-black', levelColor)}>
                        <SkillIcon size={18} />
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpandedSkills((current) => ({ ...current, [skill._id]: !expanded }))}
                        aria-expanded={expanded}
                        className="text-left min-w-0"
                      >
                        <strong className="block truncate text-ink">{skill.title}</strong>
                        {skill.description ? (
                          <small className="text-ink-soft block truncate max-w-full">{skill.description}</small>
                        ) : (
                          <small className="text-ink-muted block italic">No description</small>
                        )}
                      </button>

                      {/* Badges info */}
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-extrabold text-ink-soft capitalize">{roadmap.category}</span>
                        <span className={cn(ui.badge.base, skill.level === 'Advanced' ? ui.badge.danger : skill.level === 'Intermediate' ? ui.badge.active : ui.badge.idle)}>{skill.level}</span>
                      </div>
                    </div>

                    <div className="hidden lg:block border-l border-line h-6 align-self-center mx-2" />

                    <div className={ui.field.control}>
                      <select
                        className={cn(ui.field.input, 'appearance-none')}
                        value={skill.status}
                        onChange={(event) => updateSkillStatus(skill._id, event.target.value)}
                        aria-label={`${skill.title} status`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <ChevronDown className="text-ink-muted" size={16} />
                    </div>
                  </div>

                  {/* Smooth animated progress slider */}
                  <div className="grid gap-2 min-w-0">
                    <div className="flex justify-between text-xs font-bold text-ink-soft">
                      <span>Skill Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <input
                      className="h-2 w-full accent-emerald-brand cursor-pointer rounded-lg bg-line appearance-none"
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(event) => updateSkillProgress(skill._id, Number(event.target.value))}
                      aria-label={`${skill.title} progress`}
                    />
                  </div>

                  {expanded && (
                    <div className="grid gap-3 border-t border-line pt-3 min-w-0">
                      {!skill.topics?.length ? (
                        <p className="text-sm text-ink-soft italic">No topics defined in this skill.</p>
                      ) : (
                        skill.topics.map((topic) => (
                          <div className="flex flex-wrap items-start justify-between gap-3 rounded-card bg-surface-raised p-3 border border-line min-w-0" key={topic._id}>
                            <div className="min-w-0">
                              <strong className="text-ink block truncate">{topic.title}</strong>
                              {topic.description && <p className="text-sm text-ink-soft mt-0.5 break-words">{topic.description}</p>}
                            </div>
                            <span className={cn(ui.badge.base, statusTone(topic.status))}>{topic.status}</span>
                          </div>
                        ))
                      )}
                      <div className="flex justify-between items-center pt-2">
                        {skill.estimatedHours ? (
                          <span className="text-xs font-extrabold text-ink-soft inline-flex items-center gap-1"><Clock3 size={13} /> {skill.estimatedHours} study hours</span>
                        ) : <span />}
                        <button type="button" onClick={() => deleteSkill(skill._id)} className={cn(ui.button.base, ui.button.danger, 'w-fit py-1.5 px-3 min-h-8 text-xs')}><Trash2 size={13} /> Delete skill</button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Add Skill Modal */}
      <Modal open={addSkillOpen} onClose={() => setAddSkillOpen(false)} title="Add skill to roadmap">
        <form onSubmit={handleAddSkill} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={ui.field.label} htmlFor="roadmap-skill-title">Title</label>
              <div className={ui.field.control}>
                <input className={ui.field.input} id="roadmap-skill-title" value={newSkill.title} onChange={(event) => setNewSkill((current) => ({ ...current, title: event.target.value }))} maxLength="200" required />
              </div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="roadmap-skill-level">Level</label>
              <div className={ui.field.control}>
                <select className={cn(ui.field.input, 'appearance-none')} id="roadmap-skill-level" value={newSkill.level} onChange={(event) => setNewSkill((current) => ({ ...current, level: event.target.value }))}>
                  {levelOptions.map((level) => <option key={level}>{level}</option>)}
                </select>
                <ChevronDown className="text-ink-muted" size={16} />
              </div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="roadmap-skill-hours">Estimated hours</label>
              <div className={ui.field.control}>
                <input className={ui.field.input} id="roadmap-skill-hours" type="number" min="1" max="10000" value={newSkill.estimatedHours} onChange={(event) => setNewSkill((current) => ({ ...current, estimatedHours: event.target.value }))} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={ui.field.label} htmlFor="roadmap-skill-description">Description</label>
              <div className={cn(ui.field.control, 'items-start')}>
                <textarea className={cn(ui.field.input, 'min-h-28 py-3')} id="roadmap-skill-description" value={newSkill.description} onChange={(event) => setNewSkill((current) => ({ ...current, description: event.target.value }))} maxLength="1000" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={addingSkill} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {addingSkill ? 'Adding...' : 'Add skill'}</button>
            <button type="button" onClick={() => setAddSkillOpen(false)} className={cn(ui.button.base, ui.button.secondary)}><X size={16} /> Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
