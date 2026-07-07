import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, Map, Save, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'

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
    <div className="editor-page">
      <PageHeader eyebrow={id ? 'Update roadmap' : 'New roadmap'} title={id ? 'Edit roadmap' : 'Create a roadmap'} description="Define the destination first; skills and topics can be added next." icon={Map} />
      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {loading ? <div className="skeleton-panel" role="status" aria-label="Loading roadmap" /> : (
        <form onSubmit={handleSubmit} className="form-panel editor-form">
          <div className="form-section-heading"><span>01</span><div><h2>Roadmap details</h2><p>Give this learning path a clear identity.</p></div></div>
          <div className="form-grid">
            <div className="form-grid__wide"><label className="field-label" htmlFor="roadmap-title">Title</label><div className="field-control"><input id="roadmap-title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Advanced React mastery" maxLength="160" required /></div></div>
            <div><label className="field-label" htmlFor="roadmap-category">Category</label><div className="field-control"><select id="roadmap-category" name="category" value={formData.category} onChange={handleChange}>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
            <div><label className="field-label" htmlFor="roadmap-date">Target completion</label><div className="field-control field-control--icon"><CalendarDays size={17} /><input id="roadmap-date" type="date" name="targetDate" value={formData.targetDate} onChange={handleChange} /></div></div>
            <div className="form-grid__wide"><label className="field-label" htmlFor="roadmap-description">Description</label><div className="field-control"><textarea id="roadmap-description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe the outcome of this roadmap" maxLength="1000" /></div></div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={submitting} className="button button--primary"><Save size={17} /> {submitting ? 'Saving...' : id ? 'Update roadmap' : 'Create roadmap'}</button>
            <button type="button" onClick={() => navigate('/roadmaps')} className="button button--secondary"><X size={17} /> Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
