import { useEffect, useState } from 'react'
import { Bell, CalendarClock, CheckCheck, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as collaborationService from '../services/collaborationService'
import { cn, ui } from '../utils/tw'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [reminders, setReminders] = useState([])
  const [form, setForm] = useState({ title: '', date: '', time: '09:00', repeat: 'none' })
  const [toast, setToast] = useState({ type: 'success', message: '' })

  const load = async () => {
    const [notificationRes, reminderRes] = await Promise.all([
      collaborationService.getNotifications({ limit: 30 }),
      collaborationService.getReminders(),
    ])
    setNotifications(notificationRes.data.data.notifications || [])
    setReminders(reminderRes.data.data.reminders || [])
  }

  useEffect(() => {
    let ignore = false
    const loadInitial = async () => {
      try {
        const [notificationRes, reminderRes] = await Promise.all([
          collaborationService.getNotifications({ limit: 30 }),
          collaborationService.getReminders(),
        ])
        if (!ignore) {
          setNotifications(notificationRes.data.data.notifications || [])
          setReminders(reminderRes.data.data.reminders || [])
        }
      } catch {
        if (!ignore) setToast({ type: 'danger', message: 'Unable to load notifications' })
      }
    }
    loadInitial()
    return () => { ignore = true }
  }, [])

  const createReminder = async (event) => {
    event.preventDefault()
    try {
      await collaborationService.createReminder(form)
      setForm({ title: '', date: '', time: '09:00', repeat: 'none' })
      await load()
      setToast({ type: 'success', message: 'Reminder created.' })
    } catch (err) {
      setToast({ type: 'danger', message: err.response?.data?.message || 'Unable to create reminder' })
    }
  }

  const markAll = async () => {
    await collaborationService.markAllNotificationsRead()
    await load()
  }

  return (
    <div className="grid gap-5">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast((current) => ({ ...current, message: '' }))} />
      <PageHeader eyebrow="Productivity" title="Notifications & Reminders" description="Review important alerts and schedule learning reminders." icon={Bell} actions={<button className={cn(ui.button.base, ui.button.secondary)} onClick={markAll}><CheckCheck size={16} /> Mark all read</button>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <section className={cn(ui.panel, 'grid gap-3')}>
          <h2 className="text-xl font-black text-ink">Notifications</h2>
          {notifications.length === 0 ? <div className={ui.empty}><Bell size={24} /><p>No notifications yet.</p></div> : notifications.map((item) => (
            <article className={cn('grid grid-cols-[1fr_auto] gap-3 rounded-card border p-4', item.readAt ? 'border-line bg-white' : 'border-emerald-brand/30 bg-emerald-pale/60')} key={item._id}>
              <div><span className={cn(ui.badge.base, item.readAt ? ui.badge.idle : ui.badge.active)}>{item.type}</span><h3 className="mt-2 font-black text-ink">{item.title}</h3><p className="mt-1 text-sm text-ink-soft">{item.message}</p></div>
              <div className="flex gap-1">
                {!item.readAt && <button className={ui.button.icon} onClick={() => collaborationService.markNotificationRead(item._id).then(load)}><CheckCheck size={15} /></button>}
                <button className={ui.button.icon} onClick={() => collaborationService.deleteNotification(item._id).then(load)}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </section>
        <section className={cn(ui.panel, 'grid gap-4')}>
          <form className="grid gap-3" onSubmit={createReminder}>
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-ink"><CalendarClock size={19} /> Reminder Manager</h2>
            <div><label className={ui.field.label}>Title</label><div className={ui.field.control}><input className={ui.field.input} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={ui.field.label}>Date</label><div className={ui.field.control}><input className={ui.field.input} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div></div>
              <div><label className={ui.field.label}>Time</label><div className={ui.field.control}><input className={ui.field.input} type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></div></div>
            </div>
            <div><label className={ui.field.label}>Repeat</label><div className={ui.field.control}><select className={ui.field.input} value={form.repeat} onChange={(event) => setForm({ ...form, repeat: event.target.value })}><option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div></div>
            <button className={cn(ui.button.base, ui.button.primary)}><Plus size={16} /> Create Reminder</button>
          </form>
          <div className="grid gap-2">
            {reminders.length === 0 ? <p className="text-sm text-ink-soft">No reminders scheduled.</p> : reminders.map((reminder) => (
              <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface-raised px-3 py-2" key={reminder._id}>
                <span><strong className="block text-sm text-ink">{reminder.title}</strong><small className="text-ink-soft">{new Date(reminder.date).toLocaleDateString()} at {reminder.time} | {reminder.repeat}</small></span>
                <button className={ui.button.icon} onClick={() => collaborationService.deleteReminder(reminder._id).then(load)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
