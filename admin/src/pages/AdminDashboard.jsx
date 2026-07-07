import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ChevronDown,
  Clock3,
  Gauge,
  Layers3,
  LogOut,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UsersRound,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import UsersTable from '../components/UsersTable'
import * as adminService from '../services/adminService'

const defaultFilters = {
  search: '',
  role: '',
  sort: 'latest',
  page: 1,
  limit: 10,
}

const sortOptions = [
  { value: 'latest', label: 'Newest users' },
  { value: 'name', label: 'Name A to Z' },
  { value: 'email', label: 'Email A to Z' },
]

const formatDate = (date) => (date
  ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not available')
const formatHours = (minutes = 0) => `${Math.round((minutes / 60) * 10) / 10}h`
const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0))

const buildUserParams = (filters) => {
  const params = {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
  }
  if (filters.search) params.search = filters.search
  if (filters.role) params.role = filters.role
  return params
}

function Breakdown({ title, items, icon: Icon, tone }) {
  const entries = Object.entries(items || {})
  const largest = Math.max(...entries.map(([, count]) => Number(count) || 0), 1)
  const total = entries.reduce((sum, [, count]) => sum + (Number(count) || 0), 0)

  return (
    <section className={`insight-panel insight-panel--${tone} reveal-item`}>
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Distribution</p>
          <h2>{title}</h2>
        </div>
        <span className="panel-icon" aria-hidden="true"><Icon size={19} /></span>
      </div>

      {entries.length === 0 ? (
        <p className="panel-empty">No data yet.</p>
      ) : (
        <div className="distribution-list">
          {entries.map(([label, count], index) => (
            <div className="distribution-item" key={label} style={{ '--item-delay': `${index * 70}ms` }}>
              <div className="distribution-copy">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
              <div className="distribution-track" aria-hidden="true">
                <span style={{ '--bar-size': `${((Number(count) || 0) / largest) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="panel-total">{total} total</p>
    </section>
  )
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination.total || pagination.totalPages <= 1) return null

  const current = pagination.page || 1
  const totalPages = pagination.totalPages || 1
  const start = Math.max(1, current - 2)
  const end = Math.min(totalPages, current + 2)
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return (
    <nav className="pagination" aria-label="User list pagination">
      <p>Page <strong>{current}</strong> of {totalPages}</p>
      <div className="pagination__controls">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={!pagination.hasPrevPage}
          className="page-direction"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Prev</span>
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === current ? 'page' : undefined}
            className={`page-number ${page === current ? 'page-number--active' : ''}`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={!pagination.hasNextPage}
          className="page-direction"
        >
          <span>Next</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export default function AdminDashboard({ admin, onLogout }) {
  const [analytics, setAnalytics] = useState(null)
  const [skillsStats, setSkillsStats] = useState(null)
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: defaultFilters.limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [usersError, setUsersError] = useState('')
  const [reloadUsersKey, setReloadUsersKey] = useState(0)

  const userParams = useMemo(() => buildUserParams(filters), [filters])

  useEffect(() => {
    let ignore = false

    const loadAnalytics = async () => {
      try {
        const [analyticsResponse, statsResponse] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getSkillsStatistics(),
        ])
        if (ignore) return
        setAnalytics(analyticsResponse.data)
        setSkillsStats(statsResponse.data)
        setError('')
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load analytics.')
      } finally {
        if (!ignore) setAnalyticsLoading(false)
      }
    }

    loadAnalytics()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim()
      setFilters((current) => {
        if (current.search === nextSearch && current.page === 1) return current
        return { ...current, search: nextSearch, page: 1 }
      })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let ignore = false

    const loadUsers = async () => {
      try {
        setUsersLoading(true)
        const response = await adminService.getUsers(userParams)
        if (ignore) return
        setUsers(response.data.users || [])
        setPagination(response.data.pagination)
        setUsersError('')
      } catch (err) {
        if (!ignore) setUsersError(err.response?.data?.message || 'Unable to load users.')
      } finally {
        if (!ignore) setUsersLoading(false)
      }
    }

    loadUsers()
    return () => {
      ignore = true
    }
  }, [userParams, reloadUsersKey])

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: field === 'limit' ? Number(value) : value,
      page: 1,
    }))
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name} and all related data?`)) return

    try {
      setDeletingId(user._id)
      setUsersError('')
      await adminService.deleteUser(user._id)
      if (users.length === 1 && filters.page > 1) {
        setFilters((current) => ({ ...current, page: current.page - 1 }))
      } else {
        setReloadUsersKey((current) => current + 1)
      }
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setDeletingId(null)
    }
  }

  const summary = analytics?.summary || {}
  const overview = skillsStats?.overview || {}
  const recentSkills = analytics?.recentSkills || []

  return (
    <div className="admin-shell">
      <a href="#admin-main-content" className="skip-link">Skip to main content</a>
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-brand">
            <span className="admin-brand__mark" aria-hidden="true"><BarChart3 size={22} /></span>
            <div>
              <p>Skills Tracker</p>
              <span>Admin workspace</span>
            </div>
          </div>

          <div className="admin-account">
            <span className="system-status"><i aria-hidden="true" /> System live</span>
            <div className="admin-account__copy">
              <strong>{admin.name}</strong>
              <span>{admin.email}</span>
            </div>
            <button type="button" onClick={onLogout} className="sign-out-button">
              <LogOut size={17} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="admin-main-content" tabIndex="-1" className="admin-main">
        <section className="dashboard-intro reveal-item">
          <div>
            <p className="eyebrow"><Gauge size={15} aria-hidden="true" /> Workspace overview</p>
            <h1>Learning operations</h1>
            <p>Track growth, activity and account health from one focused view.</p>
          </div>
          <div className="dashboard-date">
            <span>Today</span>
            <strong>{formatDate(new Date())}</strong>
          </div>
        </section>

        {error && <div role="alert" className="alert alert--danger">{error}</div>}

        {analyticsLoading ? (
          <div className="metrics-grid" role="status" aria-label="Loading analytics">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="metric-skeleton" />)}
          </div>
        ) : (
          <>
            <section className="metrics-grid" aria-label="Key metrics">
              <StatCard label="Users" value={summary.totalUsers || 0} detail={`${summary.adminUsers || 0} admins`} icon={UsersRound} tone="emerald" delay={40} />
              <StatCard label="Skills" value={summary.totalSkills || 0} detail={`${overview.totalTopics || 0} topics`} icon={BookOpenCheck} tone="coral" delay={100} />
              <StatCard label="Learning time" value={formatHours(summary.learningMinutes)} detail={`${summary.totalLogs || 0} activity logs`} icon={Clock3} tone="sun" delay={160} />
              <StatCard label="Active users" value={summary.activeUsers30d || 0} detail="During the last 30 days" icon={Activity} tone="blue" delay={220} />
            </section>

            <div className="insights-grid">
              <Breakdown title="Skill status" items={analytics?.skillStatusBreakdown} icon={Layers3} tone="emerald" />
              <Breakdown title="Categories" items={skillsStats?.byCategory} icon={Tags} tone="coral" />
              <Breakdown title="Topic status" items={skillsStats?.topicStatusBreakdown} icon={SlidersHorizontal} tone="sun" />
            </div>

            <section className="activity-section reveal-item">
              <div className="section-heading">
                <div>
                  <p className="panel-kicker">Recently updated</p>
                  <h2>Latest skill activity</h2>
                </div>
                <Activity size={20} aria-hidden="true" />
              </div>

              {recentSkills.length === 0 ? (
                <p className="activity-empty">No recent skill activity.</p>
              ) : (
                <div className="activity-list">
                  {recentSkills.map((skill, index) => {
                    const progress = clampProgress(skill.progress)
                    return (
                      <article className="activity-row" key={skill._id} style={{ '--item-delay': `${index * 70}ms` }}>
                        <span className="activity-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <div className="activity-copy">
                          <strong>{skill.title}</strong>
                          <span>{skill.user?.name || 'Unknown user'} · {formatDate(skill.updatedAt)}</span>
                        </div>
                        <div className="activity-progress">
                          <span>{progress}%</span>
                          <div className="activity-track" aria-hidden="true"><i style={{ '--progress': `${progress}%` }} /></div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <section className="users-panel reveal-item" aria-labelledby="users-heading">
          <div className="users-toolbar">
            <div className="users-heading">
              <span className="users-heading__icon" aria-hidden="true"><UsersRound size={20} /></span>
              <div>
                <h2 id="users-heading">User management</h2>
                <p>{pagination.total} registered users</p>
              </div>
            </div>

            <div className="filter-grid" aria-label="User filters">
              <div className="field-group field-group--search">
                <label htmlFor="user-search">Search</label>
                <div className="field-control">
                  <Search size={17} aria-hidden="true" />
                  <input
                    id="user-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Name or email"
                  />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="role-filter">Role</label>
                <div className="select-control">
                  <select id="role-filter" value={filters.role} onChange={(event) => updateFilter('role', event.target.value)}>
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="user-sort">Sort</label>
                <div className="select-control">
                  <select id="user-sort" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                    {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          {usersError && <div role="alert" className="alert alert--danger users-alert">{usersError}</div>}
          <UsersTable users={users} loading={usersLoading} deletingId={deletingId} onDelete={handleDelete} />
          <Pagination
            pagination={pagination}
            onPageChange={(page) => {
              if (page < 1 || page > pagination.totalPages || page === filters.page) return
              setFilters((current) => ({ ...current, page }))
            }}
          />
        </section>
      </main>
    </div>
  )
}
