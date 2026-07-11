import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck, Check, ChevronDown, Clock3, Download, Library, Tags } from 'lucide-react'
import * as roadmapService from '../services/roadmapService'
import { cn, ui } from '../utils/tw'

export default function RoadmapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [expandedSkills, setExpandedSkills] = useState({})

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const res = await roadmapService.getTemplate(id)
        setRoadmap(res.data.template)
        setCustomTitle(res.data.template.title)
      } catch {
        try {
          const res = await roadmapService.getRoadmap(id)
          setRoadmap(res.data.roadmap)
        } catch {
          setError('Roadmap not found')
        }
      } finally {
        setLoading(false)
      }
    }
    loadRoadmap()
  }, [id])

  const handleImport = async () => {
    try {
      setImporting(true)
      const res = await roadmapService.importTemplate(id, { title: customTitle.trim() || roadmap.title })
      navigate(`/roadmaps/${res.data.roadmap._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import roadmap')
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <div className="skeleton-shimmer h-80 rounded-panel" role="status" aria-label="Loading roadmap" />
  if (error || !roadmap) return <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error || 'Roadmap not found'}</div>

  const isTemplate = 'skills' in roadmap && roadmap.skills?.some((skill) => !skill._id)

  return (
    <div className="grid gap-5">
      <button type="button" onClick={() => navigate(-1)} className={cn(ui.button.base, ui.button.secondary, 'w-fit')}><ArrowLeft size={16} /> Back</button>
      <section className={cn(ui.panel, 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]')}>
        <div className="flex min-w-0 gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-card bg-emerald-pale text-emerald-dark-brand" aria-hidden="true">{roadmap.icon || <Library size={24} />}</span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">{isTemplate ? 'Roadmap template' : 'Learning roadmap'}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-ink">{roadmap.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2"><span className={cn(ui.badge.base, ui.badge.active)}>{roadmap.category}</span>{roadmap.difficulty && <span className={cn(ui.badge.base, ui.badge.revision)}>{roadmap.difficulty}</span>}</div>
            {roadmap.description && <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">{roadmap.description}</p>}
          </div>
        </div>
        <div className="grid content-start gap-4">
          {isTemplate && (
            <div className="grid gap-3 rounded-card border border-line bg-surface-raised p-4">
              <label className={ui.field.label} htmlFor="custom-roadmap-title">Custom title</label>
              <div className={ui.field.control}><input className={ui.field.input} id="custom-roadmap-title" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} maxLength="160" /></div>
              <button type="button" onClick={handleImport} disabled={importing} className={cn(ui.button.base, ui.button.primary)}><Download size={16} /> {importing ? 'Importing...' : 'Import roadmap'}</button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {roadmap.estimatedHours && <div className="rounded-card border border-line p-4"><Clock3 size={18} /><span className="mt-2 block text-sm text-ink-soft">Estimated time</span><strong className="text-ink">{roadmap.estimatedHours} hours</strong></div>}
            <div className="rounded-card border border-line p-4"><BookOpenCheck size={18} /><span className="mt-2 block text-sm text-ink-soft">Total skills</span><strong className="text-ink">{roadmap.skills?.length || 0}</strong></div>
          </div>
        </div>
      </section>

      {roadmap.prerequisites?.length > 0 && (
        <section className={cn(ui.panel, 'grid gap-3')} aria-labelledby="prerequisites-title">
          <h2 id="prerequisites-title" className="text-xl font-black text-ink">Prerequisites</h2>
          <ul className="grid gap-2 sm:grid-cols-2">{roadmap.prerequisites.map((prerequisite) => <li className="flex items-center gap-2 text-sm text-ink-soft" key={prerequisite}><Check size={16} className="text-emerald-dark-brand" /> {prerequisite}</li>)}</ul>
        </section>
      )}

      <section className="grid gap-4" aria-labelledby="roadmap-skills-title">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Curriculum</p><h2 id="roadmap-skills-title" className="text-2xl font-black text-ink">Skills and topics</h2></div><span className={cn(ui.badge.base, ui.badge.idle)}>{roadmap.skills?.length || 0} skills</span></div>
        {!roadmap.skills?.length ? <div className={ui.empty}><BookOpenCheck size={24} /><p>No skills defined in this roadmap.</p></div> : (
          <div className="grid gap-3">
            {roadmap.skills.map((skill, skillIndex) => {
              const expanded = Boolean(expandedSkills[skillIndex])
              return (
                <article className={cn(ui.card, 'grid gap-3 p-4')} key={`${skill.title}-${skillIndex}`}>
                  <button type="button" className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-left" onClick={() => setExpandedSkills((current) => ({ ...current, [skillIndex]: !expanded }))} aria-expanded={expanded}>
                    <span className="grid size-9 place-items-center rounded-card bg-surface-raised text-xs font-black text-ink-soft">{String(skillIndex + 1).padStart(2, '0')}</span>
                    <span className="min-w-0"><strong className="block truncate text-ink">{skill.title}</strong>{skill.description && <small className="text-ink-soft">{skill.description}</small>}</span>
                    {skill.level && <i className={cn(ui.badge.base, ui.badge.active)}>{skill.level}</i>}
                    <ChevronDown size={19} className={cn('text-ink-muted transition', expanded && 'rotate-180')} />
                  </button>
                  {expanded && skill.topics?.length > 0 && (
                    <div className="grid gap-2 border-t border-line pt-3">
                      {skill.topics.map((topic, topicIndex) => (
                        <div className="grid grid-cols-[auto_1fr] gap-3 rounded-card bg-surface-raised p-3" key={`${topic.title}-${topicIndex}`}>
                          <span className="text-xs font-black text-ink-muted">{String(topicIndex + 1).padStart(2, '0')}</span><div><strong className="text-ink">{topic.title}</strong>{topic.description && <p className="text-sm text-ink-soft">{topic.description}</p>}{topic.subtopics?.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">{topic.subtopics.map((subtopic) => <li key={subtopic.title}>{subtopic.title}{subtopic.description ? ` - ${subtopic.description}` : ''}</li>)}</ul>}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!expanded && <p className="text-sm text-ink-soft">{skill.topics?.length || 0} topics</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {roadmap.keywords?.length > 0 && <section className={cn(ui.panel, 'grid gap-3')}><div className="flex items-center gap-2"><Tags size={18} className="text-emerald-dark-brand" /><h2 className="text-xl font-black text-ink">Keywords</h2></div><p className="flex flex-wrap gap-2">{roadmap.keywords.map((keyword) => <span className={cn(ui.badge.base, ui.badge.idle)} key={keyword}>{keyword}</span>)}</p></section>}
    </div>
  )
}
