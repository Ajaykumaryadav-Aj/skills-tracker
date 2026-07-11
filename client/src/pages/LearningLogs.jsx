import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Clock3, Download, Filter, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as logService from '../services/learningLogService'
import * as skillService from '../services/skillService'
import { cn, statusTone, ui } from '../utils/tw'

const sessionTypes = ['Study', 'Practice', 'Revision', 'Project']
const formatMinutes = (minutes) => {
  const total = Number(minutes) || 0
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (!hours) return `${mins} min`
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')
const toTimeInput = (value) => (value ? new Date(value).toTimeString().slice(0, 5) : '')
const combineDateTime = (date, time) => (date && time ? new Date(`${date}T${time}`).toISOString() : '')

function Field({ id, label, icon: Icon, children }) {
  return (
    <div>
      <label className={ui.field.label} htmlFor={id}>{label}</label>
      <div className={ui.field.control}>
        {Icon ? <Icon size={17} className="shrink-0 text-ink-muted" /> : null}
        {children}
      </div>
    </div>
  )
}

function SelectField({ id, label, value, onChange, disabled, children }) {
  return (
    <Field id={id} label={label}>
      <select className={ui.field.input} id={id} value={value} onChange={onChange} disabled={disabled}>{children}</select>
      <ChevronDown className="shrink-0 text-ink-muted" size={16} />
    </Field>
  )
}

export default function LearningLogs() {
  const [skills, setSkills] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({ skillId: '', topicId: '', sessionType: '', startDate: '', endDate: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [form, setForm] = useState({ skillId: '', topicId: '', date: '', startTime: '', endTime: '', sessionType: 'Study', notes: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const cleanFilters = useCallback((params = {}) =>
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)), [])

  const loadLogs = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await logService.getLearningLogs(cleanFilters(params))
      setLogs(res.data.logs || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load logs')
    } finally {
      setLoading(false)
    }
  }, [cleanFilters])

  useEffect(() => {
    let ignore = false
    const loadInitialData = async () => {
      try {
        const [skillsResponse, logsResponse] = await Promise.all([skillService.getAllSkills(), logService.getLearningLogs({})])
        if (!ignore) {
          setSkills(skillsResponse.data.skills || [])
          setLogs(logsResponse.data.logs || [])
          setError(null)
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load learning data')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadInitialData()
    return () => { ignore = true }
  }, [])

  const formTopicOptions = useMemo(() => skills.find((item) => item._id === form.skillId)?.topics || [], [skills, form.skillId])
  const filterTopicOptions = useMemo(() => skills.find((item) => item._id === filter.skillId)?.topics || [], [skills, filter.skillId])
  const totalMinutes = useMemo(() => logs.reduce((sum, log) => sum + (Number(log.duration) || 0), 0), [logs])
  const calculatedDuration = useMemo(() => {
    const start = form.date && form.startTime ? new Date(`${form.date}T${form.startTime}`) : null
    const end = form.date && form.endTime ? new Date(`${form.date}T${form.endTime}`) : null
    if (!start || !end || end <= start) return 0
    return Math.round((end.getTime() - start.getTime()) / 60000)
  }, [form.date, form.startTime, form.endTime])

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'skillId' ? { topicId: '' } : {}) }))
  }

  const openCreateModal = () => {
    setEditingLog(null)
    setForm({ skillId: '', topicId: '', date: toDateInput(new Date()), startTime: '', endTime: '', sessionType: 'Study', notes: '' })
    setModalOpen(true)
  }

  const openEditModal = (log) => {
    setEditingLog(log)
    setForm({
      skillId: log.skill?._id || '',
      topicId: log.topic?._id || '',
      date: toDateInput(log.date),
      startTime: toTimeInput(log.startTime),
      endTime: toTimeInput(log.endTime),
      sessionType: log.sessionType || 'Study',
      notes: log.notes || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError(null)
    setSuccess('')
    if (!calculatedDuration) {
      setError('End time must be after start time')
      return
    }
    setSaving(true)
    try {
      const payload = {
        skillId: form.skillId,
        topicId: form.topicId,
        date: form.date,
        startTime: combineDateTime(form.date, form.startTime),
        endTime: combineDateTime(form.date, form.endTime),
        sessionType: form.sessionType,
        notes: form.notes.trim(),
      }
      if (editingLog) await logService.updateLearningLog(editingLog._id, payload)
      else await logService.createLearningLog(payload)
      setModalOpen(false)
      await loadLogs(filter)
      setSuccess(editingLog ? 'Session updated successfully.' : 'Session added successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save log')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete learning session?')) return
    try {
      await logService.deleteLearningLog(logId)
      await loadLogs(filter)
      setSuccess('Session deleted successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete log')
    }
  }

  const handleExport = async () => {
    try {
      const res = await logService.exportLearningLogs()
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'learning-history.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export learning history')
    }
  }

  const updateFilter = (key, value) => setFilter((current) => ({ ...current, [key]: value, ...(key === 'skillId' ? { topicId: '' } : {}) }))
  const resetFilters = () => { const next = { skillId: '', topicId: '', sessionType: '', startDate: '', endDate: '' }; setFilter(next); loadLogs(next) }
  const filteredLogs = logs.slice().sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="grid gap-5">
      <Toast message={success} onClose={() => setSuccess('')} />
      <PageHeader
        eyebrow="Learning history"
        title="Daily learning logs"
        description={`${logs.length} sessions and ${formatMinutes(totalMinutes)} recorded.`}
        icon={Clock3}
        actions={(
          <>
            <button type="button" onClick={handleExport} className={cn(ui.button.base, ui.button.secondary)}><Download size={17} /> Export CSV</button>
            <button type="button" onClick={openCreateModal} className={cn(ui.button.base, ui.button.primary)}><Plus size={17} /> Add session</button>
          </>
        )}
      />

      <section className={cn(ui.panel, 'reveal-item grid gap-4')} aria-labelledby="log-filter-title">
        <div className="flex items-start gap-3"><Filter size={18} className="mt-1 text-emerald-dark-brand" /><div><h2 id="log-filter-title" className="text-lg font-black text-ink">Filter sessions</h2><p className="mt-1 text-sm text-ink-soft">Narrow the history by date, skill, topic, or type.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField id="log-skill" label="Skill" value={filter.skillId} onChange={(event) => updateFilter('skillId', event.target.value)}><option value="">All skills</option>{skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}</SelectField>
          <SelectField id="log-topic" label="Topic" value={filter.topicId} onChange={(event) => updateFilter('topicId', event.target.value)} disabled={!filter.skillId}><option value="">All topics</option>{filterTopicOptions.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</SelectField>
          <SelectField id="log-type" label="Type" value={filter.sessionType} onChange={(event) => updateFilter('sessionType', event.target.value)}><option value="">All types</option>{sessionTypes.map((type) => <option key={type}>{type}</option>)}</SelectField>
          <Field id="log-start" label="Start date" icon={CalendarDays}><input className={ui.field.input} id="log-start" type="date" value={filter.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} /></Field>
          <Field id="log-end" label="End date" icon={CalendarDays}><input className={ui.field.input} id="log-end" type="date" value={filter.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} /></Field>
          <div className="flex flex-wrap items-end gap-2"><button type="button" onClick={() => loadLogs(filter)} className={cn(ui.button.base, ui.button.primary)}><Filter size={16} /> Apply</button><button type="button" onClick={resetFilters} className={cn(ui.button.base, ui.button.secondary)}><RotateCcw size={16} /> Reset</button></div>
        </div>
      </section>

      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}
      {loading ? (
        <div className={cn(ui.panel, 'grid gap-3')} role="status" aria-label="Loading learning logs">{Array.from({ length: 5 }).map((_, index) => <i className="skeleton-shimmer h-10 rounded-card" key={index} />)}</div>
      ) : filteredLogs.length === 0 ? (
        <div className={ui.empty}><Clock3 size={25} /><p>No learning sessions found.</p></div>
      ) : (
        <section className={cn(ui.panel, 'reveal-item')} aria-label="Learning sessions">
          <div className={ui.table.wrap}>
            <table className={ui.table.table}>
              <thead><tr>{['Date', 'Time', 'Type', 'Skill', 'Topic', 'Duration', 'Notes', 'Actions'].map((heading) => <th key={heading} className={ui.table.th}>{heading}</th>)}</tr></thead>
              <tbody>{filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td className={ui.table.td}>{new Date(log.date).toLocaleDateString()}</td>
                  <td className={ui.table.td}>{log.startTime && log.endTime ? `${toTimeInput(log.startTime)}-${toTimeInput(log.endTime)}` : '-'}</td>
                  <td className={ui.table.td}><span className={cn(ui.badge.base, statusTone(log.sessionType || 'Study'))}>{log.sessionType || 'Study'}</span></td>
                  <td className={ui.table.td}><strong>{log.skill?.title || 'Unknown skill'}</strong></td>
                  <td className={ui.table.td}>{log.topic?.title || 'Deleted Topic'}</td>
                  <td className={ui.table.td}><span className={cn(ui.badge.base, ui.badge.idle)}><Clock3 size={13} />{formatMinutes(log.duration)}</span></td>
                  <td className={cn(ui.table.td, 'max-w-64 truncate text-ink-soft')}>{log.notes || '-'}</td>
                  <td className={ui.table.td}><div className="flex gap-2"><button type="button" onClick={() => openEditModal(log)} className={ui.button.icon} aria-label="Edit session" title="Edit session"><Pencil size={16} /></button><button type="button" onClick={() => handleDelete(log._id)} className={cn(ui.button.icon, 'border-red-200 text-red-700 hover:bg-red-50')} aria-label="Delete session" title="Delete session"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingLog ? 'Edit learning session' : 'Add learning session'}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField id="session-skill" label="Skill" value={form.skillId} onChange={(event) => handleFormChange({ target: { name: 'skillId', value: event.target.value } })}><option value="">Choose a skill</option>{skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}</SelectField>
            <SelectField id="session-topic" label="Topic" value={form.topicId} onChange={(event) => handleFormChange({ target: { name: 'topicId', value: event.target.value } })}><option value="">Choose a topic</option>{formTopicOptions.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</SelectField>
            <Field id="session-date" label="Date" icon={CalendarDays}><input className={ui.field.input} id="session-date" type="date" name="date" value={form.date} onChange={handleFormChange} required /></Field>
            <SelectField id="session-type" label="Type" value={form.sessionType} onChange={(event) => handleFormChange({ target: { name: 'sessionType', value: event.target.value } })}>{sessionTypes.map((type) => <option key={type}>{type}</option>)}</SelectField>
            <Field id="session-start" label="Start time"><input className={ui.field.input} id="session-start" type="time" name="startTime" value={form.startTime} onChange={handleFormChange} required /></Field>
            <Field id="session-end" label="End time"><input className={ui.field.input} id="session-end" type="time" name="endTime" value={form.endTime} onChange={handleFormChange} required /></Field>
            <Field id="session-duration" label="Duration"><input className={ui.field.input} id="session-duration" value={calculatedDuration ? formatMinutes(calculatedDuration) : 'Set start/end time'} readOnly /></Field>
            <div className="md:col-span-2"><label className={ui.field.label} htmlFor="session-notes">Notes</label><div className={cn(ui.field.control, 'items-start')}><textarea className={cn(ui.field.input, 'min-h-28 py-3')} id="session-notes" name="notes" value={form.notes} onChange={handleFormChange} rows="4" maxLength="1000" /></div></div>
          </div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving || !calculatedDuration} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {saving ? 'Saving...' : editingLog ? 'Save changes' : 'Add session'}</button><button type="button" onClick={() => setModalOpen(false)} className={cn(ui.button.base, ui.button.secondary)}><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}
