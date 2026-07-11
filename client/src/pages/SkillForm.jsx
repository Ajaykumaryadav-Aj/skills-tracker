import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookOpenCheck, CalendarDays, ChevronDown, Save, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as skillService from '../services/skillService'
import { cn, ui } from '../utils/tw'

const statusOptions = ['Not Started', 'Learning', 'Completed', 'Paused']
const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced']

export default function SkillForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    icon: 'BookOpenCheck',
    color: '#087f62',
    difficulty: 'Beginner',
    targetDate: '',
    estimatedHours: '',
    status: 'Not Started',
    progress: 0,
  })
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    skillService.getSkill(id).then((res) => {
      const skill = res.data.skill
      setForm({
        title: skill.title,
        description: skill.description,
        category: skill.category,
        icon: skill.icon || 'BookOpenCheck',
        color: skill.color || '#087f62',
        difficulty: skill.difficulty || 'Beginner',
        targetDate: (skill.targetCompletionDate || skill.targetDate) ? (skill.targetCompletionDate || skill.targetDate).slice(0, 10) : '',
        estimatedHours: skill.estimatedHours || '',
        status: skill.status,
        progress: skill.progress,
      })
    }).catch((err) => setError(err.response?.data?.message || 'Unable to load skill')).finally(() => setLoading(false))
  }, [id])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: ['progress', 'estimatedHours'].includes(name) ? (value === '' ? '' : Number(value)) : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if (form.targetDate) {
      const selected = new Date(form.targetDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selected < today) {
        setError('Target date cannot be in the past')
        return
      }
    }
    setSaving(true)
    try {
      const payload = { ...form, targetCompletionDate: form.targetDate || '' }
      if (id) await skillService.updateSkill(id, payload)
      else await skillService.createSkill(payload)
      navigate('/skills')
    } catch (err) {
      const response = err.response?.data
      if (err.request && !err.response) setError('No response from server. Check your connection.')
      else if (response?.errors?.length) setError(response.errors.map((item) => item.msg).join(', '))
      else setError(response?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow={id ? 'Update skill' : 'New skill'}
        title={id ? 'Edit skill' : 'Create a skill'}
        description="Keep the goal specific so progress stays easy to measure."
        icon={BookOpenCheck}
      />

      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}
      {loading ? <div className="skeleton-shimmer min-h-80 rounded-panel border border-line" role="status" aria-label="Loading skill" /> : (
        <form onSubmit={handleSubmit} className={cn(ui.panel, 'grid gap-6')}>
          <div className="flex items-start gap-4 border-b border-line pb-5"><span className="grid size-10 shrink-0 place-items-center rounded-card bg-emerald-pale text-sm font-black text-emerald-dark-brand">01</span><div><h2 className="text-xl font-black text-ink">Skill details</h2><p className="mt-1 text-sm leading-6 text-ink-soft">Name and organize the learning goal.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={ui.field.label} htmlFor="skill-title">Title</label>
              <div className={ui.field.control}><input className={ui.field.input} id="skill-title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. React architecture" maxLength="120" required /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="skill-category">Category</label>
              <div className={ui.field.control}><input className={ui.field.input} id="skill-category" name="category" value={form.category} onChange={handleChange} placeholder="Frontend" maxLength="80" required /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="skill-difficulty">Difficulty</label>
              <div className={ui.field.control}><select className={ui.field.input} id="skill-difficulty" name="difficulty" value={form.difficulty} onChange={handleChange}>{difficultyOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="skill-hours">Estimated hours</label>
              <div className={ui.field.control}><input className={ui.field.input} id="skill-hours" name="estimatedHours" value={form.estimatedHours} onChange={handleChange} type="number" min="1" step="0.5" placeholder="24" /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="skill-date">Target date</label>
              <div className={ui.field.control}><CalendarDays size={17} className="text-ink-muted" /><input className={ui.field.input} id="skill-date" name="targetDate" value={form.targetDate} onChange={handleChange} type="date" /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="skill-color">Color</label>
              <div className={ui.field.control}><input className="h-8 w-full cursor-pointer bg-transparent" id="skill-color" name="color" value={form.color} onChange={handleChange} type="color" /></div>
            </div>
            <div className="md:col-span-2">
              <label className={ui.field.label} htmlFor="skill-description">Description</label>
              <div className={ui.field.control}><textarea className={ui.field.input} id="skill-description" name="description" value={form.description} onChange={handleChange} placeholder="What does success look like?" maxLength="1000" /></div>
            </div>
          </div>

          <div className="border-t border-line" />
          <div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-card bg-emerald-pale text-sm font-black text-emerald-dark-brand">02</span><div><h2 className="text-xl font-black text-ink">Tracking</h2><p className="mt-1 text-sm leading-6 text-ink-soft">Set the current state and completion level.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={ui.field.label} htmlFor="skill-status">Status</label>
              <div className={ui.field.control}><select className={ui.field.input} id="skill-status" name="status" value={form.status} onChange={handleChange}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3"><label className={ui.field.label} htmlFor="skill-progress">Progress</label><output className="text-sm font-black text-emerald-dark-brand" htmlFor="skill-progress">{form.progress}%</output></div>
              <input className="h-2 w-full cursor-pointer accent-emerald-brand" id="skill-progress" name="progress" value={form.progress} onChange={handleChange} type="range" min="0" max="100" step="1" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className={cn(ui.button.base, ui.button.primary)}><Save size={17} /> {saving ? 'Saving...' : 'Save skill'}</button>
            <button type="button" onClick={() => navigate('/skills')} className={cn(ui.button.base, ui.button.secondary)}><X size={17} /> Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
