import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BookOpenCheck, CheckCircle2, Clock3, Flame, LayoutDashboard, Plus, Star, Tags } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'
import * as skillService from '../services/skillService'
import * as streakService from '../services/streakService'

const formatStreak = (days) => `${days} day${days === 1 ? '' : 's'}`
const formatDate = (date) => (date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'Not set')
const statusClass = (status) => ({
  'Not started': 'status-badge--idle',
  'In progress': 'status-badge--active',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')

export default function Dashboard() {
  const [skills, setSkills] = useState([])
  const [skillStats, setSkillStats] = useState({ totalSkills: 0, activeSkills: 0, completedSkills: 0, favoriteSkills: 0, archivedSkills: 0 })
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [skillsRes, streakRes, skillStatsRes] = await Promise.all([
          skillService.getAllSkills(),
          streakService.getStreakSummary(),
          skillService.getSkillStats(),
        ])
        setSkills(skillsRes.data.skills || [])
        setStreak(streakRes.data)
        setSkillStats(skillStatsRes.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const stats = useMemo(() => {
    const totalSkills = skillStats.totalSkills || skills.length
    const completedSkills = skillStats.completedSkills || skills.filter((skill) => skill.status === 'Completed').length
    const completedTopics = skills.reduce(
      (count, skill) => count + (skill.topics?.filter((topic) => topic.status === 'Completed').length || 0),
      0,
    )
    const learningTopics = skills.reduce(
      (count, skill) => count + (skill.topics?.filter((topic) => topic.status === 'Learning').length || 0),
      0,
    )
    const revisionTopics = skills.reduce(
      (count, skill) => count + (skill.topics?.filter((topic) => topic.status === 'Revision').length || 0),
      0,
    )
    const totalTopics = skills.reduce((count, skill) => count + (skill.topics?.length || 0), 0)
    const learningHours = Math.round((totalTopics || 0) * 1.75)
    const averageProgress = totalSkills
      ? Math.round(skills.reduce((sum, skill) => sum + (Number(skill.progress) || 0), 0) / totalSkills)
      : 0

    const recentActivity = skills
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)

    const categoryBreakdown = Object.entries(skills.reduce((map, skill) => {
      map[skill.category] = (map[skill.category] || 0) + 1
      return map
    }, {})).sort((a, b) => b[1] - a[1])

    const topicBreakdown = ['Not Started', 'Learning', 'Revision', 'Completed'].map((status) => ({
      status,
      count: skills.reduce(
        (sum, skill) => sum + (skill.topics?.filter((topic) => topic.status === status).length || 0),
        0,
      ),
    }))

    return {
      totalSkills,
      activeSkills: skillStats.activeSkills || skills.filter((skill) => skill.status === 'Learning' && !skill.isArchived).length,
      completedSkills,
      favoriteSkills: skillStats.favoriteSkills || skills.filter((skill) => skill.isFavorite).length,
      archivedSkills: skillStats.archivedSkills || skills.filter((skill) => skill.isArchived).length,
      completedTopics,
      learningTopics,
      revisionTopics,
      totalTopics,
      learningHours,
      averageProgress,
      recentActivity,
      categoryBreakdown,
      topicBreakdown,
    }
  }, [skillStats, skills])

  if (loading) {
    return (
      <div className="dashboard-skeleton" role="status" aria-label="Loading dashboard">
        <div className="skeleton-heading" />
        <div className="metrics-grid">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton-card" key={index} />)}</div>
        <div className="skeleton-panel" />
      </div>
    )
  }

  if (error) return <div className="alert alert--danger" role="alert">{error}</div>

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="Analytics dashboard"
        title="Learning progress"
        description="A focused view of your momentum, completion and recent activity."
        icon={LayoutDashboard}
        actions={(
          <>
            <Link to="/logs" className="button button--secondary"><Clock3 size={17} /> Add session</Link>
            <Link to="/skills/new" className="button button--primary"><Plus size={17} /> Add skill</Link>
          </>
        )}
      />

      <section className="metrics-grid" aria-label="Learning metrics">
        <MetricCard label="Total skills" value={stats.totalSkills} detail={`${stats.learningHours} estimated learning hours`} icon={BookOpenCheck} tone="emerald" progress={stats.totalSkills ? 100 : 0} delay={40} />
        <MetricCard label="Active skills" value={stats.activeSkills} detail="Currently learning" icon={Activity} tone="blue" progress={stats.totalSkills ? (stats.activeSkills / stats.totalSkills) * 100 : 0} delay={80} />
        <MetricCard label="Completed skills" value={stats.completedSkills} detail={`${Math.max(stats.totalSkills - stats.completedSkills, 0)} not completed`} icon={CheckCircle2} tone="coral" progress={stats.totalSkills ? (stats.completedSkills / stats.totalSkills) * 100 : 0} delay={120} />
        <MetricCard label="Total topics" value={stats.totalTopics} detail={`${stats.completedTopics} completed`} icon={Tags} tone="sun" progress={stats.totalTopics ? (stats.completedTopics / stats.totalTopics) * 100 : 0} delay={160} />
        <MetricCard label="Learning topics" value={stats.learningTopics} detail={`${stats.revisionTopics} in revision`} icon={Tags} tone="blue" progress={stats.totalTopics ? (stats.learningTopics / stats.totalTopics) * 100 : 0} delay={200} />
        <MetricCard label="Favorite skills" value={stats.favoriteSkills} detail={`${stats.archivedSkills} archived`} icon={Star} tone="sun" progress={stats.totalSkills ? (stats.favoriteSkills / stats.totalSkills) * 100 : 0} delay={240} />
        <MetricCard label="Current streak" value={formatStreak(streak.currentStreak)} detail={`Longest: ${formatStreak(streak.longestStreak)}`} icon={Flame} tone="blue" progress={Math.min(100, streak.currentStreak * 10)} delay={280} />
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-progress surface-panel reveal-item">
          <div className="section-title">
            <div><p>Overall progress</p><h2>Your learning pulse</h2></div>
            <Activity size={20} aria-hidden="true" />
          </div>
          <div className="progress-hero">
            <strong>{stats.averageProgress}%</strong>
            <div>
              <span>Average completion across all skills</span>
              <div className="progress-track"><i className="progress-fill" style={{ '--progress': `${stats.averageProgress}%` }} /></div>
            </div>
          </div>
          <div className="category-list">
            {stats.categoryBreakdown.length === 0 ? (
              <p className="panel-empty">No categories yet.</p>
            ) : stats.categoryBreakdown.map(([category, count], index) => (
              <div className="category-row" key={category} style={{ '--item-delay': `${index * 60}ms` }}>
                <span>{category}</span><strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="recent-panel surface-panel reveal-item">
          <div className="section-title">
            <div><p>Recently updated</p><h2>Skill activity</h2></div>
            <Clock3 size={20} aria-hidden="true" />
          </div>
          {stats.recentActivity.length === 0 ? (
            <p className="panel-empty">No recent activity yet.</p>
          ) : (
            <div className="recent-list">
              {stats.recentActivity.map((skill, index) => (
                <Link to={`/skills/${skill._id}`} className="recent-row" key={skill._id} style={{ '--item-delay': `${index * 65}ms` }}>
                  <span className="recent-row__index">{String(index + 1).padStart(2, '0')}</span>
                  <div><strong>{skill.title}</strong><small>{skill.category} · {formatDate(skill.updatedAt)}</small></div>
                  <span className={`status-badge ${statusClass(skill.status)}`}>{skill.progress}%</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="skill-progress-panel surface-panel reveal-item">
          <div className="section-title"><div><p>Skill progress</p><h2>Progress by skill</h2></div><BookOpenCheck size={20} /></div>
          {skills.length === 0 ? <p className="panel-empty">No skills to display.</p> : (
            <div className="skill-progress-list">
              {skills.map((skill) => (
                <div className="skill-progress-row" key={skill._id}>
                  <div><span>{skill.title}</span><strong>{skill.progress}%</strong></div>
                  <div className="progress-track"><i className="progress-fill" style={{ '--progress': `${skill.progress}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="topic-panel surface-panel reveal-item">
          <div className="section-title"><div><p>Topic breakdown</p><h2>Learning stages</h2></div><Tags size={20} /></div>
          <div className="topic-list">
            {stats.topicBreakdown.map(({ status, count }) => {
              const width = stats.totalTopics ? Math.round((count / stats.totalTopics) * 100) : 0
              return (
                <div className={`topic-row topic-row--${status.toLowerCase().replace(' ', '-')}`} key={status}>
                  <div><span>{status}</span><strong>{count}</strong></div>
                  <div className="progress-track"><i className="progress-fill" style={{ '--progress': `${width}%` }} /></div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
