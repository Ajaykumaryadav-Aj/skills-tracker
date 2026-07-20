import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  Library,
  Map,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import * as roadmapService from '../services/roadmapService'
import { cn, ui } from '../utils/tw'

// ─── Helpers ────────────────────────────────────────────────────────────────

const levelBadgeClass = (level) => {
  if (level === 'Advanced') return 'bg-red-100 text-red-700 border-red-200'
  if (level === 'Intermediate') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-emerald-100 text-emerald-dark-brand border-emerald-200'
}

const resourceIcon = (type) => {
  if (type === 'YouTube') return '▶'
  if (type === 'Documentation') return '📄'
  if (type === 'Practice') return '💻'
  if (type === 'Course') return '🎓'
  return '📝'
}

// ─── Collapsible ─────────────────────────────────────────────────────────────

function Collapsible({ title, badge, badgeClass, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-card border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition', open ? 'rounded-t-card' : 'rounded-card hover:bg-surface')}
      >
        <span className="flex min-w-0 items-center gap-2">
          {open
            ? <ChevronDown size={15} className="shrink-0 text-ink-muted" />
            : <ChevronRight size={15} className="shrink-0 text-ink-muted" />}
          <span className="truncate text-sm font-bold text-ink">{title}</span>
          {badge != null && (
            <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold', badgeClass || 'bg-line border-line-strong text-ink-soft')}>
              {badge}
            </span>
          )}
        </span>
      </button>
      {open && <div className="border-t border-line px-4 pb-4 pt-3">{children}</div>}
    </div>
  )
}

// ─── Topic Card ──────────────────────────────────────────────────────────────

function TopicCard({ topic }) {
  return (
    <Collapsible title={topic.title}>
      <div className="grid gap-3">
        {topic.description && <p className="text-xs text-ink-soft leading-relaxed">{topic.description}</p>}

        {topic.subtopics?.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-soft">Subtopics</p>
            <ul className="grid gap-1.5">
              {topic.subtopics.map((sub, i) => (
                <li key={i} className="rounded-card border border-line bg-surface px-3 py-2">
                  <p className="text-xs font-bold text-ink">{sub.title}</p>
                  {sub.description && <p className="mt-0.5 text-xs text-ink-muted">{sub.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {topic.resources?.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-soft">Resources</p>
            <ul className="grid gap-1.5">
              {topic.resources.map((res, i) => (
                <li key={i} className="flex items-start gap-2 rounded-card border border-line bg-white px-3 py-2">
                  <span className="shrink-0 text-sm">{resourceIcon(res.type)}</span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-blue-brand hover:underline"
                    >
                      {res.title} <ExternalLink size={10} />
                    </a>
                    {res.description && <p className="mt-0.5 text-xs text-ink-muted">{res.description}</p>}
                  </div>
                  <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">{res.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Collapsible>
  )
}

// ─── Skill Module Card ────────────────────────────────────────────────────────

function SkillCard({ skill }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-card border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition', open ? 'rounded-t-card' : 'rounded-card hover:bg-surface')}
      >
        <span className="flex min-w-0 items-center gap-2">
          {open ? <ChevronDown size={15} className="shrink-0 text-ink-muted" /> : <ChevronRight size={15} className="shrink-0 text-ink-muted" />}
          <span className="truncate font-bold text-ink">{skill.title}</span>
          {skill.level && (
            <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold', levelBadgeClass(skill.level))}>
              {skill.level}
            </span>
          )}
        </span>
        {skill.estimatedHours && (
          <span className="shrink-0 text-xs font-bold text-ink-muted">{skill.estimatedHours}h</span>
        )}
      </button>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3 grid gap-3">
          {skill.whyLearn && (
            <div className="rounded-card bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 leading-relaxed">
              <strong className="block mb-0.5">💡 Why learn this</strong>
              {skill.whyLearn}
            </div>
          )}

          <div className="grid gap-1 text-xs">
            {skill.description && <p className="text-ink leading-relaxed">{skill.description}</p>}
            {skill.practiceTask && <p className="text-ink-soft"><strong className="text-ink">🎯 Practice:</strong> {skill.practiceTask}</p>}
            {skill.miniAssignment && <p className="text-ink-soft"><strong className="text-ink">📋 Assignment:</strong> {skill.miniAssignment}</p>}
          </div>

          {skill.commonMistakes?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold text-red-600">⚠ Common Mistakes</p>
              <ul className="grid gap-1">
                {skill.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-ink-soft"><span className="shrink-0 text-red-400">•</span>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {skill.topics?.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs font-extrabold uppercase text-ink-muted tracking-wide">Topics</p>
              {skill.topics.map((topic, tIdx) => <TopicCard key={tIdx} topic={topic} />)}
            </div>
          )}

          {skill.interviewQuestions?.length > 0 && (
            <Collapsible title="Interview Questions" badge={skill.interviewQuestions.length}>
              <ul className="grid gap-1.5">
                {skill.interviewQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-xs text-ink">
                    <span className="shrink-0 font-bold text-purple-600">Q{i + 1}.</span>{q}
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Phase Section ────────────────────────────────────────────────────────────

function PhaseSection({ phase, skills }) {
  const [open, setOpen] = useState(true)
  const totalHours = skills.reduce((s, sk) => s + (Number(sk.estimatedHours) || 0), 0)
  return (
    <div className="rounded-panel border-2 border-purple-200 bg-purple-50/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={18} className="text-purple-600" /> : <ChevronRight size={18} className="text-purple-600" />}
          <span className="font-black text-purple-800">{phase}</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">{skills.length} modules</span>
        </span>
        {totalHours > 0 && <span className="shrink-0 text-xs font-bold text-purple-600">{totalHours}h</span>}
      </button>
      {open && (
        <div className="grid gap-2 px-4 pb-4">
          {skills.map((skill, idx) => <SkillCard key={idx} skill={skill} />)}
        </div>
      )}
    </div>
  )
}

// ─── Generated Roadmap Preview ────────────────────────────────────────────────

function GeneratedRoadmapPreview({ roadmap }) {
  const phases = {}
  ;(roadmap.skills || []).forEach((skill) => {
    const key = skill.phase || 'General'
    if (!phases[key]) phases[key] = []
    phases[key].push(skill)
  })

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="rounded-panel border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/40 p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{roadmap.icon || '🚀'}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-ink">{roadmap.title}</h3>
            <p className="mt-0.5 text-xs font-extrabold uppercase tracking-wide text-purple-700">
              {[roadmap.category, roadmap.difficulty, roadmap.estimatedDuration, roadmap.estimatedHours && `${roadmap.estimatedHours}h`].filter(Boolean).join(' • ')}
            </p>
            {roadmap.description && <p className="mt-2 text-xs text-ink-soft leading-relaxed">{roadmap.description}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Phases', value: Object.keys(phases).length },
          { label: 'Modules', value: (roadmap.skills || []).length },
          { label: 'Est. Hours', value: roadmap.estimatedHours || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-card border border-line bg-white p-3 text-center">
            <p className="text-lg font-black text-purple-700">{value}</p>
            <p className="text-xs font-bold text-ink-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Milestones */}
      {roadmap.milestones?.length > 0 && (
        <Collapsible title="🏆 Milestones" defaultOpen badge={roadmap.milestones.length}>
          <div className="grid gap-2">
            {roadmap.milestones.map((m, i) => (
              <div key={i} className="flex gap-3 rounded-card border border-line bg-surface p-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-brand" />
                <div>
                  <p className="text-xs font-bold text-ink">{m.phase} — {m.title}</p>
                  {m.description && <p className="mt-0.5 text-xs text-ink-soft">{m.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Phases & Skills */}
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">Learning Path</p>
        <div className="grid gap-3">
          {Object.entries(phases).map(([phase, skills]) => (
            <PhaseSection key={phase} phase={phase} skills={skills} />
          ))}
        </div>
      </div>

      {/* Weekly Study Plan */}
      {roadmap.weeklyStudyPlan?.length > 0 && (
        <Collapsible title="📅 Weekly Study Plan" badge={roadmap.weeklyStudyPlan.length}>
          <ol className="grid gap-1.5">
            {roadmap.weeklyStudyPlan.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink">
                <span className="shrink-0 font-black text-purple-600">{i + 1}.</span>{item}
              </li>
            ))}
          </ol>
        </Collapsible>
      )}

      {/* Portfolio Projects */}
      {roadmap.portfolioProjects?.length > 0 && (
        <Collapsible title="🗂 Portfolio Projects" badge={roadmap.portfolioProjects.length}>
          <div className="grid gap-2">
            {roadmap.portfolioProjects.map((p, i) => (
              <div key={i} className="rounded-card border border-line bg-surface p-3">
                <p className="text-xs font-black text-ink">{p.title}</p>
                {p.description && <p className="mt-0.5 text-xs text-ink-soft">{p.description}</p>}
                {p.skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.skills.map((s, si) => (
                      <span key={si} className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Interview Checklist */}
      {roadmap.interviewChecklist?.length > 0 && (
        <Collapsible title="🎯 Interview Preparation Checklist" badge={roadmap.interviewChecklist.length}>
          <ul className="grid gap-1.5">
            {roadmap.interviewChecklist.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-brand" />{item}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* Revision Checklist */}
      {roadmap.revisionChecklist?.length > 0 && (
        <Collapsible title="🔄 Revision Checklist" badge={roadmap.revisionChecklist.length}>
          <ul className="grid gap-1.5">
            {roadmap.revisionChecklist.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink">
                <span className="shrink-0 text-purple-400 font-bold">✓</span>{item}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* Resume Projects */}
      {roadmap.resumeProjects?.length > 0 && (
        <Collapsible title="📄 Resume Project Ideas" badge={roadmap.resumeProjects.length}>
          <ul className="grid gap-1.5">
            {roadmap.resumeProjects.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink">
                <span className="shrink-0 font-bold text-purple-600">•</span>{item}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Roadmaps() {
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('my-roadmaps')

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiGoal, setAiGoal] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null)
  const [importingAi, setImportingAi] = useState(false)
  const [aiError, setAiError] = useState('')
  // Ref to cancel in-flight AI request and prevent duplicate submissions
  const aiRequestRef = useRef(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const [roadmapsRes, templatesRes] = await Promise.all([
          roadmapService.getAllRoadmaps(),
          roadmapService.getAllTemplates(),
        ])
        if (!ignore) {
          setRoadmaps(roadmapsRes.data.roadmaps || [])
          setTemplates(templatesRes.data.templates || [])
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Failed to load roadmaps')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const generationSteps = [
    'Analyzing your learning goal…',
    'Structuring phases and modules…',
    'Building topics, subtopics & resources…',
    'Generating interview prep & portfolio projects…',
    'Finalising your roadmap…',
  ]

  const handleAiSubmit = async (e) => {
    e.preventDefault()
    if (!aiGoal.trim()) return
    // Prevent duplicate in-flight requests (e.g. double-click)
    if (isGenerating) return

    // Cancel any previous stale request
    if (aiRequestRef.current) {
      aiRequestRef.current.abort()
    }
    const controller = new AbortController()
    aiRequestRef.current = controller

    setIsGenerating(true)
    setGenerationStep(0)
    setGeneratedRoadmap(null)
    setAiError('')

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < generationSteps.length - 1 ? prev + 1 : prev))
    }, 3500)

    try {
      const res = await roadmapService.generateStructuredRoadmap(aiGoal.trim(), controller.signal)
      // Don't process if this request was aborted
      if (controller.signal.aborted) return
      const roadmap = res.data?.data || res.data
      if (!roadmap || !roadmap.title) throw new Error('AI returned an incomplete roadmap. Please try again.')
      setGeneratedRoadmap(roadmap)
    } catch (err) {
      // Ignore cancellation errors (user cancelled or component unmounted)
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') return
      const msg = err.response?.data?.message || err.message || 'Failed to generate roadmap. Please try again.'
      setAiError(msg)
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
      aiRequestRef.current = null
    }
  }

  const handleImportAiRoadmap = async () => {
    if (!generatedRoadmap) return
    try {
      setImportingAi(true)
      setAiError('')
      const payload = {
        title: generatedRoadmap.title,
        description: generatedRoadmap.description,
        icon: generatedRoadmap.icon,
        category: generatedRoadmap.category || 'Other',
        estimatedHours: generatedRoadmap.estimatedHours,
        skills: (generatedRoadmap.skills || []).map((skill) => ({
          title: skill.title,
          description: [
            skill.description,
            skill.whyLearn ? `Why learn: ${skill.whyLearn}` : null,
            skill.practiceTask ? `Practice task: ${skill.practiceTask}` : null,
            skill.miniAssignment ? `Assignment: ${skill.miniAssignment}` : null,
          ].filter(Boolean).join('\n\n'),
          level: skill.level || 'Beginner',
          estimatedHours: skill.estimatedHours || 10,
          topics: (skill.topics || []).map((topic) => ({
            title: topic.title,
            description: topic.description,
            subtopics: (topic.subtopics || []).slice(0, 5).map((sub) => ({
              title: sub.title,
              description: sub.description,
              resources: (topic.resources || []).slice(0, 3).map((res) => ({
                title: res.title,
                url: res.url,
                type: res.type,
                description: res.description,
              })),
            })),
          })),
        })),
      }
      const res = await roadmapService.createRoadmap(payload)
      setAiModalOpen(false)
      setAiGoal('')
      setGeneratedRoadmap(null)
      navigate(`/roadmaps/${res.data.roadmap._id}`)
    } catch {
      setAiError('Failed to import AI roadmap. Please try again.')
    } finally {
      setImportingAi(false)
    }
  }

  const resetAiModal = () => {
    setGeneratedRoadmap(null)
    setAiGoal('')
    setAiError('')
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading roadmaps">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="skeleton-shimmer min-h-64 rounded-panel border border-line" key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Learning paths"
        title="Roadmaps"
        description="Organize skills into structured paths with visible progress."
        icon={Map}
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className={cn(ui.button.base, ui.button.secondary, 'w-full sm:w-auto border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300')}
            >
              <Sparkles size={17} /> Generate with AI
            </button>
            <Link to="/roadmaps/new" className={cn(ui.button.base, ui.button.primary, 'w-full sm:w-auto')}>
              <Plus size={17} /> Create roadmap
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-card border border-line bg-white p-2 shadow-xs" role="tablist" aria-label="Roadmap views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'my-roadmaps'}
          onClick={() => setActiveTab('my-roadmaps')}
          className={cn(ui.button.base, activeTab === 'my-roadmaps' ? 'border-emerald-brand bg-emerald-pale text-emerald-dark-brand' : ui.button.secondary)}
        >
          <Compass size={16} /> My roadmaps <span className="ml-1 rounded-full bg-emerald-pale px-2 py-0.5 text-xs">{roadmaps.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          className={cn(ui.button.base, activeTab === 'templates' ? 'border-emerald-brand bg-emerald-pale text-emerald-dark-brand' : ui.button.secondary)}
        >
          <Library size={16} /> Templates <span className="ml-1 rounded-full bg-emerald-pale px-2 py-0.5 text-xs">{templates.length}</span>
        </button>
      </div>

      {activeTab === 'my-roadmaps' && (
        roadmaps.length === 0 ? (
          <div className={ui.empty}>
            <Map size={32} />
            <h3 className="text-lg font-black text-ink">No Roadmaps Found</h3>
            <p className="max-w-md">You haven't created or imported any roadmaps yet. Start by defining a custom path or browsing our templates.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Link to="/roadmaps/new" className={cn(ui.button.base, ui.button.primary)}>
                <Plus size={16} /> Create custom roadmap
              </Link>
              <button type="button" onClick={() => setActiveTab('templates')} className={cn(ui.button.base, ui.button.secondary)}>
                <Library size={16} /> Browse templates
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roadmaps.map((roadmap, index) => {
              const progress = Math.min(100, Math.max(0, Number(roadmap.progress) || 0))
              return (
                <Link
                  key={roadmap._id}
                  to={`/roadmaps/${roadmap._id}`}
                  className={cn(ui.card, 'reveal-item grid gap-4 p-5 border border-line hover:border-line-strong hover:shadow-card-hover min-w-0')}
                  style={{ '--reveal-delay': `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-card bg-emerald-pale text-xl" aria-hidden="true">
                      {roadmap.icon || '📍'}
                    </span>
                    <span className={cn(ui.badge.base, roadmap.status === 'Completed' ? ui.badge.active : roadmap.status === 'In Progress' ? ui.badge.active : ui.badge.idle)}>
                      {roadmap.status}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-ink line-clamp-2 break-words leading-tight" style={{ minHeight: '3.5rem' }}>
                      {roadmap.title ? roadmap.title.replace(/&amp;/g, '&') : ''}
                    </h2>
                    <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-emerald-dark-brand">{roadmap.category}</p>
                  </div>
                  {roadmap.description ? (
                    <p className="text-sm leading-6 text-ink-soft line-clamp-2">{roadmap.description}</p>
                  ) : (
                    <p className="text-sm leading-6 text-ink-muted italic">No description added.</p>
                  )}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold">
                      <span className="text-ink-soft">Progress</span>
                      <strong className="text-ink">{progress}%</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <i className="block h-full rounded-full bg-emerald-brand transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs font-extrabold text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><BookOpenCheck size={14} /> {roadmap.skills?.length || 0} skills</span>
                    <ArrowRight size={16} className="text-emerald-dark-brand" />
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}

      {activeTab === 'templates' && (
        templates.length === 0 ? (
          <div className={ui.empty}>
            <Library size={32} />
            <h3 className="text-lg font-black text-ink">No Templates Available</h3>
            <p>We are currently updating our templates catalog. Please check back later or build a custom path.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template, index) => (
              <Link
                key={template._id}
                to={`/roadmaps/templates/${template._id}`}
                className={cn(ui.card, 'reveal-item grid gap-4 p-5 border border-line hover:border-line-strong hover:shadow-card-hover min-w-0')}
                style={{ '--reveal-delay': `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-card bg-blue-pale text-xl shadow-xs" aria-hidden="true">
                    {template.icon || '📘'}
                  </span>
                  <span className={cn(ui.badge.base, template.difficulty === 'Advanced' ? ui.badge.danger : template.difficulty === 'Intermediate' ? ui.badge.active : ui.badge.idle)}>
                    {template.difficulty}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-ink truncate">{template.title}</h2>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-emerald-dark-brand">{template.category}</p>
                </div>
                <p className="text-sm leading-6 text-ink-soft line-clamp-2">{template.description}</p>
                <div className="flex flex-wrap gap-3 text-xs font-extrabold text-ink-soft">
                  <span className="inline-flex items-center gap-1.5"><BookOpenCheck size={14} /> {template.skills?.length || 0} skills</span>
                  {template.estimatedHours && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {template.estimatedHours} hours</span>}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs font-extrabold text-ink-soft">
                  <span>View and import template</span>
                  <ArrowRight size={16} className="text-blue-brand" />
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ── AI Roadmap Generator Modal ── */}
      <Modal
        open={aiModalOpen}
        onClose={() => { if (!isGenerating) { setAiModalOpen(false); resetAiModal() } }}
        title="Generate Learning Roadmap with AI"
      >
        {/* Step 1: Goal input */}
        {!isGenerating && !generatedRoadmap && (
          <form onSubmit={handleAiSubmit} className="grid gap-4">
            <p className="text-sm text-ink-soft leading-relaxed">
              Describe your goal and Gemini AI will generate a complete, structured learning roadmap with phases, modules, topics, subtopics, resources, interview prep, and portfolio projects — similar to roadmap.sh and Coursera.
            </p>

            <div className="grid gap-1.5">
              <p className="text-xs font-bold text-ink-soft">Quick examples:</p>
              <div className="flex flex-wrap gap-1.5">
                {['React Developer', 'MERN Stack', 'Java Backend', 'Docker & Kubernetes', 'Python for Data Science', 'Machine Learning', 'DevOps', 'DSA & System Design'].map((ex) => (
                  <button key={ex} type="button" onClick={() => setAiGoal(ex)} className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition">
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={ui.field.label} htmlFor="ai-goal-input">What do you want to learn?</label>
              <div className={cn(ui.field.control, 'items-start')}>
                <textarea
                  id="ai-goal-input"
                  className={cn(ui.field.input, 'min-h-24 py-3')}
                  placeholder="e.g. React Developer — I want to learn React from scratch and build production-ready apps with hooks, state management, routing, testing, and deployment."
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  maxLength={500}
                  required
                />
              </div>
            </div>

            {aiError && (
              <div className="flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />{aiError}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={() => { setAiModalOpen(false); resetAiModal() }} className={cn(ui.button.base, ui.button.secondary)}>
                <X size={16} /> Cancel
              </button>
              <button
                type="submit"
                disabled={!aiGoal.trim() || isGenerating}
                className={cn(ui.button.base, 'bg-purple-700 text-white border-purple-700 hover:bg-purple-800 disabled:opacity-50 inline-flex items-center gap-2 px-4 py-2 rounded-card text-sm font-bold transition')}
              >
                <Sparkles size={16} /> Generate with AI
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Generating */}
        {isGenerating && (
          <div className="flex flex-col items-center py-10 text-center gap-5">
            <span className="relative flex h-14 w-14">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-14 w-14 bg-purple-700 justify-center items-center text-white shadow-lg">
                <Sparkles size={22} />
              </span>
            </span>
            <div>
              <h3 className="font-black text-lg text-ink">Generating Your Roadmap…</h3>
              <p className="text-sm text-purple-700 font-semibold mt-1 animate-pulse">{generationSteps[generationStep]}</p>
              <p className="text-xs text-ink-muted mt-2">This may take 30–120 seconds. Please wait and do not close this window.</p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {generationSteps.map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i <= generationStep ? 'w-6 bg-purple-600' : 'w-2 bg-purple-200')} />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {generatedRoadmap && (
          <div className="grid gap-4">
            <div className="max-h-[62vh] overflow-y-auto pr-0.5 -mr-0.5">
              <GeneratedRoadmapPreview roadmap={generatedRoadmap} />
            </div>

            {aiError && (
              <div className="flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />{aiError}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-between items-center border-t border-line pt-4">
              <button type="button" onClick={resetAiModal} className={cn(ui.button.base, ui.button.secondary)}>
                ← Try another goal
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setAiModalOpen(false); resetAiModal() }} className={cn(ui.button.base, ui.button.secondary)}>
                  <X size={16} /> Close
                </button>
                <button
                  type="button"
                  onClick={handleImportAiRoadmap}
                  disabled={importingAi}
                  className={cn(ui.button.base, 'bg-purple-700 text-white border-purple-700 hover:bg-purple-800 disabled:opacity-50 inline-flex items-center gap-2 px-4 py-2 rounded-card text-sm font-bold transition')}
                >
                  <Plus size={16} /> {importingAi ? 'Importing…' : 'Import to My Roadmaps'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
