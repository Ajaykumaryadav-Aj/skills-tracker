import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Clock3, Compass, Library, Map, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'

const statusClass = (status) => ({
  'Not Started': 'status-badge--idle',
  'In Progress': 'status-badge--active',
  'In progress': 'status-badge--active',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')

export default function Roadmaps() {
  const [roadmaps, setRoadmaps] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('my-roadmaps')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roadmapsRes, templatesRes] = await Promise.all([roadmapService.getAllRoadmaps(), roadmapService.getAllTemplates()])
        setRoadmaps(roadmapsRes.data.roadmaps || [])
        setTemplates(templatesRes.data.templates || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load roadmaps')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="roadmap-grid" role="status" aria-label="Loading roadmaps">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton-roadmap" key={index} />)}</div>
  if (error) return <div className="alert alert--danger" role="alert">{error}</div>

  return (
    <div className="roadmaps-page">
      <PageHeader eyebrow="Learning paths" title="Roadmaps" description="Organize skills into structured paths with visible progress." icon={Map} actions={<Link to="/roadmaps/new" className="button button--primary"><Plus size={17} /> Create roadmap</Link>} />

      <div className="segmented-tabs" role="tablist" aria-label="Roadmap views">
        <button type="button" role="tab" aria-selected={activeTab === 'my-roadmaps'} onClick={() => setActiveTab('my-roadmaps')} className={activeTab === 'my-roadmaps' ? 'is-active' : ''}><Compass size={16} /> My roadmaps <span>{roadmaps.length}</span></button>
        <button type="button" role="tab" aria-selected={activeTab === 'templates'} onClick={() => setActiveTab('templates')} className={activeTab === 'templates' ? 'is-active' : ''}><Library size={16} /> Templates <span>{templates.length}</span></button>
      </div>

      {activeTab === 'my-roadmaps' && (
        roadmaps.length === 0 ? (
          <div className="empty-state roadmap-empty"><Map size={25} /><p>No roadmaps yet.</p><div><Link to="/roadmaps/new" className="button button--primary"><Plus size={16} /> Create roadmap</Link><button type="button" onClick={() => setActiveTab('templates')} className="button button--secondary"><Library size={16} /> Browse templates</button></div></div>
        ) : (
          <div className="roadmap-grid">
            {roadmaps.map((roadmap, index) => {
              const progress = Math.min(100, Math.max(0, Number(roadmap.progress) || 0))
              return (
                <Link key={roadmap._id} to={`/roadmaps/${roadmap._id}`} className="roadmap-card reveal-item" style={{ '--reveal-delay': `${index * 70}ms` }}>
                  <div className="roadmap-card__top"><span className="roadmap-card__icon" aria-hidden="true">{roadmap.icon || <Map size={21} />}</span><span className={`status-badge ${statusClass(roadmap.status)}`}>{roadmap.status}</span></div>
                  <h2>{roadmap.title}</h2><p className="roadmap-card__category">{roadmap.category}</p>
                  {roadmap.description && <p className="roadmap-card__description">{roadmap.description}</p>}
                  <div className="roadmap-card__progress"><div><span>Progress</span><strong>{progress}%</strong></div><div className="progress-track"><i className="progress-fill" style={{ '--progress': `${progress}%` }} /></div></div>
                  <div className="roadmap-card__footer"><span><BookOpenCheck size={15} /> {roadmap.skills?.length || 0} skills</span><ArrowRight size={18} /></div>
                </Link>
              )
            })}
          </div>
        )
      )}

      {activeTab === 'templates' && (
        templates.length === 0 ? <div className="empty-state"><Library size={25} /><p>No templates available.</p></div> : (
          <div className="roadmap-grid">
            {templates.map((template, index) => (
              <Link key={template._id} to={`/roadmaps/templates/${template._id}`} className="roadmap-card roadmap-card--template reveal-item" style={{ '--reveal-delay': `${index * 70}ms` }}>
                <div className="roadmap-card__top"><span className="roadmap-card__icon" aria-hidden="true">{template.icon || <Library size={21} />}</span><span className="status-badge status-badge--revision">{template.difficulty}</span></div>
                <h2>{template.title}</h2><p className="roadmap-card__category">{template.category}</p>
                <p className="roadmap-card__description">{template.description}</p>
                <div className="template-stats"><span><BookOpenCheck size={15} /> {template.skills?.length || 0} skills</span>{template.estimatedHours && <span><Clock3 size={15} /> {template.estimatedHours} hours</span>}</div>
                <div className="roadmap-card__footer"><span>View and import</span><ArrowRight size={18} /></div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
