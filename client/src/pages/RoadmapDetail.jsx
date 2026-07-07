import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck, Check, ChevronDown, Clock3, Download, Library, Tags } from 'lucide-react'
import * as roadmapService from '../services/roadmapService'

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

  if (loading) return <div className="skeleton-panel" role="status" aria-label="Loading roadmap" />
  if (error || !roadmap) return <div className="alert alert--danger" role="alert">{error || 'Roadmap not found'}</div>

  const isTemplate = 'skills' in roadmap && roadmap.skills?.some((skill) => !skill._id)

  return (
    <div className="roadmap-detail-page">
      <button type="button" onClick={() => navigate(-1)} className="back-link"><ArrowLeft size={16} /> Back</button>
      <section className="roadmap-detail-hero detail-panel reveal-item">
        <div className="roadmap-detail-hero__copy">
          <span className="roadmap-detail-icon" aria-hidden="true">{roadmap.icon || <Library size={24} />}</span>
          <div>
            <p className="eyebrow">{isTemplate ? 'Roadmap template' : 'Learning roadmap'}</p>
            <h1>{roadmap.title}</h1>
            <div className="roadmap-detail-tags"><span className="status-badge status-badge--active">{roadmap.category}</span>{roadmap.difficulty && <span className="status-badge status-badge--revision">{roadmap.difficulty}</span>}</div>
            {roadmap.description && <p className="roadmap-detail-description">{roadmap.description}</p>}
          </div>
        </div>

        {isTemplate && (
          <div className="import-panel">
            <label className="field-label" htmlFor="custom-roadmap-title">Custom title</label>
            <div className="field-control"><input id="custom-roadmap-title" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} maxLength="160" /></div>
            <button type="button" onClick={handleImport} disabled={importing} className="button button--primary"><Download size={16} /> {importing ? 'Importing...' : 'Import roadmap'}</button>
          </div>
        )}

        <div className="roadmap-detail-stats">
          {roadmap.estimatedHours && <div><Clock3 size={18} /><span>Estimated time<strong>{roadmap.estimatedHours} hours</strong></span></div>}
          <div><BookOpenCheck size={18} /><span>Total skills<strong>{roadmap.skills?.length || 0}</strong></span></div>
        </div>
      </section>

      {roadmap.prerequisites?.length > 0 && (
        <section className="prerequisite-band reveal-item" aria-labelledby="prerequisites-title">
          <h2 id="prerequisites-title">Prerequisites</h2>
          <ul>{roadmap.prerequisites.map((prerequisite) => <li key={prerequisite}><Check size={16} /> {prerequisite}</li>)}</ul>
        </section>
      )}

      <section className="roadmap-skills-section" aria-labelledby="roadmap-skills-title">
        <div className="section-heading-line"><div><p>Curriculum</p><h2 id="roadmap-skills-title">Skills and topics</h2></div><span>{roadmap.skills?.length || 0} skills</span></div>
        {!roadmap.skills?.length ? <div className="empty-state"><BookOpenCheck size={24} /><p>No skills defined in this roadmap.</p></div> : (
          <div className="roadmap-skill-list">
            {roadmap.skills.map((skill, skillIndex) => {
              const expanded = Boolean(expandedSkills[skillIndex])
              return (
                <article className={`roadmap-skill-item ${expanded ? 'is-expanded' : ''}`} key={`${skill.title}-${skillIndex}`}>
                  <button type="button" className="roadmap-skill-toggle" onClick={() => setExpandedSkills((current) => ({ ...current, [skillIndex]: !expanded }))} aria-expanded={expanded}>
                    <span className="roadmap-skill-number">{String(skillIndex + 1).padStart(2, '0')}</span>
                    <span><strong>{skill.title}</strong>{skill.description && <small>{skill.description}</small>}</span>
                    {skill.level && <i className="status-badge status-badge--active">{skill.level}</i>}
                    <ChevronDown size={19} className="roadmap-skill-chevron" />
                  </button>
                  {expanded && skill.topics?.length > 0 && (
                    <div className="roadmap-topic-list">
                      {skill.topics.map((topic, topicIndex) => (
                        <div className="roadmap-topic-row" key={`${topic.title}-${topicIndex}`}>
                          <span>{String(topicIndex + 1).padStart(2, '0')}</span><div><strong>{topic.title}</strong>{topic.description && <p>{topic.description}</p>}{topic.subtopics?.length > 0 && <ul>{topic.subtopics.map((subtopic) => <li key={subtopic.title}>{subtopic.title}{subtopic.description ? ` - ${subtopic.description}` : ''}</li>)}</ul>}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!expanded && <p className="roadmap-skill-summary">{skill.topics?.length || 0} topics</p>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {roadmap.keywords?.length > 0 && <section className="keyword-band"><div><Tags size={18} /><h2>Keywords</h2></div><p>{roadmap.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</p></section>}
    </div>
  )
}
