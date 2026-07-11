import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, CheckCircle2, ChevronDown, Clock3, RotateCcw, Search, SkipForward, StickyNote, X } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as revisionService from '../services/revisionService'
import * as skillService from '../services/skillService'
import { cn, statusTone, ui } from '../utils/tw'

const statusOptions = ['', 'Due Today', 'Upcoming', 'Missed', 'Snoozed', 'Completed']
const defaultFilters = { search: '', skillId: '', topicId: '', status: '', startDate: '', endDate: '', page: 1, limit: 12 }

const dateInputValue = (date = new Date()) => {
  const value = new Date(date)
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset())
  return value.toISOString().slice(0, 16)
}
const formatDate = (date) => date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'

function SelectControl({ value, onChange, disabled, children }) {
  return (
    <div className={ui.field.control}>
      <select className={ui.field.input} value={value} onChange={onChange} disabled={disabled}>{children}</select>
      <ChevronDown className="shrink-0 text-ink-muted" size={16} />
    </div>
  )
}

function RevisionCard({ revision, onComplete, onSnooze, onSkip, onNotes }) {
  const skillTitle = revision.skillId?.title || 'Deleted Skill'
  const topicTitle = revision.topicId?.title || 'Deleted Topic'
  return (
    <article className={cn(ui.card, 'grid gap-4 p-4')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cn(ui.badge.base, statusTone(revision.status))}>{revision.status}</span>
        <time className="text-xs font-bold text-ink-soft" dateTime={revision.revisionDate}>{formatDate(revision.revisionDate)}</time>
      </div>
      <div>
        <h3 className="text-lg font-black text-ink">{topicTitle}</h3>
        <p className="mt-1 text-sm text-ink-soft">{skillTitle}</p>
      </div>
      {revision.notes && <div className="rounded-card border border-line bg-surface-raised p-3 text-sm leading-6 text-ink-soft">{revision.notes}</div>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={cn(ui.button.base, ui.button.primary, 'min-h-9 px-3')} onClick={() => onComplete(revision)} disabled={revision.status === 'Completed'}><CheckCircle2 size={16} /> Complete</button>
        <button type="button" className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')} onClick={() => onSnooze(revision)} disabled={revision.status === 'Completed'}><Clock3 size={16} /> Snooze</button>
        <button type="button" className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')} onClick={() => onNotes(revision)}><StickyNote size={16} /> Notes</button>
        <button type="button" className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')} onClick={() => onSkip(revision)} disabled={revision.status === 'Completed'}><SkipForward size={16} /> Skip</button>
      </div>
    </article>
  )
}

export default function Revisions() {
  const [skills, setSkills] = useState([])
  const [revisions, setRevisions] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 })
  const [selectedDate, setSelectedDate] = useState('')
  const [activeRevision, setActiveRevision] = useState(null)
  const [modalMode, setModalMode] = useState('')
  const [notes, setNotes] = useState('')
  const [snoozeUntil, setSnoozeUntil] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadRevisions = useCallback(async () => {
    const [skillsRes, statsRes, revisionsRes] = await Promise.all([
      skillService.getAllSkills(),
      revisionService.getRevisionStats(),
      revisionService.getRevisions(filters),
    ])
    setSkills(skillsRes.data.skills || [])
    setStats(statsRes.data)
    setRevisions(revisionsRes.data.revisions || [])
    setPagination(revisionsRes.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 })
  }, [filters])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        await loadRevisions()
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load revisions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loadRevisions])

  const topicOptions = useMemo(() => skills.find((item) => item._id === filters.skillId)?.topics || [], [skills, filters.skillId])
  const grouped = useMemo(() => ({
    today: revisions.filter((revision) => revision.status === 'Due Today'),
    upcoming: revisions.filter((revision) => ['Upcoming', 'Snoozed'].includes(revision.status)),
    missed: revisions.filter((revision) => revision.status === 'Missed'),
    history: revisions.filter((revision) => revision.status === 'Completed'),
  }), [revisions])
  const selectedCalendarEntry = useMemo(() => (stats?.calendar || []).find((day) => day.date === selectedDate), [stats, selectedDate])

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, ...(name === 'skillId' ? { topicId: '' } : {}), page: 1 }))
  }

  const runAction = async (action, message) => {
    setSaving(true)
    setError('')
    try {
      await action()
      setSuccess(message)
      setActiveRevision(null)
      setModalMode('')
      await loadRevisions()
    } catch (err) {
      setError(err.response?.data?.message || 'Revision update failed')
    } finally {
      setSaving(false)
    }
  }

  const openNotes = (revision) => {
    setActiveRevision(revision)
    setNotes(revision.notes || '')
    setModalMode('notes')
  }

  const openSnooze = (revision) => {
    setActiveRevision(revision)
    setNotes('')
    setSnoozeUntil(dateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
    setModalMode('snooze')
  }

  const closeModal = () => {
    if (saving) return
    setActiveRevision(null)
    setModalMode('')
  }

  const renderRevisionList = (title, items) => (
    <section className={cn(ui.panel, 'grid gap-4')}>
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">{items.length} item{items.length === 1 ? '' : 's'}</p><h2 className="mt-1 text-xl font-black text-ink">{title}</h2></div><RotateCcw size={20} className="text-emerald-dark-brand" /></div>
      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong bg-surface-raised p-5 text-center text-sm text-ink-soft">No revisions in this section.</p>
      ) : (
        <div className="grid gap-3">{items.map((revision) => (
          <RevisionCard key={revision._id} revision={revision} onComplete={(item) => runAction(() => revisionService.completeRevision(item._id), 'Revision marked complete.')} onSnooze={openSnooze} onSkip={(item) => runAction(() => revisionService.skipRevision(item._id), 'Revision skipped.')} onNotes={openNotes} />
        ))}</div>
      )}
    </section>
  )

  if (loading) {
    return (
      <div className="grid gap-5" role="status" aria-label="Loading revisions">
        <div className="skeleton-shimmer h-24 rounded-panel" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div className="skeleton-shimmer h-36 rounded-panel" key={index} />)}</div>
        <div className="skeleton-shimmer h-80 rounded-panel" />
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <Toast message={success} onClose={() => setSuccess('')} />
      <PageHeader eyebrow="Spaced repetition" title="Smart revisions" description="Review due topics on the schedule that your learning history creates automatically." icon={RotateCcw} />
      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Revision metrics">
        <MetricCard label="Due today" value={stats?.widgets?.dueToday || 0} detail="Ready to review" icon={Bell} tone="coral" progress={Math.min(100, (stats?.widgets?.dueToday || 0) * 10)} />
        <MetricCard label="Upcoming" value={stats?.widgets?.upcoming || 0} detail="Scheduled ahead" icon={CalendarDays} tone="blue" progress={Math.min(100, (stats?.widgets?.upcoming || 0) * 5)} />
        <MetricCard label="Missed" value={stats?.widgets?.missed || 0} detail="Needs attention" icon={Clock3} tone="sun" progress={Math.min(100, (stats?.widgets?.missed || 0) * 10)} />
        <MetricCard label="Completed" value={stats?.widgets?.completed || 0} detail={`${stats?.analytics?.completedThisWeek || 0} this week`} icon={CheckCircle2} tone="emerald" progress={stats?.widgets?.completionRate || 0} />
        <MetricCard label="Completion rate" value={`${stats?.widgets?.completionRate || 0}%`} detail={`${stats?.analytics?.averageDelayDays || 0}d average delay`} icon={RotateCcw} tone="blue" progress={stats?.widgets?.completionRate || 0} />
      </section>

      <section className={cn(ui.panel, 'grid gap-3 sm:grid-cols-2 xl:grid-cols-6')}>
        <div className={ui.field.control}><Search size={16} className="text-ink-muted" /><input className={ui.field.input} value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search skill or topic" /></div>
        <SelectControl value={filters.skillId} onChange={(event) => updateFilter('skillId', event.target.value)}><option value="">All skills</option>{skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}</SelectControl>
        <SelectControl value={filters.topicId} onChange={(event) => updateFilter('topicId', event.target.value)} disabled={!filters.skillId}><option value="">All topics</option>{topicOptions.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</SelectControl>
        <SelectControl value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{statusOptions.map((status) => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}</SelectControl>
        <div className={ui.field.control}><input className={ui.field.input} type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} /></div>
        <div className={ui.field.control}><input className={ui.field.input} type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} /></div>
      </section>

      <section className={cn(ui.panel, 'grid gap-4')}>
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Calendar</p><h2 className="mt-1 text-xl font-black text-ink">Revision schedule</h2></div><CalendarDays size={20} className="text-emerald-dark-brand" /></div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16px,1fr))] gap-1" aria-label="Revision calendar">
          {(stats?.calendar || []).map((day) => {
            const tone = day.completed ? 'bg-emerald-brand' : day.missed ? 'bg-coral' : day.dueToday ? 'bg-sun' : day.snoozed ? 'bg-blue-brand' : 'bg-line'
            return (
              <button type="button" key={day.date} className={cn('h-4 rounded-sm border border-white/60 transition hover:scale-110', tone, selectedDate === day.date && 'ring-2 ring-emerald-dark-brand')} onClick={() => setSelectedDate(day.date)} title={`${day.date}: ${day.revisions.length} revisions`} aria-label={`${day.date}, ${day.revisions.length} revisions`} />
            )
          })}
        </div>
        {selectedDate && (
          <div className="grid gap-3 rounded-card border border-line bg-surface-raised p-4">
            <h3 className="font-black text-ink">{selectedDate}</h3>
            {(selectedCalendarEntry?.revisions || []).length === 0 ? <p className="text-sm text-ink-soft">No revisions on this date.</p> : selectedCalendarEntry.revisions.map((revision) => (
              <div className="rounded-card border border-line bg-white p-3 text-sm" key={revision._id}><strong className="block text-ink">{revision.topicId?.title || 'Deleted Topic'}</strong><span className="text-ink-soft">{revision.status} | {revision.skillId?.title || 'Deleted Skill'}</span></div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {renderRevisionList("Today's revisions", grouped.today)}
        {renderRevisionList('Upcoming revisions', grouped.upcoming)}
        {renderRevisionList('Missed revisions', grouped.missed)}
        {renderRevisionList('Revision history', grouped.history)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-4 text-sm text-ink-soft shadow-card">
        <button type="button" className={cn(ui.button.base, ui.button.secondary)} disabled={!pagination.hasPrevPage} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button type="button" className={cn(ui.button.base, ui.button.secondary)} disabled={!pagination.hasNextPage} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
      </div>

      <Modal open={modalMode === 'snooze'} onClose={closeModal} title="Snooze revision">
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); runAction(() => revisionService.snoozeRevision(activeRevision._id, { snoozeUntil, notes }), 'Revision snoozed.') }}>
          <div><label className={ui.field.label} htmlFor="snoozeUntil">Snooze until</label><div className={ui.field.control}><input className={ui.field.input} id="snoozeUntil" type="datetime-local" value={snoozeUntil} onChange={(event) => setSnoozeUntil(event.target.value)} required /></div></div>
          <div><label className={ui.field.label} htmlFor="snoozeNotes">Notes</label><div className={cn(ui.field.control, 'items-start')}><textarea className={cn(ui.field.input, 'min-h-28 py-3')} id="snoozeNotes" value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div>
          <div className="flex flex-wrap gap-2"><button type="submit" className={cn(ui.button.base, ui.button.primary)} disabled={saving}><Clock3 size={16} /> {saving ? 'Saving...' : 'Snooze'}</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={closeModal}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>

      <Modal open={modalMode === 'notes'} onClose={closeModal} title="Revision notes">
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); runAction(() => revisionService.updateRevisionNotes(activeRevision._id, { notes }), 'Revision notes saved.') }}>
          <div><label className={ui.field.label} htmlFor="revisionNotes">Notes</label><div className={cn(ui.field.control, 'items-start')}><textarea className={cn(ui.field.input, 'min-h-40 py-3')} id="revisionNotes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} /></div></div>
          <div className="flex flex-wrap gap-2"><button type="submit" className={cn(ui.button.base, ui.button.primary)} disabled={saving}><StickyNote size={16} /> {saving ? 'Saving...' : 'Save notes'}</button><button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={closeModal}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}
