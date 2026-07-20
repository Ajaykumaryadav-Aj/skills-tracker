import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Bot,
  Brain,
  CalendarDays,
  FileText,
  History,
  MessageSquareText,
  Sparkles,
  Bug,
  BookOpen,
  Mic,
  Copy,
  Check,
  Send,
  User,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
  Search
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as aiService from '../services/aiAssistantService'
import { cn, ui } from '../utils/tw'

// ─── TOOL CONFIG ────────────────────────────────────────────────────────────

const toolConfig = {
  chat: { label: 'AI Chat', icon: MessageSquareText, description: 'Ask any programming or learning question.' },
  debug: { label: 'Code Debug', icon: Bug, description: 'Paste code to detect bugs and get corrected code.' },
  notes: { label: 'Notes Generator', icon: FileText, description: 'Generate comprehensive study notes.' },
  interview: { label: 'Interview Prep', icon: Mic, description: 'Practice with technical and HR interview questions.' },
  planner: { label: 'Study Planner', icon: CalendarDays, description: 'Create daily, weekly, and monthly study plans.' },
  resources: { label: 'Resources', icon: BookOpen, description: 'Discover documentation, YouTube, and articles.' },
}

const initialForms = {
  chat: { message: '' },
  debug: { code: `function findMax(arr) {\n  let max = arr[0];\n  for (let i = 1; i <= arr.length; i++) {\n    if (arr[i] > max) {\n      max = arr[i];\n    }\n  }\n  return max;\n}`, language: 'JavaScript' },
  notes: { topic: 'React Fiber Architecture', type: 'Detailed Notes', level: 'Simple Language (ELIF5)' },
  interview: { topic: 'JavaScript Closures', type: 'Technical', difficulty: 'Beginner' },
  planner: { skill: 'TypeScript', dailyStudyHours: 2, weeklyGoal: 'Build a solid foundation and complete 3 practice tasks' },
  resources: { topic: 'Docker Containers' },
}

// ─── SIMPLE MARKDOWN VIEWER ──────────────────────────────────────────────────

function SimpleMarkdown({ text }) {
  if (!text) return null

  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 leading-relaxed text-ink text-sm">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/)
          const lang = match ? match[1] : ''
          const code = match ? match[2] : part.slice(3, -3)
          return <CodeBlock key={index} code={code} language={lang} />
        }

        return (
          <div key={index} className="space-y-1">
            {part.split('\n').map((line, lIdx) => {
              const clean = line.trim()
              if (!clean) return <div key={lIdx} className="h-2" />
              if (clean.startsWith('- ') || clean.startsWith('* ')) {
                return (
                  <li key={lIdx} className="ml-4 list-disc pl-1">
                    {clean.substring(2)}
                  </li>
                )
              }
              if (clean.startsWith('### ')) {
                return <h4 key={lIdx} className="mt-3 text-sm font-black text-ink">{clean.substring(4)}</h4>
              }
              if (clean.startsWith('## ')) {
                return <h3 key={lIdx} className="mt-4 text-base font-black text-ink">{clean.substring(3)}</h3>
              }
              if (clean.startsWith('# ')) {
                return <h2 key={lIdx} className="mt-5 text-lg font-black text-ink">{clean.substring(2)}</h2>
              }
              return <p key={lIdx}>{line}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-card border border-line-strong overflow-hidden bg-zinc-950 font-mono text-xs">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800 text-zinc-400">
        <span className="font-sans font-bold uppercase tracking-wider text-[10px]">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition py-0.5 px-1.5 rounded bg-zinc-800 hover:bg-zinc-700"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-zinc-100 whitespace-pre leading-relaxed">{code.trim()}</pre>
    </div>
  )
}

// ─── MODULE VIEWS ────────────────────────────────────────────────────────────

function ChatView({ messages, onSendMessage, loading }) {
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-[500px] border border-line rounded-card bg-surface-raised overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-ink-muted">
            <MessageSquareText size={32} className="text-emerald-brand animate-bounce mb-2" />
            <h4 className="font-black text-ink">AI Assistant Chat</h4>
            <p className="text-xs max-w-sm mt-1">Ask study, coding, or architecture questions. Renders formatted code and markdown answers.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={cn('flex items-start gap-2.5 max-w-[85%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
              <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs', msg.sender === 'user' ? 'bg-emerald-pale text-emerald-dark-brand border border-emerald-200' : 'bg-purple-100 text-purple-700 border border-purple-200')}>
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn('rounded-card p-3.5 border shadow-xs leading-relaxed', msg.sender === 'user' ? 'bg-emerald-brand text-white border-emerald-dark-brand' : 'bg-white text-ink border-line')}>
                {msg.sender === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <SimpleMarkdown text={msg.text} />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={onSendMessage} className="flex gap-2 border-t border-line bg-white p-3">
        <input
          type="text"
          className={cn(ui.field.input, 'flex-1 min-h-10')}
          placeholder="Ask anything..."
          name="chatMessage"
          autoComplete="off"
          disabled={loading}
          required
        />
        <button
          type="submit"
          className={cn(ui.button.base, ui.button.primary, 'px-4 shrink-0 min-h-10 bg-emerald-brand text-white')}
          disabled={loading}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

function DebugView({ data }) {
  if (!data) return null
  return (
    <div className="grid gap-4">
      <div className={cn('rounded-card border p-4', data.hasBug ? 'bg-red-50/55 border-red-200 text-red-900' : 'bg-emerald-50/50 border-emerald-200 text-emerald-950')}>
        <h4 className="text-sm font-black flex items-center gap-1.5">
          <Bug size={16} /> {data.hasBug ? 'Bugs Detected' : 'No Major Bugs Found'}
        </h4>
        <p className="text-xs mt-1.5 leading-relaxed">{data.explanation}</p>
      </div>

      {data.correctedCode && (
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-ink-muted mb-1.5">Corrected Code</p>
          <CodeBlock code={data.correctedCode} language="javascript" />
        </div>
      )}

      {data.bestPractices?.length > 0 && (
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-ink-muted mb-2">Best Practices Suggested</p>
          <ul className="grid gap-2">
            {data.bestPractices.map((bp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-soft">
                <span className="shrink-0 text-emerald-brand font-bold">✓</span>
                <span className="leading-relaxed">{bp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NotesView({ data }) {
  if (!data) return null
  return (
    <div className="grid gap-4 bg-white border border-line rounded-card p-5">
      <div className="border-b border-line pb-3">
        <h3 className="text-lg font-black text-ink">{data.title}</h3>
      </div>

      <div className="prose max-w-none text-xs text-ink-soft">
        <SimpleMarkdown text={data.content} />
      </div>

      {data.keyTakeaways?.length > 0 && (
        <div className="rounded-card bg-purple-50/30 border border-purple-100 p-4 mt-3">
          <strong className="block text-xs font-extrabold text-purple-700 uppercase tracking-wide mb-2">💡 Key Takeaways</strong>
          <ul className="grid gap-2">
            {data.keyTakeaways.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-ink-soft">
                <span className="shrink-0 text-purple-500">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.quickReview && (
        <div className="rounded-card border border-line bg-surface p-3.5 mt-1 text-xs">
          <strong className="block text-ink font-bold">🔄 Quick Review Tip</strong>
          <p className="mt-1 text-ink-soft leading-relaxed">{data.quickReview}</p>
        </div>
      )}
    </div>
  )
}

function InterviewView({ data }) {
  const [revealed, setRevealed] = useState({})

  if (!data) return null

  const renderLevelGroup = (level, questions) => {
    if (!questions || questions.length === 0) return null
    return (
      <div className="grid gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-ink-muted border-b border-line pb-1.5">{level}</p>
        {questions.map((q, idx) => {
          const key = `${level}-${idx}`
          const isRevealed = revealed[key]
          return (
            <div key={idx} className="rounded-card border border-line bg-white">
              <button
                type="button"
                onClick={() => setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-bold text-ink hover:bg-surface transition text-xs"
              >
                <span>{q.question}</span>
                {isRevealed ? <ChevronDown size={14} className="shrink-0 text-ink-muted" /> : <ChevronRight size={14} className="shrink-0 text-ink-muted" />}
              </button>
              {isRevealed && (
                <div className="border-t border-line bg-surface/50 p-4 text-xs text-ink-soft leading-relaxed whitespace-pre-wrap">
                  <strong className="block text-emerald-dark-brand mb-1">Answer:</strong>
                  {q.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const q = data.questions || {}

  return (
    <div className="grid gap-5">
      {renderLevelGroup('Beginner Questions', q.beginner)}
      {renderLevelGroup('Intermediate Questions', q.intermediate)}
      {renderLevelGroup('Advanced Questions', q.advanced)}
    </div>
  )
}

function PlannerView({ data }) {
  if (!data) return null
  return (
    <div className="grid gap-4">
      {data.dailySchedule?.length > 0 && (
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted mb-3">Daily Study Routine</p>
          <div className="grid gap-3">
            {data.dailySchedule.map((block, i) => (
              <div key={i} className="flex gap-3 border-l-2 border-emerald-brand pl-3 py-1">
                <span className="shrink-0 text-xs font-black text-emerald-dark-brand bg-emerald-pale rounded px-2 py-0.5">{block.block} • {block.duration}</span>
                <p className="text-xs text-ink-soft leading-relaxed">{block.activity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.weeklySchedule?.length > 0 && (
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted mb-3">Weekly Strategy</p>
          <ul className="grid gap-2">
            {data.weeklySchedule.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-soft">
                <span className="shrink-0 font-bold text-emerald-brand">{i + 1}.</span>
                <span className="leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.monthlyPlan?.length > 0 && (
        <div className="rounded-card border border-line bg-white p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted mb-3">Monthly Targets</p>
          <ul className="grid gap-2">
            {data.monthlyPlan.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-soft">
                <span className="shrink-0 text-emerald-brand">•</span>
                <span className="leading-relaxed">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ResourcesView({ data }) {
  if (!data) return null

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null
    return (
      <div className="grid gap-2.5">
        <p className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">{title}</p>
        <div className="grid gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-card border border-line bg-white p-3">
              <span className="text-base shrink-0">🔗</span>
              <div className="min-w-0 flex-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-brand hover:underline"
                >
                  {item.title} <ExternalLink size={10} />
                </a>
                {item.description && <p className="mt-1 text-xs text-ink-soft leading-relaxed">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {renderSection('📖 Official Documentation', data.officialDocs)}
      {renderSection('▶ YouTube Tutorials', data.youtube)}
      {renderSection('💻 GitHub Repositories', data.github)}
      {renderSection('📄 Articles & Blogs', data.articles)}
      {renderSection('🛠 Practice Websites', data.practice)}
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [activeTool, setActiveTool] = useState('chat')
  const [forms, setForms] = useState(initialForms)
  const [result, setResult] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState('')
  const [toast, setToast] = useState({ type: 'success', message: '' })
  const [lastGeneratedAt, setLastGeneratedAt] = useState(0)

  // Drawer UI State
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const historyButtonRef = useRef(null)

  const activeForm = forms[activeTool]

  const loadHistory = useCallback(async (page) => {
    try {
      const res = await aiService.getHistory({ page, limit: 5 })
      setHistory(res.data.history || [])
      if (res.data.pagination) {
        setHistoryPagination(res.data.pagination)
      }
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    loadHistory(historyPage)
  }, [historyPage, loadHistory])

  const updateForm = (field, value) => {
    setForms((current) => ({
      ...current,
      [activeTool]: { ...current[activeTool], [field]: value },
    }))
  }

  const submitTool = async (event) => {
    if (event) event.preventDefault()

    const elapsed = Date.now() - lastGeneratedAt
    if (elapsed < 5000) {
      setToast({ type: 'warning', message: `Please wait ${Math.ceil((5000 - elapsed) / 1000)} seconds before requesting again.` })
      return
    }

    setLastGeneratedAt(Date.now())
    setLoading(activeTool)
    setToast({ type: 'success', message: '' })

    try {
      let response
      if (activeTool === 'chat') {
        const msg = activeForm.message.trim()
        if (!msg) return
        const newMsgList = [...chatMessages, { sender: 'user', text: msg }]
        setChatMessages(newMsgList)
        updateForm('message', '')

        response = await aiService.generateChat({ message: msg, history: chatMessages })
        const replyText = response.data?.data?.reply || response.data?.reply || 'Could not fetch a reply. Please try again.'
        setChatMessages([...newMsgList, { sender: 'ai', text: replyText }])
        setResult({ type: 'chat', data: replyText })
      } else if (activeTool === 'debug') {
        response = await aiService.debugCode(activeForm)
        setResult({ type: 'debug', data: response.data?.data || response.data })
      } else if (activeTool === 'notes') {
        response = await aiService.generateNotes(activeForm)
        setResult({ type: 'notes-generator', data: response.data?.data || response.data })
      } else if (activeTool === 'interview') {
        response = await aiService.generateInterview(activeForm)
        setResult({ type: 'interview', data: response.data?.data || response.data })
      } else if (activeTool === 'planner') {
        response = await aiService.generatePlanner(activeForm)
        setResult({ type: 'planner', data: response.data?.data || response.data })
      } else if (activeTool === 'resources') {
        response = await aiService.generateResources(activeForm)
        setResult({ type: 'resources', data: response.data?.data || response.data })
      }

      setToast({ type: 'success', message: 'AI Generation ready.' })
      await loadHistory(1)
    } catch (err) {
      setToast({ type: 'danger', message: friendlyError(err, 'AI generation failed') })
    } finally {
      setLoading('')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const msg = e.target.elements.chatMessage.value.trim()
    if (!msg) return
    e.target.reset()
    setForms((current) => ({
      ...current,
      chat: { message: msg },
    }))
  }

  useEffect(() => {
    if (activeTool === 'chat' && forms.chat.message) {
      submitTool()
    }
  }, [forms.chat.message])

  // Local deletion helper
  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item._id !== id))
    setToast({ type: 'success', message: 'History entry deleted.' })
  }

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history
    const q = historySearch.toLowerCase()
    return history.filter((item) =>
      String(item.type).toLowerCase().includes(q) ||
      (item.prompt && String(item.prompt).toLowerCase().includes(q))
    )
  }, [history, historySearch])

  const fields = useMemo(() => {
    if (activeTool === 'chat') return [['message', 'Message', 'textarea']]
    if (activeTool === 'debug') return [
      ['code', 'Code Snippet', 'textarea'],
      ['language', 'Programming Language', 'text'],
    ]
    if (activeTool === 'notes') return [
      ['topic', 'Topic or Concept', 'text'],
      ['type', 'Note Format', 'select-notes-type'],
      ['level', 'Target Level', 'select-notes-level'],
    ]
    if (activeTool === 'interview') return [
      ['topic', 'Role or Topic', 'text'],
      ['type', 'Question Category', 'select-interview-type'],
      ['difficulty', 'Difficulty Level', 'select-interview-diff'],
    ]
    if (activeTool === 'planner') return [
      ['skill', 'Skill to Study', 'text'],
      ['dailyStudyHours', 'Daily Study Hours', 'number'],
      ['weeklyGoal', 'Weekly Goal', 'text'],
    ]
    if (activeTool === 'resources') return [['topic', 'Topic or Concept', 'text']]
    return []
  }, [activeTool])

  const renderToolOutput = () => {
    if (!result) {
      return <p className="rounded-card border border-dashed border-line-strong bg-white p-6 text-center text-sm text-ink-soft">Choose a tool and generate your first AI response.</p>
    }
    const type = result.type
    const data = result.data

    if (type === 'chat') return <div className="p-3 bg-white rounded-card border border-line whitespace-pre-wrap text-sm"><SimpleMarkdown text={typeof data === 'string' ? data : data.reply} /></div>
    if (type === 'debug') return <DebugView data={data} />
    if (type === 'notes-generator') return <NotesView data={data} />
    if (type === 'interview') return <InterviewView data={data} />
    if (type === 'planner') return <PlannerView data={data} />
    if (type === 'resources') return <ResourcesView data={data} />
    return renderValue(data)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    // Return focus to the history button
    historyButtonRef.current?.focus()
  }

  return (
    <section className="grid gap-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
      <PageHeader
        eyebrow="AI learning assistant"
        title="Study, debug, and learn faster"
        description="A specialized learning companion tailored to answer questions, debug code, generate study guides, prepare interviews, create weekly planners, and discover useful resources."
        icon={Bot}
      />

      {/* Main Full Width Workspace Container */}
      <div className="grid w-full">
        <section className="grid min-w-0 overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface-raised px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">WORKSPACE</p>
              <h2 className="mt-1 text-xl font-black text-ink">{toolConfig[activeTool].label}</h2>
            </div>
            
            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <button
                ref={historyButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={cn(ui.button.base, ui.button.secondary, 'inline-flex items-center gap-1.5 py-1.5 px-3 border-line bg-white text-xs font-bold text-ink-soft hover:bg-surface')}
                aria-label="Open generation history drawer"
              >
                <History size={14} /> History
              </button>
              <span className="rounded-full bg-emerald-pale px-3 py-1 text-xs font-black text-emerald-dark-brand">
                {loading ? 'Generating' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            {/* Tabs */}
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
                      activeTool === key ? 'border-emerald-brand bg-emerald-pale text-emerald-dark-brand' : ui.button.secondary
                    )}
                    onClick={() => {
                      setActiveTool(key)
                      setResult(null)
                    }}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Description banner */}
            <div className="rounded-card border border-line bg-surface/40 p-3 text-xs text-ink-soft">
              {toolConfig[activeTool].description}
            </div>

            {/* Form rendering */}
            {activeTool === 'chat' ? (
              <ChatView
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                loading={Boolean(loading)}
              />
            ) : (
              <form className="grid gap-4 md:grid-cols-2" onSubmit={submitTool}>
                {fields.map(([field, label, type]) => (
                  <div className={type === 'textarea' ? 'md:col-span-2' : ''} key={field}>
                    <label className={ui.field.label} htmlFor={`ai-${activeTool}-${field}`}>{label}</label>
                    <div className={cn(ui.field.control, type === 'textarea' && 'items-start')}>
                      {type === 'textarea' ? (
                        <textarea
                          className={cn(ui.field.input, 'min-h-32 py-3 leading-6')}
                          id={`ai-${activeTool}-${field}`}
                          value={activeForm[field] || ''}
                          onChange={(event) => updateForm(field, event.target.value)}
                          required
                        />
                      ) : type === 'select-notes-type' ? (
                        <select
                          className={ui.field.input}
                          id={`ai-${activeTool}-${field}`}
                          value={activeForm[field] || 'Detailed Notes'}
                          onChange={(event) => updateForm(field, event.target.value)}
                        >
                          <option>Detailed Notes</option>
                          <option>Revision Notes</option>
                          <option>Concise Summary</option>
                        </select>
                      ) : type === 'select-notes-level' ? (
                        <select
                          className={ui.field.input}
                          id={`ai-${activeTool}-${field}`}
                          value={activeForm[field] || 'Simple Language (ELIF5)'}
                          onChange={(event) => updateForm(field, event.target.value)}
                        >
                          <option>Simple Language (ELIF5)</option>
                          <option>Technical / Academic</option>
                        </select>
                      ) : type === 'select-interview-type' ? (
                        <select
                          className={ui.field.input}
                          id={`ai-${activeTool}-${field}`}
                          value={activeForm[field] || 'Technical'}
                          onChange={(event) => updateForm(field, event.target.value)}
                        >
                          <option>Technical</option>
                          <option>HR</option>
                          <option>Follow-up</option>
                        </select>
                      ) : type === 'select-interview-diff' ? (
                        <select
                          className={ui.field.input}
                          id={`ai-${activeTool}-${field}`}
                          value={activeForm[field] || 'Beginner'}
                          onChange={(event) => updateForm(field, event.target.value)}
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      ) : (
                        <input
                          className={ui.field.input}
                          id={`ai-${activeTool}-${field}`}
                          type={type}
                          min={type === 'number' ? '1' : undefined}
                          max={type === 'number' ? '12' : undefined}
                          value={activeForm[field] || ''}
                          onChange={(event) => updateForm(field, type === 'number' ? Number(event.target.value) : event.target.value)}
                          required
                        />
                      )}
                    </div>
                  </div>
                ))}
                <button type="submit" className={cn(ui.button.base, ui.button.primary, 'w-full md:col-span-2 bg-emerald-brand text-white border-emerald-brand hover:bg-emerald-dark-brand')} disabled={Boolean(loading)}>
                  <Sparkles size={16} className="shrink-0" />
                  <span>{loading ? 'Generating...' : `Generate ${toolConfig[activeTool].label}`}</span>
                </button>
              </form>
            )}

            {/* Response output */}
            {activeTool !== 'chat' && (
              <div className="grid gap-4 rounded-card border border-line bg-surface-raised p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">ASSISTANT OUTPUT</p>
                    <h2 className="mt-1 text-xl font-black text-ink">
                      {result ? toolConfig[result.type === 'notes-generator' ? 'notes' : result.type]?.label : 'Ready'}
                    </h2>
                  </div>
                  <Brain size={20} className="shrink-0 text-emerald-dark-brand" />
                </div>
                {renderToolOutput()}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── RIGHT-SIDE SLIDE HISTORY DRAWER ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            onClick={closeDrawer}
          />

          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-line transform transition duration-300 translate-x-0">
              {/* Drawer Header */}
              <div className="border-b border-line px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-emerald-brand" />
                  <h3 className="text-base font-black text-ink">Generation History</h3>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-full p-1.5 text-ink-muted hover:bg-surface hover:text-ink transition"
                  aria-label="Close history drawer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search filter */}
              <div className="px-5 pt-4 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search history by type..."
                    className={cn(ui.field.input, 'pl-9 text-xs py-2 min-h-8')}
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Scrollable history items list */}
              <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-xs text-ink-soft py-10">No matching generations found.</p>
                ) : (
                  filteredHistory.map((item) => {
                    const matchedType = item.type === 'notes-generator' ? 'notes' : item.type === 'notes-summary' ? 'notes' : item.type
                    return (
                      <div
                        key={item._id}
                        className="group flex items-start justify-between gap-3 rounded-card border border-line bg-white p-3 hover:border-emerald-brand hover:bg-emerald-pale/10 transition text-left"
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            setActiveTool(matchedType)
                            setResult({ type: matchedType, data: item.response })
                            closeDrawer()
                          }}
                        >
                          <strong className="block text-xs font-black capitalize text-ink flex items-center gap-1.5">
                            {item.type}
                          </strong>
                          {item.prompt && (
                            <p className="mt-1 text-[11px] text-ink-soft truncate leading-normal" title={item.prompt}>
                              {item.prompt}
                            </p>
                          )}
                          <span className="mt-1 block text-[10px] text-ink-muted">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item._id)}
                          className="shrink-0 p-1 rounded hover:bg-red-50 text-ink-muted hover:text-red-600 transition md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Pagination Drawer Footer */}
              {history.length > 0 && historyPagination.totalPages > 1 && (
                <div className="border-t border-line px-5 py-4 bg-surface-raised flex items-center justify-between text-xs text-ink-soft">
                  <button
                    type="button"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className={cn(ui.button.base, ui.button.secondary, 'min-h-8 px-2 py-1 bg-white')}
                  >
                    Prev
                  </button>
                  <span>Page {historyPagination.page} of {historyPagination.totalPages}</span>
                  <button
                    type="button"
                    disabled={historyPage >= historyPagination.totalPages}
                    onClick={() => setHistoryPage((p) => Math.min(historyPagination.totalPages, p + 1))}
                    className={cn(ui.button.base, ui.button.secondary, 'min-h-8 px-2 py-1 bg-white')}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
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
  if (err.response?.status === 429) return 'AI request limit hit. Please wait a moment and try again.'
  if (err.response?.data?.errors?.length) return err.response.data.errors.map((item) => item.message || item.msg).join(', ')
  return err.response?.data?.message || `${fallback}. Please try again.`
}
