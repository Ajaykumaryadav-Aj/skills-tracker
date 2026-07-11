import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, Brain, CalendarDays, FileText, History, ListChecks, MessageSquareText, Sparkles, Target } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as aiService from '../services/aiAssistantService'
import { cn, ui } from '../utils/tw'

const toolConfig = {
  roadmap: { label: 'Roadmap', icon: Target },
  planner: { label: 'Planner', icon: CalendarDays },
  summary: { label: 'Notes summary', icon: FileText },
  quiz: { label: 'Quiz', icon: ListChecks },
  interview: { label: 'Interview', icon: MessageSquareText },
}

const initialForms = {
  roadmap: { skill: 'React', currentLevel: 'Beginner', targetLevel: 'Intermediate', dailyStudyHours: 1 },
  planner: { dailyStudyHours: 1, weeklyGoal: 'Build consistency', availability: 'Weekdays evenings and weekend mornings' },
  summary: { markdown: '## Topic notes\n\nPaste your markdown notes here with enough detail to summarize.' },
  quiz: { topic: 'JavaScript closures', difficulty: 'Beginner', count: 5 },
  interview: { skill: 'Frontend', topic: 'React state management' },
}

const renderValue = (value) => {
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-ink">
        {value.map((item, index) => <li key={index}>{typeof item === 'object' ? renderObject(item) : String(item)}</li>)}
      </ul>
    )
  }
  if (value && typeof value === 'object') return renderObject(value)
  return <span className="whitespace-pre-wrap text-sm leading-6 text-ink">{String(value ?? '')}</span>
}

const renderObject = (object) => (
  <div className="grid gap-3">
    {Object.entries(object).filter(([key]) => !['providerWarning', 'providerError'].includes(key)).map(([key, value]) => (
      <div key={key} className="min-w-0 overflow-hidden rounded-card border border-line bg-white p-4 shadow-xs">
        <strong className="mb-2 block text-xs font-black uppercase text-emerald-dark-brand">{key.replace(/([A-Z])/g, ' $1')}</strong>
        {renderValue(value)}
      </div>
    ))}
  </div>
)

const friendlyError = (err, fallback) => {
  if (err.response?.status === 429) return 'AI request limit hit. Please wait 30-60 seconds, then try again. Existing AI history and other tools will still work.'
  if (err.response?.data?.errors?.length) return err.response.data.errors.map((item) => item.message || item.msg).join(', ')
  return err.response?.data?.message || `${fallback}. Please check your AI provider key/model and try again.`
}

const providerIssueMessage = (error = '') => {
  const text = String(error || '').toLowerCase()
  if (text.includes('429') || text.includes('quota')) {
    return 'Gemini quota is currently exhausted, so a local detailed fallback response is being shown. Live Gemini output will work again after your quota resets or your plan limit is increased.'
  }
  if (text.includes('api key') || text.includes('permission') || text.includes('401') || text.includes('403')) {
    return 'Gemini could not authenticate this request. Check GEMINI_API_KEY in server/.env, then restart the server.'
  }
  if (text.includes('404') || text.includes('400') || text.includes('model')) {
    return 'Gemini rejected the configured model. Use AI_MODEL=gemini-2.0-flash or leave AI_MODEL empty, then restart the server.'
  }
  return 'Gemini did not return a usable response, so a local detailed fallback response is being shown.'
}

const shouldShowProviderNotice = (result) => {
  if (!result?.fallback) return false
  const error = String(result.providerError || '').toLowerCase()
  if (!error) return false
  if (error.includes('quota') || error.includes('429')) return false
  if (error.includes('api key') || error.includes('permission') || error.includes('401') || error.includes('403')) return true
  if (error.includes('404') || error.includes('400') || error.includes('model')) return true
  return false
}

export default function AIAssistant() {
  const [activeTool, setActiveTool] = useState('roadmap')
  const [forms, setForms] = useState(initialForms)
  const [result, setResult] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [weakTopics, setWeakTopics] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState('')
  const [sideLoading, setSideLoading] = useState(true)
  const [sideError, setSideError] = useState('')
  const [toast, setToast] = useState({ type: 'success', message: '' })
  const [lastGeneratedAt, setLastGeneratedAt] = useState(0)

  const activeForm = forms[activeTool]

  const loadSideData = useCallback(async () => {
    setSideLoading(true)
    setSideError('')
    const [recommendationsRes, weakTopicsRes, historyRes] = await Promise.allSettled([
      aiService.getRecommendations(),
      aiService.getWeakTopics(),
      aiService.getHistory({ limit: 8 }),
    ])
    const fulfilledCount = [recommendationsRes, weakTopicsRes, historyRes].filter((item) => item.status === 'fulfilled').length
    if (recommendationsRes.status === 'fulfilled') setRecommendations(recommendationsRes.value.data.data)
    if (weakTopicsRes.status === 'fulfilled') setWeakTopics(weakTopicsRes.value.data.data)
    if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data.history || [])
    if (fulfilledCount === 0) {
      setSideError('AI helper panels are temporarily unavailable. You can still use the generators.')
    } else {
      setSideError('')
    }
    setSideLoading(false)
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.resolve().then(async () => {
      if (!ignore) await loadSideData()
    })
    return () => { ignore = true }
  }, [loadSideData])

  const updateForm = (field, value) => {
    setForms((current) => ({
      ...current,
      [activeTool]: { ...current[activeTool], [field]: value },
    }))
  }

  const submitTool = async (event) => {
    event.preventDefault()
    if (activeTool === 'summary' && String(activeForm.markdown || '').trim().length < 3) {
      setToast({ type: 'warning', message: 'Please enter at least a few words before generating a notes summary.' })
      return
    }
    const elapsed = Date.now() - lastGeneratedAt
    if (elapsed < 15000) {
      setToast({ type: 'warning', message: `Gemini free tier is limited. Please wait ${Math.ceil((15000 - elapsed) / 1000)} seconds before the next generation.` })
      return
    }
    setLastGeneratedAt(Date.now())
    setLoading(activeTool)
    setToast({ type: 'success', message: '' })
    try {
      const calls = {
        roadmap: aiService.generateRoadmap,
        planner: aiService.generatePlanner,
        summary: aiService.summarizeNotes,
        quiz: aiService.generateQuiz,
        interview: aiService.generateInterview,
      }
      const response = await calls[activeTool](activeForm)
      setResult({ type: activeTool, ...response.data })
      setToast({ type: response.data.fallback ? 'info' : 'success', message: response.data.fallback ? 'AI provider fallback response is ready.' : 'AI generation ready.' })
      await loadSideData()
    } catch (err) {
      setToast({ type: 'danger', message: friendlyError(err, 'AI generation failed') })
    } finally {
      setLoading('')
    }
  }

  const fields = useMemo(() => {
    if (activeTool === 'roadmap') return [
      ['skill', 'Skill', 'text'],
      ['currentLevel', 'Current level', 'text'],
      ['targetLevel', 'Target level', 'text'],
      ['dailyStudyHours', 'Daily study hours', 'number'],
    ]
    if (activeTool === 'planner') return [
      ['dailyStudyHours', 'Daily study hours', 'number'],
      ['weeklyGoal', 'Weekly goal', 'text'],
      ['availability', 'Availability', 'textarea'],
    ]
    if (activeTool === 'summary') return [['markdown', 'Markdown notes', 'textarea']]
    if (activeTool === 'quiz') return [
      ['topic', 'Topic', 'text'],
      ['difficulty', 'Difficulty', 'select'],
      ['count', 'Questions', 'number'],
    ]
    return [
      ['skill', 'Skill', 'text'],
      ['topic', 'Topic', 'text'],
    ]
  }, [activeTool])

  return (
    <section className="grid gap-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
      <PageHeader
        eyebrow="AI learning assistant"
        title="Plan, practice, and revise smarter"
        description="Generate roadmaps, planners, summaries, quizzes, interviews, and weak-topic recommendations."
        icon={Bot}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="grid min-w-0 overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-raised px-5 py-4 sm:px-6">
            <div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Workspace</p><h2 className="mt-1 text-xl font-black text-ink">{toolConfig[activeTool].label}</h2></div>
            <span className="rounded-full bg-emerald-pale px-3 py-1 text-xs font-black text-emerald-dark-brand">{loading ? 'Generating' : 'Ready'}</span>
          </div>
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="AI tools">
              {Object.entries(toolConfig).map(([key, item]) => {
                const Icon = item.icon
                return (
                  <button
                    type="button"
                    key={key}
                    className={cn(
                      ui.button.base,
                      'min-w-0 justify-center px-3 text-xs sm:text-sm',
                      activeTool === key ? 'border-emerald-brand bg-emerald-pale text-emerald-dark-brand' : ui.button.secondary,
                    )}
                    onClick={() => setActiveTool(key)}
                  >
                    <Icon size={16} className="shrink-0" /> <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitTool}>
              {fields.map(([field, label, type]) => (
                <div className={type === 'textarea' ? 'md:col-span-2' : ''} key={field}>
                  <label className={ui.field.label} htmlFor={`ai-${activeTool}-${field}`}>{label}</label>
                  <div className={cn(ui.field.control, type === 'textarea' && 'items-start')}>
                    {type === 'textarea' ? (
                      <textarea className={cn(ui.field.input, 'min-h-32 py-3 leading-6')} id={`ai-${activeTool}-${field}`} value={activeForm[field] || ''} onChange={(event) => updateForm(field, event.target.value)} rows={activeTool === 'summary' ? 10 : 4} />
                    ) : type === 'select' ? (
                      <select className={ui.field.input} id={`ai-${activeTool}-${field}`} value={activeForm[field] || 'Beginner'} onChange={(event) => updateForm(field, event.target.value)}>
                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                      </select>
                    ) : (
                      <input className={ui.field.input} id={`ai-${activeTool}-${field}`} type={type} min={type === 'number' ? '1' : undefined} value={activeForm[field] || ''} onChange={(event) => updateForm(field, type === 'number' ? Number(event.target.value) : event.target.value)} />
                    )}
                  </div>
                </div>
              ))}
              <button type="submit" className={cn(ui.button.base, ui.button.primary, 'w-full md:col-span-2')} disabled={Boolean(loading)}>
                <Sparkles size={16} className="shrink-0" /> <span>{loading ? 'Generating...' : `Generate ${toolConfig[activeTool].label}`}</span>
              </button>
            </form>

            <div className="grid gap-4 rounded-card border border-line bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Assistant output</p><h2 className="mt-1 text-xl font-black text-ink">{result ? toolConfig[result.type]?.label : 'Ready'}</h2></div><Brain size={20} className="shrink-0 text-emerald-dark-brand" /></div>
              {!result ? <p className="rounded-card border border-dashed border-line-strong bg-white p-6 text-center text-sm text-ink-soft">Choose a tool and generate your first AI response.</p> : renderValue(result.data)}
              {shouldShowProviderNotice(result) && <p className="rounded-card border border-sun/40 bg-sun-pale px-3 py-2 text-sm font-semibold text-yellow-900">{providerIssueMessage(result.providerError)}</p>}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          {sideError && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{sideError}</div>}
          <section className={cn(ui.panel, 'grid gap-4')}>
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Today</p><h2 className="mt-1 text-xl font-black text-ink">Recommendations</h2></div><Sparkles size={20} className="text-emerald-dark-brand" /></div>
            {recommendations ? renderValue(recommendations) : <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-5 text-center text-sm text-ink-soft">{sideLoading ? 'Loading recommendations...' : 'No recommendations available.'}</p>}
          </section>

          <section className={cn(ui.panel, 'grid gap-4')}>
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Signals</p><h2 className="mt-1 text-xl font-black text-ink">Weak topics</h2></div><Target size={20} className="text-emerald-dark-brand" /></div>
            {weakTopics?.weakTopics?.length ? weakTopics.weakTopics.map((topic) => (
              <div className="rounded-card border border-line bg-surface-raised p-3" key={topic.topicId || topic.title}><strong className="block text-sm font-black text-ink">{topic.title}</strong><span className="mt-1 block text-sm leading-6 text-ink-soft">{topic.priority || 'Medium'} | {topic.recommendation}</span></div>
            )) : <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-5 text-center text-sm text-ink-soft">No weak topics detected yet.</p>}
          </section>

          <section className={cn(ui.panel, 'grid gap-4')}>
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">History</p><h2 className="mt-1 text-xl font-black text-ink">Recent generations</h2></div><History size={20} className="text-emerald-dark-brand" /></div>
            {history.length === 0 ? <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-5 text-center text-sm text-ink-soft">No AI history yet.</p> : history.map((item) => (
              <button type="button" className="rounded-card border border-line bg-white p-3 text-left transition hover:border-emerald-brand hover:bg-emerald-pale" key={item._id} onClick={() => setResult({ type: item.type === 'notes-summary' ? 'summary' : item.type, data: item.response })}>
                <strong className="block text-sm font-black capitalize text-ink">{item.type}</strong><span className="mt-1 block text-xs text-ink-soft">{new Date(item.createdAt).toLocaleString()}</span>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </section>
  )
}
