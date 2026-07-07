import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Clock3, Filter, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as logService from '../services/learningLogService'
import * as skillService from '../services/skillService'

const formatMinutes = (minutes) => `${minutes} min`

export default function LearningLogs() {
  const [skills, setSkills] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({ skillId: '', startDate: '', endDate: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [form, setForm] = useState({ skillId: '', topicId: '', date: '', duration: '', notes: '' })
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

  const topicOptions = useMemo(() => skills.find((item) => item._id === form.skillId)?.topics || [], [skills, form.skillId])
  const totalMinutes = useMemo(() => logs.reduce((sum, log) => sum + (Number(log.duration) || 0), 0), [logs])
  const handleFormChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const openCreateModal = () => { setEditingLog(null); setForm({ skillId: '', topicId: '', date: '', duration: '', notes: '' }); setModalOpen(true) }
  const openEditModal = (log) => {
    setEditingLog(log)
    setForm({ skillId: log.skill._id, topicId: log.topic._id, date: new Date(log.date).toISOString().slice(0, 10), duration: String(log.duration), notes: log.notes || '' })
    setModalOpen(true)
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError(null)
    setSuccess('')
    setSaving(true)
    try {
      const payload = { skillId: form.skillId, topicId: form.topicId, date: form.date, duration: Number(form.duration), notes: form.notes.trim() }
      const message = editingLog ? 'Session updated successfully.' : 'Session added successfully.'
      if (editingLog) await logService.updateLearningLog(editingLog._id, payload)
      else await logService.createLearningLog(payload)
      setModalOpen(false)
      await loadLogs(filter)
      setSuccess(message)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save log')
    } finally {
      setSaving(false)
    }
  }
  const handleDelete = async (logId) => {
    if (!window.confirm('Delete learning session?')) return
    try { await logService.deleteLearningLog(logId); await loadLogs(filter) }
    catch (err) { setError(err.response?.data?.message || 'Unable to delete log') }
  }
  const resetFilters = () => { setFilter({ skillId: '', startDate: '', endDate: '' }); loadLogs({}) }
  const filteredLogs = logs.slice().sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="logs-page">
      <Toast message={success} onClose={() => setSuccess('')} />
      <PageHeader eyebrow="Learning history" title="Daily learning logs" description={`${logs.length} sessions and ${formatMinutes(totalMinutes)} recorded.`} icon={Clock3} actions={<button type="button" onClick={openCreateModal} className="button button--primary"><Plus size={17} /> Add session</button>} />

      <section className="filter-panel log-filter-panel reveal-item" aria-labelledby="log-filter-title">
        <div className="filter-panel__heading"><Filter size={18} /><div><h2 id="log-filter-title">Filter sessions</h2><p>Narrow the history by skill or date.</p></div></div>
        <div className="log-filter-grid">
          <div><label className="field-label" htmlFor="log-skill">Skill</label><div className="field-control"><select id="log-skill" value={filter.skillId} onChange={(event) => setFilter((current) => ({ ...current, skillId: event.target.value }))}><option value="">All skills</option>{skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
          <div><label className="field-label" htmlFor="log-start">Start date</label><div className="field-control field-control--icon"><CalendarDays size={17} /><input id="log-start" type="date" value={filter.startDate} onChange={(event) => setFilter((current) => ({ ...current, startDate: event.target.value }))} /></div></div>
          <div><label className="field-label" htmlFor="log-end">End date</label><div className="field-control field-control--icon"><CalendarDays size={17} /><input id="log-end" type="date" value={filter.endDate} onChange={(event) => setFilter((current) => ({ ...current, endDate: event.target.value }))} /></div></div>
          <div className="filter-actions"><button type="button" onClick={() => loadLogs(filter)} className="button button--primary"><Filter size={16} /> Apply</button><button type="button" onClick={resetFilters} className="button button--secondary"><RotateCcw size={16} /> Reset</button></div>
        </div>
      </section>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {loading ? (
        <div className="data-panel table-skeleton" role="status" aria-label="Loading learning logs">{Array.from({ length: 5 }).map((_, index) => <i key={index} />)}</div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-state"><Clock3 size={25} /><p>No learning sessions found.</p></div>
      ) : (
        <section className="data-panel log-table-panel reveal-item" aria-label="Learning sessions">
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Skill</th><th>Topic</th><th>Duration</th><th>Notes</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td className="table-date">{new Date(log.date).toLocaleDateString()}</td>
                  <td><strong>{log.skill?.title || 'Unknown skill'}</strong></td>
                  <td>{log.topic?.title || 'Unknown topic'}</td>
                  <td><span className="duration-badge"><Clock3 size={13} />{formatMinutes(log.duration)}</span></td>
                  <td className="log-note">{log.notes || '-'}</td>
                  <td><div className="table-actions"><button type="button" onClick={() => openEditModal(log)} className="icon-button" aria-label="Edit session" title="Edit session"><Pencil size={16} /></button><button type="button" onClick={() => handleDelete(log._id)} className="icon-button icon-button--danger" aria-label="Delete session" title="Delete session"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingLog ? 'Edit learning session' : 'Add learning session'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div><label className="field-label" htmlFor="session-skill">Skill</label><div className="field-control"><select id="session-skill" name="skillId" value={form.skillId} onChange={handleFormChange} required><option value="">Choose a skill</option>{skills.map((skill) => <option key={skill._id} value={skill._id}>{skill.title}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
            <div><label className="field-label" htmlFor="session-topic">Topic</label><div className="field-control"><select id="session-topic" name="topicId" value={form.topicId} onChange={handleFormChange} required><option value="">Choose a topic</option>{topicOptions.map((topic) => <option key={topic._id} value={topic._id}>{topic.title}</option>)}</select><ChevronDown className="select-chevron" size={16} /></div></div>
            <div><label className="field-label" htmlFor="session-date">Date</label><div className="field-control field-control--icon"><CalendarDays size={17} /><input id="session-date" type="date" name="date" value={form.date} onChange={handleFormChange} required /></div></div>
            <div><label className="field-label" htmlFor="session-duration">Duration (minutes)</label><div className="field-control"><input id="session-duration" type="number" name="duration" value={form.duration} onChange={handleFormChange} min="1" max="1440" required /></div></div>
            <div className="form-grid__wide"><label className="field-label" htmlFor="session-notes">Notes</label><div className="field-control"><textarea id="session-notes" name="notes" value={form.notes} onChange={handleFormChange} rows="4" maxLength="1000" /></div></div>
          </div>
          <div className="form-actions"><button type="submit" disabled={saving} className="button button--primary"><Save size={16} /> {saving ? 'Saving...' : editingLog ? 'Save changes' : 'Add session'}</button><button type="button" onClick={() => setModalOpen(false)} className="button button--secondary"><X size={16} /> Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}
