import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Clock3, Compass, Library, Map, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'
import { cn, ui } from '../utils/tw'

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

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading roadmaps">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton-shimmer min-h-64 rounded-panel border border-line" key={index} />)}</div>
  if (error) return <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Learning paths" title="Roadmaps" description="Organize skills into structured paths with visible progress." icon={Map} actions={<Link to="/roadmaps/new" className={cn(ui.button.base, ui.button.primary)}><Plus size={17} /> Create roadmap</Link>} />

      <div className="flex flex-wrap gap-2 rounded-card border border-line bg-white p-2 shadow-xs" role="tablist" aria-label="Roadmap views">
        <button type="button" role="tab" aria-selected={activeTab === 'my-roadmaps'} onClick={() => setActiveTab('my-roadmaps')} className={cn(ui.button.base, activeTab === 'my-roadmaps' ? 'border-emerald-brand bg-emerald-pale text-emerald-dark-brand' : ui.button.secondary)}><Compass size={16} /> My roadmaps <span>{roadmaps.length}</span></button>
        <button type="button" role="tab" aria-selected={activeTab === 'templates'} onClick={() => setActiveTab('templates')} className={cn(ui.button.base, activeTab === 'templates' ? 'border-emerald-brand bg-emerald-pale text-emerald-dark-brand' : ui.button.secondary)}><Library size={16} /> Templates <span>{templates.length}</span></button>
      </div>

      {activeTab === 'my-roadmaps' && (
        roadmaps.length === 0 ? (
          <div className="grid min-h-64 place-items-center gap-4 rounded-card border border-dashed border-line-strong bg-surface-raised p-8 text-center text-ink-soft"><Map size={25} /><p>No roadmaps yet.</p><div className="flex flex-wrap justify-center gap-2"><Link to="/roadmaps/new" className={cn(ui.button.base, ui.button.primary)}><Plus size={16} /> Create roadmap</Link><button type="button" onClick={() => setActiveTab('templates')} className={cn(ui.button.base, ui.button.secondary)}><Library size={16} /> Browse templates</button></div></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roadmaps.map((roadmap, index) => {
              const progress = Math.min(100, Math.max(0, Number(roadmap.progress) || 0))
              return (
                <Link key={roadmap._id} to={`/roadmaps/${roadmap._id}`} className={cn(ui.card, 'reveal-item grid gap-4 p-5')} style={{ '--reveal-delay': `${index * 70}ms` }}>
                  <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-card bg-emerald-pale text-emerald-dark-brand" aria-hidden="true">{roadmap.icon || <Map size={21} />}</span><span className="rounded-full border border-line bg-surface-raised px-3 py-1 text-xs font-extrabold text-ink-soft">{roadmap.status}</span></div>
                  <div><h2 className="text-xl font-black text-ink">{roadmap.title}</h2><p className="mt-1 text-sm font-extrabold uppercase text-emerald-dark-brand">{roadmap.category}</p></div>
                  {roadmap.description && <p className="text-sm leading-6 text-ink-soft">{roadmap.description}</p>}
                  <div><div className="mb-2 flex items-center justify-between text-sm"><span className="text-ink-soft">Progress</span><strong className="text-ink">{progress}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full bg-emerald-brand" style={{ width: `${progress}%` }} /></div></div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm font-bold text-ink-soft"><span className="inline-flex items-center gap-1.5"><BookOpenCheck size={15} /> {roadmap.skills?.length || 0} skills</span><ArrowRight size={18} /></div>
                </Link>
              )
            })}
          </div>
        )
      )}

      {activeTab === 'templates' && (
        templates.length === 0 ? <div className="grid min-h-64 place-items-center gap-3 rounded-card border border-dashed border-line-strong bg-surface-raised p-8 text-center text-ink-soft"><Library size={25} /><p>No templates available.</p></div> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template, index) => (
              <Link key={template._id} to={`/roadmaps/templates/${template._id}`} className={cn(ui.card, 'reveal-item grid gap-4 p-5')} style={{ '--reveal-delay': `${index * 70}ms` }}>
                <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-card bg-blue-pale text-blue-brand" aria-hidden="true">{template.icon || <Library size={21} />}</span><span className="rounded-full border border-blue-brand/20 bg-blue-pale px-3 py-1 text-xs font-extrabold text-blue-brand">{template.difficulty}</span></div>
                <div><h2 className="text-xl font-black text-ink">{template.title}</h2><p className="mt-1 text-sm font-extrabold uppercase text-emerald-dark-brand">{template.category}</p></div>
                <p className="text-sm leading-6 text-ink-soft">{template.description}</p>
                <div className="flex flex-wrap gap-2 text-sm font-bold text-ink-soft"><span className="inline-flex items-center gap-1.5"><BookOpenCheck size={15} /> {template.skills?.length || 0} skills</span>{template.estimatedHours && <span className="inline-flex items-center gap-1.5"><Clock3 size={15} /> {template.estimatedHours} hours</span>}</div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm font-bold text-ink-soft"><span>View and import</span><ArrowRight size={18} /></div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
