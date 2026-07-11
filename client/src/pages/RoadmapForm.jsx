import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, Map, Save, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'
import { cn, ui } from '../utils/tw'

const categories = ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data Science', 'Other']

export default function RoadmapForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(Boolean(id))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Other', targetDate: '' })

  useEffect(() => {
    if (!id) return
    const loadRoadmap = async () => {
      try {
        const res = await roadmapService.getRoadmap(id)
        const roadmap = res.data.roadmap
        setFormData({ title: roadmap.title, description: roadmap.description || '', category: roadmap.category, targetDate: roadmap.targetDate ? roadmap.targetDate.split('T')[0] : '' })
      } catch {
        setError('Failed to load roadmap')
      } finally {
        setLoading(false)
      }
    }
    loadRoadmap()
  }, [id])

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      if (id) {
        await roadmapService.updateRoadmap(id, formData)
        navigate(`/roadmaps/${id}`)
      } else {
        const res = await roadmapService.createRoadmap(formData)
        navigate(`/roadmaps/${res.data.roadmap._id}`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save roadmap')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow={id ? 'Update roadmap' : 'New roadmap'} title={id ? 'Edit roadmap' : 'Create a roadmap'} description="Define the destination first; skills and topics can be added next." icon={Map} />
      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}
      {loading ? <div className="skeleton-shimmer min-h-80 rounded-panel border border-line" role="status" aria-label="Loading roadmap" /> : (
        <form onSubmit={handleSubmit} className={cn(ui.panel, 'grid gap-6')}>
          <div className="flex items-start gap-4 border-b border-line pb-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-card bg-emerald-pale text-sm font-black text-emerald-dark-brand">01</span>
            <div><h2 className="text-xl font-black text-ink">Roadmap details</h2><p className="mt-1 text-sm leading-6 text-ink-soft">Give this learning path a clear identity.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={ui.field.label} htmlFor="roadmap-title">Title</label>
              <div className={ui.field.control}><input className={ui.field.input} id="roadmap-title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Advanced React mastery" maxLength="160" required /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="roadmap-category">Category</label>
              <div className={ui.field.control}><select className={ui.field.input} id="roadmap-category" name="category" value={formData.category} onChange={handleChange}>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown className="text-ink-muted" size={16} /></div>
            </div>
            <div>
              <label className={ui.field.label} htmlFor="roadmap-date">Target completion</label>
              <div className={ui.field.control}><CalendarDays size={17} className="text-ink-muted" /><input className={ui.field.input} id="roadmap-date" type="date" name="targetDate" value={formData.targetDate} onChange={handleChange} /></div>
            </div>
            <div className="md:col-span-2">
              <label className={ui.field.label} htmlFor="roadmap-description">Description</label>
              <div className={ui.field.control}><textarea className={ui.field.input} id="roadmap-description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe the outcome of this roadmap" maxLength="1000" /></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={submitting} className={cn(ui.button.base, ui.button.primary)}><Save size={17} /> {submitting ? 'Saving...' : id ? 'Update roadmap' : 'Create roadmap'}</button>
            <button type="button" onClick={() => navigate('/roadmaps')} className={cn(ui.button.base, ui.button.secondary)}><X size={17} /> Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
