import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Award, Bell, BookOpenCheck, CalendarDays, CheckCircle2, Clock3, Flame, LayoutDashboard, Medal, Plus, Save, Tags, Target, TrendingUp, Trophy } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import * as aiAssistantService from '../services/aiAssistantService'
import * as collaborationService from '../services/collaborationService'
import * as gamificationService from '../services/gamificationService'
import * as logService from '../services/learningLogService'
import * as noteResourceService from '../services/noteResourceService'
import * as revisionService from '../services/revisionService'
import * as skillService from '../services/skillService'
import * as streakService from '../services/streakService'
import { cn, statusTone, ui } from '../utils/tw'

const formatStreak = (days) => `${days} day${days === 1 ? '' : 's'}`
const formatDate = (date) => (date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Not set')
const formatHours = (hours) => `${Number(hours || 0).toFixed(1)}h`

function Panel({ eyebrow, title, icon: Icon, children }) {
  return (
    <section className={cn(ui.panel, 'grid gap-4')}>
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">{eyebrow}</p><h2 className="mt-1 text-xl font-black text-ink">{title}</h2></div>
        {Icon ? <Icon size={20} className="text-emerald-dark-brand" /> : null}
      </div>
      {children}
    </section>
  )
}

function ProgressBar({ value, tone = 'bg-emerald-brand' }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0))
  return <div className="h-2 overflow-hidden rounded-full bg-line"><i className={cn('block h-full rounded-full transition-all', tone)} style={{ width: `${safe}%` }} /></div>
}

function ProgressChart({ title, data = [], variant = 'bar' }) {
  const max = Math.max(...data.map((item) => Number(item.hours) || 0), 1)
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * 100
    const y = 100 - ((Number(item.hours) || 0) / max) * 90
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="grid gap-3 rounded-card border border-line bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="font-black text-ink">{title}</h3><span className="text-sm font-bold text-ink-soft">{formatHours(data.at(-1)?.hours)}</span></div>
      {variant === 'line' ? (
        <svg className="h-28 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-brand" points={points} /></svg>
      ) : (
        <div className="flex h-28 items-end gap-2" aria-hidden="true">{data.map((item) => <i className="flex-1 rounded-t bg-emerald-brand" key={item.label} style={{ height: `${Math.max(6, ((Number(item.hours) || 0) / max) * 100)}%` }} />)}</div>
      )}
      <div className="flex justify-between text-xs font-bold text-ink-muted"><span>{data[0]?.label || '-'}</span><span>{data.at(-1)?.label || '-'}</span></div>
    </div>
  )
}

export default function Dashboard() {
  const [skills, setSkills] = useState([])
  const [skillStats, setSkillStats] = useState({ totalSkills: 0, activeSkills: 0, completedSkills: 0, favoriteSkills: 0, archivedSkills: 0 })
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 })
  const [progress, setProgress] = useState(null)
  const [knowledgeStats, setKnowledgeStats] = useState({ totalNotes: 0, totalResources: 0, recentlyUpdatedNotes: [], favoriteResources: [] })
  const [revisionStats, setRevisionStats] = useState({ widgets: { dueToday: 0, upcoming: 0, missed: 0, completed: 0, completionRate: 0 }, analytics: { completedThisWeek: 0 } })
  const [gamification, setGamification] = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [collaboration, setCollaboration] = useState({ notifications: [], unreadNotifications: 0, teams: [], activity: [], reminders: [] })
  const [goalForm, setGoalForm] = useState({ dailyStudyHours: 1, weeklyStudyHours: 7, monthlyStudyHours: 30 })
  const [selectedDate, setSelectedDate] = useState('')
  const [savingGoals, setSavingGoals] = useState(false)
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    const [skillsRes, streakRes, skillStatsRes, progressRes, knowledgeRes, revisionRes, gamificationRes, aiRes, collaborationRes] = await Promise.allSettled([
      skillService.getAllSkills(),
      streakService.getStreakSummary(),
      skillService.getSkillStats(),
      logService.getLearningProgress(),
      noteResourceService.getKnowledgeStats(),
      revisionService.getRevisionStats(),
      gamificationService.getGamificationSummary(),
      aiAssistantService.getRecommendations(),
      collaborationService.getSummary(),
    ])
    if (skillsRes.status === 'rejected' || streakRes.status === 'rejected' || skillStatsRes.status === 'rejected' || progressRes.status === 'rejected' || knowledgeRes.status === 'rejected' || revisionRes.status === 'rejected' || gamificationRes.status === 'rejected') {
      throw skillsRes.reason || streakRes.reason || skillStatsRes.reason || progressRes.reason || knowledgeRes.reason || revisionRes.reason || gamificationRes.reason
    }
    setSkills(skillsRes.value.data.skills || [])
    setStreak(progressRes.value.data.streak || streakRes.value.data)
    setSkillStats(skillStatsRes.value.data)
    setProgress(progressRes.value.data)
    setKnowledgeStats(knowledgeRes.value.data)
    setRevisionStats(revisionRes.value.data)
    setGamification(gamificationRes.value.data)
    if (aiRes.status === 'fulfilled') setAiRecommendations(aiRes.value.data.data)
    if (collaborationRes.status === 'fulfilled') setCollaboration(collaborationRes.value.data.data)
    setGoalForm({
      dailyStudyHours: progressRes.value.data.goals?.dailyStudyHours ?? 1,
      weeklyStudyHours: progressRes.value.data.goals?.weeklyStudyHours ?? 7,
      monthlyStudyHours: progressRes.value.data.goals?.monthlyStudyHours ?? 30,
    })
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        await loadDashboard()
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loadDashboard])

  const stats = useMemo(() => {
    const totalSkills = skillStats.totalSkills || skills.length
    const completedSkills = skillStats.completedSkills || skills.filter((skill) => skill.status === 'Completed').length
    const completedTopics = skills.reduce((count, skill) => count + (skill.topics?.filter((topic) => topic.status === 'Completed').length || 0), 0)
    const totalTopics = skills.reduce((count, skill) => count + (skill.topics?.length || 0), 0)
    const averageProgress = totalSkills ? Math.round(skills.reduce((sum, skill) => sum + (Number(skill.progress) || 0), 0) / totalSkills) : 0
    const recentActivity = skills.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
    const topicBreakdown = ['Not Started', 'Learning', 'Revision', 'Completed'].map((status) => ({
      status,
      count: skills.reduce((sum, skill) => sum + (skill.topics?.filter((topic) => topic.status === status).length || 0), 0),
    }))
    return {
      totalSkills,
      activeSkills: skillStats.activeSkills || skills.filter((skill) => skill.status === 'Learning' && !skill.isArchived).length,
      completedSkills,
      completedTopics,
      totalTopics,
      learningHours: Math.round((totalTopics || 0) * 1.75),
      averageProgress,
      recentActivity,
      topicBreakdown,
    }
  }, [skillStats, skills])

  const handleGoalChange = (event) => setGoalForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const handleGoalSubmit = async (event) => {
    event.preventDefault()
    setSavingGoals(true)
    setError(null)
    setSuccess('')
    try {
      await logService.updateLearningGoals({
        dailyStudyHours: Number(goalForm.dailyStudyHours),
        weeklyStudyHours: Number(goalForm.weeklyStudyHours),
        monthlyStudyHours: Number(goalForm.monthlyStudyHours),
      })
      await loadDashboard()
      setSuccess('Learning goals updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update learning goals')
    } finally {
      setSavingGoals(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-5" role="status" aria-label="Loading dashboard">
        <div className="skeleton-shimmer h-24 rounded-panel" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div className="skeleton-shimmer h-36 rounded-panel" key={index} />)}</div>
        <div className="skeleton-shimmer h-80 rounded-panel" />
      </div>
    )
  }

  if (error && !progress && skills.length === 0) return <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>

  const selectedSessions = selectedDate ? (progress?.sessionsByDate?.[selectedDate] || []) : []
  const levelInfo = gamification?.profile?.levelInfo || { level: 1, progress: 0, nextLevelXp: 100 }
  const recentAchievements = gamification?.profile?.achievements?.slice(0, 4) || []
  const badges = gamification?.profile?.badges?.slice(0, 6) || []
  const activeChallenges = [...(gamification?.challenges?.daily || []), ...(gamification?.challenges?.weekly || [])].slice(0, 4)

  return (
    <div className="grid gap-5">
      <Toast message={success} onClose={() => setSuccess('')} />
      <PageHeader
        eyebrow="Analytics dashboard"
        title="Learning progress"
        description="A focused view of your momentum, completion and recent activity."
        icon={LayoutDashboard}
        actions={<><Link to="/logs" className={cn(ui.button.base, ui.button.secondary)}><Clock3 size={17} /> Add session</Link><Link to="/skills/new" className={cn(ui.button.base, ui.button.primary)}><Plus size={17} /> Add skill</Link></>}
      />
      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Learning metrics">
        <MetricCard label="Total skills" value={stats.totalSkills} detail={`${stats.learningHours} estimated learning hours`} icon={BookOpenCheck} tone="emerald" progress={stats.totalSkills ? 100 : 0} />
        <MetricCard label="Active skills" value={stats.activeSkills} detail="Currently learning" icon={Activity} tone="blue" progress={stats.totalSkills ? (stats.activeSkills / stats.totalSkills) * 100 : 0} />
        <MetricCard label="Completed skills" value={stats.completedSkills} detail={`${Math.max(stats.totalSkills - stats.completedSkills, 0)} not completed`} icon={CheckCircle2} tone="coral" progress={stats.totalSkills ? (stats.completedSkills / stats.totalSkills) * 100 : 0} />
        <MetricCard label="Total topics" value={stats.totalTopics} detail={`${stats.completedTopics} completed`} icon={Tags} tone="sun" progress={stats.totalTopics ? (stats.completedTopics / stats.totalTopics) * 100 : 0} />
        <MetricCard label="Current streak" value={formatStreak(streak.currentStreak)} detail={`Longest: ${formatStreak(streak.longestStreak)}`} icon={Flame} tone="blue" progress={Math.min(100, streak.currentStreak * 10)} />
        <MetricCard label="Today's learning" value={formatHours(progress?.todayLearning?.hours)} detail="Recorded today" icon={Clock3} tone="emerald" progress={progress?.goalProgress?.today?.percent || 0} />
        <MetricCard label="Weekly progress" value={formatHours(progress?.goalProgress?.week?.hours)} detail={`${progress?.goalProgress?.week?.percent || 0}% of goal`} icon={TrendingUp} tone="blue" progress={progress?.goalProgress?.week?.percent || 0} />
        <MetricCard label="Monthly progress" value={formatHours(progress?.goalProgress?.month?.hours)} detail={`${progress?.goalProgress?.month?.percent || 0}% of goal`} icon={CalendarDays} tone="coral" progress={progress?.goalProgress?.month?.percent || 0} />
        <MetricCard label="Total notes" value={knowledgeStats.totalNotes || 0} detail={`${knowledgeStats.recentlyUpdatedNotes?.length || 0} recently updated`} icon={BookOpenCheck} tone="emerald" progress={Math.min(100, knowledgeStats.totalNotes || 0)} />
        <MetricCard label="Revisions due" value={revisionStats.widgets?.dueToday || 0} detail={`${revisionStats.widgets?.missed || 0} missed`} icon={Bell} tone="coral" progress={Math.min(100, (revisionStats.widgets?.dueToday || 0) * 10)} />
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel eyebrow="Gamification" title="XP progress" icon={Trophy}>
          <div className="grid gap-2"><div className="flex justify-between gap-3 text-sm"><strong>Level {levelInfo.level}</strong><span>{gamification?.profile?.totalXp || 0} / {levelInfo.nextLevelXp} XP</span></div><ProgressBar value={levelInfo.progress} /></div>
          <div className="flex flex-wrap gap-2">{badges.length === 0 ? <p className="text-sm text-ink-soft">No badges unlocked yet.</p> : badges.map((badge) => <span className={cn(ui.badge.base, ui.badge.active)} key={badge.key}><Award size={15} /> {badge.title}</span>)}</div>
        </Panel>
        <Panel eyebrow="Achievements" title="Recently unlocked" icon={Medal}>
          {recentAchievements.length === 0 ? <p className="text-sm text-ink-soft">Achievements unlock as you learn.</p> : recentAchievements.map((achievement) => <div className="rounded-card border border-line p-3" key={achievement.key}><strong>{achievement.title}</strong><span className="mt-1 block text-sm text-ink-soft">{achievement.description}</span></div>)}
        </Panel>
        <Panel eyebrow="Challenges" title="Active goals" icon={Target}>
          {activeChallenges.map((challenge) => {
            const percent = Math.min(100, Math.round((challenge.progress / Math.max(challenge.target, 1)) * 100))
            return <div className="grid gap-2" key={challenge.key}><div className="flex justify-between gap-3 text-sm"><strong>{challenge.title}</strong><span>{challenge.progress}/{challenge.target} {challenge.unit}</span></div><ProgressBar value={percent} /></div>
          })}
        </Panel>
      </div>

      <Panel eyebrow="AI assistant" title="Recommended next step" icon={Target}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-card border border-line bg-surface-raised p-4"><span className="text-xs font-bold uppercase text-ink-soft">Study today</span><strong className="mt-2 block text-ink">{aiRecommendations?.studyToday || 'Open AI Assistant for a plan.'}</strong></div>
          <div className="rounded-card border border-line bg-surface-raised p-4"><span className="text-xs font-bold uppercase text-ink-soft">Revision focus</span><strong className="mt-2 block text-ink">{aiRecommendations?.revisionFocus || 'No urgent revision yet.'}</strong></div>
          <div className="rounded-card border border-line bg-surface-raised p-4"><span className="text-xs font-bold uppercase text-ink-soft">Next action</span><strong className="mt-2 block text-ink">{aiRecommendations?.nextActions?.[0] || 'Log a focused session.'}</strong></div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-4">
        <Panel eyebrow="Collaboration" title="Notifications" icon={Bell}>
          <strong className="text-3xl font-black text-ink">{collaboration.unreadNotifications || 0}</strong>
          <p className="text-sm text-ink-soft">Unread alerts</p>
          <Link to="/notifications" className={cn(ui.button.base, ui.button.secondary, 'w-fit')}>Open alerts</Link>
        </Panel>
        <Panel eyebrow="Teams" title="Workspaces" icon={Activity}>
          {collaboration.teams?.length ? collaboration.teams.slice(0, 3).map((team) => <div className="rounded-card border border-line bg-white p-3" key={team._id}><strong className="block text-ink">{team.name}</strong><span className="text-sm text-ink-soft">{team.members?.length || 0} members</span></div>) : <p className="text-sm text-ink-soft">No teams yet.</p>}
        </Panel>
        <Panel eyebrow="Reminders" title="Upcoming" icon={CalendarDays}>
          {collaboration.reminders?.length ? collaboration.reminders.slice(0, 3).map((reminder) => <div className="rounded-card border border-line bg-white p-3" key={reminder._id}><strong className="block text-ink">{reminder.title}</strong><span className="text-sm text-ink-soft">{formatDate(reminder.date)} at {reminder.time}</span></div>) : <p className="text-sm text-ink-soft">No reminders scheduled.</p>}
        </Panel>
        <Panel eyebrow="Activity" title="Latest" icon={Activity}>
          {collaboration.activity?.length ? collaboration.activity.slice(0, 3).map((item) => <div className="rounded-card border border-line bg-white p-3" key={item._id}><strong className="block text-ink">{item.title}</strong><span className="text-sm text-ink-soft">{formatDate(item.createdAt)}</span></div>) : <p className="text-sm text-ink-soft">No collaboration activity yet.</p>}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form onSubmit={handleGoalSubmit} className={cn(ui.panel, 'grid gap-4')}>
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Goals</p><h2 className="mt-1 text-xl font-black text-ink">Study targets</h2></div><Target size={20} className="text-emerald-dark-brand" /></div>
          {['dailyStudyHours', 'weeklyStudyHours', 'monthlyStudyHours'].map((field) => {
            const label = field === 'dailyStudyHours' ? 'Daily hours' : field === 'weeklyStudyHours' ? 'Weekly hours' : 'Monthly hours'
            const key = field === 'dailyStudyHours' ? 'today' : field === 'weeklyStudyHours' ? 'week' : 'month'
            const item = progress?.goalProgress?.[key]
            return <div className="grid gap-2" key={field}><label className={ui.field.label} htmlFor={field}>{label}</label><div className={ui.field.control}><input className={ui.field.input} id={field} name={field} type="number" min="0" step="0.25" value={goalForm[field]} onChange={handleGoalChange} /><span className="text-sm font-black text-emerald-dark-brand">{item?.percent || 0}%</span></div><ProgressBar value={item?.percent || 0} /></div>
          })}
          <button type="submit" disabled={savingGoals} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {savingGoals ? 'Saving...' : 'Save goals'}</button>
        </form>
        <Panel eyebrow="Analytics" title="Learning hours" icon={Activity}>
          <div className="grid gap-3"><ProgressChart title="Daily hours" variant="line" data={progress?.analytics?.dailyHours || []} /><ProgressChart title="Weekly hours" variant="bar" data={progress?.analytics?.weeklyHours || []} /><ProgressChart title="Monthly hours" variant="bar" data={progress?.analytics?.monthlyHours || []} /></div>
        </Panel>
      </div>

      <Panel eyebrow="Calendar" title="Learning activity" icon={CalendarDays}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16px,1fr))] gap-1" aria-label="Learning activity calendar">
          {(progress?.calendar || []).map((day) => {
            const tone = day.level === 'high' ? 'bg-emerald-brand' : day.level === 'medium' ? 'bg-emerald-light-brand' : day.level === 'low' ? 'bg-emerald-pale' : 'bg-line'
            return <button type="button" key={day.date} className={cn('h-4 rounded-sm border border-white/70 transition hover:scale-110', tone, selectedDate === day.date && 'ring-2 ring-emerald-dark-brand')} title={`${day.date}: ${day.hours}h`} aria-label={`${day.date}, ${day.hours} hours`} onClick={() => setSelectedDate(day.date)} />
          })}
        </div>
        {selectedDate && <div className="grid gap-3 rounded-card border border-line bg-surface-raised p-4"><h3 className="font-black text-ink">{selectedDate}</h3>{selectedSessions.length === 0 ? <p className="text-sm text-ink-soft">No sessions on this day.</p> : selectedSessions.map((session) => <div className="rounded-card border border-line bg-white p-3 text-sm" key={session._id}><strong className="block text-ink">{session.topic?.title || 'Deleted Topic'}</strong><span className="text-ink-soft">{session.sessionType || 'Study'} | {formatHours((session.duration || 0) / 60)}</span></div>)}</div>}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <Panel eyebrow="Recently updated" title="Skill activity" icon={Clock3}>
          {stats.recentActivity.length === 0 ? <p className="text-sm text-ink-soft">No recent activity yet.</p> : stats.recentActivity.map((skill, index) => (
            <Link to={`/skills/${skill._id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-card border border-line bg-white p-3 transition hover:border-emerald-brand hover:bg-emerald-pale" key={skill._id}>
              <span className="grid size-8 place-items-center rounded-card bg-surface-raised text-xs font-black text-ink-soft">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0"><strong className="block truncate text-ink">{skill.title}</strong><small className="text-ink-soft">{skill.category} | {formatDate(skill.updatedAt)}</small></div>
              <span className={cn(ui.badge.base, statusTone(skill.status))}>{skill.progress}%</span>
            </Link>
          ))}
        </Panel>
        <Panel eyebrow="Topic breakdown" title="Learning stages" icon={Tags}>
          {stats.topicBreakdown.map(({ status, count }) => {
            const width = stats.totalTopics ? Math.round((count / stats.totalTopics) * 100) : 0
            return <div className="grid gap-2" key={status}><div className="flex justify-between gap-3 text-sm"><span>{status}</span><strong>{count}</strong></div><ProgressBar value={width} tone={status === 'Completed' ? 'bg-emerald-brand' : status === 'Revision' ? 'bg-sun' : status === 'Learning' ? 'bg-blue-brand' : 'bg-line-strong'} /></div>
          })}
        </Panel>
      </div>
    </div>
  )
}
