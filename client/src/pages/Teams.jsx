import { useEffect, useState } from 'react'
import { Copy, LogOut, Plus, Send, Trash2, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as collaborationService from '../services/collaborationService'
import { cn, ui } from '../utils/tw'

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({ name: '', description: '', inviteCode: '', email: '' })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState({ type: 'success', message: '' })

  const loadTeams = async () => {
    const response = await collaborationService.getTeams()
    setTeams(response.data.data.teams || [])
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const response = await collaborationService.getTeams()
        if (!ignore) setTeams(response.data.data.teams || [])
      } catch {
        if (!ignore) setToast({ type: 'danger', message: 'Unable to load teams' })
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const createTeam = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await collaborationService.createTeam({ name: form.name, description: form.description })
      setForm((current) => ({ ...current, name: '', description: '' }))
      await loadTeams()
      setToast({ type: 'success', message: 'Team created.' })
    } catch (err) {
      setToast({ type: 'danger', message: err.response?.data?.message || 'Unable to create team' })
    } finally {
      setBusy(false)
    }
  }

  const joinTeam = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await collaborationService.joinTeam(form.inviteCode)
      setForm((current) => ({ ...current, inviteCode: '' }))
      await loadTeams()
      setToast({ type: 'success', message: 'Joined team.' })
    } catch (err) {
      setToast({ type: 'danger', message: err.response?.data?.message || 'Unable to join team' })
    } finally {
      setBusy(false)
    }
  }

  const invite = async (teamId) => {
    if (!form.email.trim()) return
    try {
      await collaborationService.inviteMember(teamId, { email: form.email, role: 'member' })
      setForm((current) => ({ ...current, email: '' }))
      await loadTeams()
      setToast({ type: 'success', message: 'Invite sent.' })
    } catch (err) {
      setToast({ type: 'danger', message: err.response?.data?.message || 'Unable to invite member' })
    }
  }

  const removeMember = async (teamId, memberId) => {
    await collaborationService.removeMember(teamId, memberId)
    await loadTeams()
  }

  const leaveTeam = async (teamId) => {
    await collaborationService.leaveTeam(teamId)
    await loadTeams()
  }

  return (
    <div className="grid gap-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
      <PageHeader eyebrow="Collaboration" title="Teams" description="Create teams, invite learners, and collaborate around shared learning goals." icon={Users} />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className={cn(ui.panel, 'grid gap-4')}>
          <form className="grid gap-3" onSubmit={createTeam}>
            <h2 className="text-xl font-black text-ink">Create team</h2>
            <div><label className={ui.field.label}>Team name</label><div className={ui.field.control}><input className={ui.field.input} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div></div>
            <div><label className={ui.field.label}>Description</label><div className={`${ui.field.control} items-start py-3`}><textarea className={`${ui.field.input} min-h-24`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div></div>
            <button className={cn(ui.button.base, ui.button.primary)} disabled={busy}><Plus size={16} /> Create Team</button>
          </form>
          <form className="grid gap-3 border-t border-line pt-4" onSubmit={joinTeam}>
            <h2 className="text-xl font-black text-ink">Join team</h2>
            <div><label className={ui.field.label}>Invite code</label><div className={ui.field.control}><input className={ui.field.input} value={form.inviteCode} onChange={(event) => setForm({ ...form, inviteCode: event.target.value })} required /></div></div>
            <button className={cn(ui.button.base, ui.button.secondary)} disabled={busy}><Users size={16} /> Join Team</button>
          </form>
        </section>
        <section className="grid gap-4">
          {teams.length === 0 ? <div className={ui.empty}><Users size={24} /><p>No teams yet.</p></div> : teams.map((team) => (
            <article className={cn(ui.card, 'grid gap-4 p-5')} key={team._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-xl font-black text-ink">{team.name}</h2><p className="mt-1 text-sm text-ink-soft">{team.description || 'No description'}</p></div>
                <button type="button" className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')} onClick={() => navigator.clipboard?.writeText(team.inviteCode)}><Copy size={15} /> {team.inviteCode}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input className="min-h-10 flex-1 rounded-card border border-line px-3 text-sm outline-none focus:border-emerald-brand focus:ring-4 focus:ring-emerald-brand/10" placeholder="Invite by email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                <button type="button" className={cn(ui.button.base, ui.button.primary)} onClick={() => invite(team._id)}><Send size={15} /> Invite</button>
                <button type="button" className={cn(ui.button.base, ui.button.secondary)} onClick={() => leaveTeam(team._id)}><LogOut size={15} /> Leave</button>
              </div>
              <div className="grid gap-2">
                {(team.members || []).map((member) => (
                  <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface-raised px-3 py-2" key={member._id}>
                    <span className="min-w-0 truncate text-sm font-bold text-ink">{member.userId?.name || member.email || 'Invited member'} <small className="text-ink-muted">({member.role}, {member.status})</small></span>
                    {member.role !== 'owner' && <button type="button" className={ui.button.icon} onClick={() => removeMember(team._id, member._id)}><Trash2 size={15} /></button>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
