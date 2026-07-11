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
  Cpu,
  HardDrive,
  Terminal,
  FileJson,
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

  const [activeTab, setActiveTab] = useState('overview')

  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState([])
  const [auditSearch, setAuditSearch] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [expandedAuditId, setExpandedAuditId] = useState(null)
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  })

  // System states
  const [aiStats, setAiStats] = useState([])
  const [storageStats, setStorageStats] = useState(null)
  const [systemLoading, setSystemLoading] = useState(false)
  const [systemError, setSystemError] = useState('')

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

  // Load Audit Logs
  useEffect(() => {
    if (activeTab !== 'audit') return
    let ignore = false

    const fetchLogs = async () => {
      try {
        setAuditLoading(true)
        const res = await adminService.getAuditLogs({
          page: auditPagination.page,
          limit: auditPagination.limit,
          search: auditSearch,
          action: auditAction,
        })
        if (ignore) return
        setAuditLogs(res.data.logs || [])
        setAuditPagination(res.data.pagination)
        setAuditError('')
      } catch (err) {
        if (!ignore) setAuditError(err.response?.data?.message || 'Unable to load audit logs.')
      } finally {
        if (!ignore) setAuditLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchLogs()
    }, 300)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [activeTab, auditPagination.page, auditPagination.limit, auditSearch, auditAction])

  // Load System Stats
  useEffect(() => {
    if (activeTab !== 'system') return
    let ignore = false

    const fetchSystemData = async () => {
      try {
        setSystemLoading(true)
        const [aiRes, storageRes] = await Promise.all([
          adminService.getAIUsage(),
          adminService.getStorageUsage(),
        ])
        if (ignore) return
        setAiStats(aiRes.data.usage || [])
        setStorageStats(storageRes.data)
        setSystemError('')
      } catch (err) {
        if (!ignore) setSystemError(err.response?.data?.message || 'Unable to load system metrics.')
      } finally {
        if (!ignore) setSystemLoading(false)
      }
    }

    fetchSystemData()
    return () => {
      ignore = true
    }
  }, [activeTab])

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
            <p>Track growth, activity, system audit logs, and account health from one focused view.</p>
          </div>
          <div className="dashboard-date">
            <span>Today</span>
            <strong>{formatDate(new Date())}</strong>
          </div>
        </section>

        {error && <div role="alert" className="alert alert--danger">{error}</div>}

        {/* Tab Controls */}
        <div className="flex border-b border-gray-300/60 mb-6 gap-6 reveal-item" style={{ '--reveal-delay': '100ms' }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Overview & Users
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'audit' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Audit Logs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'system' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            System & AI
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
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
          </>
        )}

        {activeTab === 'audit' && (
          <section className="users-panel reveal-item" aria-labelledby="audit-heading">
            <div className="users-toolbar">
              <div className="users-heading">
                <span className="users-heading__icon" aria-hidden="true"><ShieldCheck size={20} /></span>
                <div>
                  <h2 id="audit-heading">Audit logs</h2>
                  <p>{auditPagination.total} system logs tracked</p>
                </div>
              </div>

              <div className="filter-grid" aria-label="Audit filters">
                <div className="field-group field-group--search">
                  <label htmlFor="audit-search">Search</label>
                  <div className="field-control">
                    <Search size={17} aria-hidden="true" />
                    <input
                      id="audit-search"
                      value={auditSearch}
                      onChange={(e) => {
                        setAuditSearch(e.target.value)
                        setAuditPagination(current => ({ ...current, page: 1 }))
                      }}
                      placeholder="Search User or Action"
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="action-filter">Action Category</label>
                  <div className="select-control">
                    <select
                      id="action-filter"
                      value={auditAction}
                      onChange={(e) => {
                        setAuditAction(e.target.value)
                        setAuditPagination(current => ({ ...current, page: 1 }))
                      }}
                    >
                      <option value="">All Actions</option>
                      <option value="auth-login-success">Login Success</option>
                      <option value="auth-login-failed">Login Failed</option>
                      <option value="auth-logout">Logout</option>
                      <option value="auth-password-reset">Password Reset</option>
                      <option value="password-change-authorized">Password Change</option>
                      <option value="profile-update">Profile Update</option>
                      <option value="skill-create">Skill Create</option>
                      <option value="skill-update">Skill Update</option>
                      <option value="skill-delete">Skill Delete</option>
                      <option value="topic-create">Topic Create</option>
                      <option value="topic-update">Topic Update</option>
                      <option value="topic-delete">Topic Delete</option>
                      <option value="admin-delete-user">Admin Delete User</option>
                    </select>
                    <ChevronDown size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {auditError && <div role="alert" className="alert alert--danger users-alert">{auditError}</div>}

            {auditLoading ? (
              <div className="py-12 text-center text-gray-500 font-semibold">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-semibold">No audit logs found matching criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-300/60 bg-gray-100/50 text-gray-600 font-bold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-50/50">
                        <td className="p-3 text-gray-600 font-medium">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {log.userId ? (
                            <div>
                              <div className="font-bold text-gray-800">{log.userId.name}</div>
                              <div className="text-xs text-gray-500">{log.userId.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">System / Unauthenticated</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            log.action.includes('failed') ? 'bg-red-100 text-red-700' :
                            log.action.includes('delete') ? 'bg-orange-100 text-orange-700' :
                            log.action.includes('create') ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-500">{log.ip || 'N/A'}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setExpandedAuditId(expandedAuditId === log._id ? null : log._id)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5"
                          >
                            <FileJson size={13} />
                            {expandedAuditId === log._id ? 'Hide Metadata' : 'View Metadata'}
                          </button>
                          {expandedAuditId === log._id && (
                            <pre className="mt-2 p-3 bg-gray-900 text-emerald-400 rounded-md text-xs font-mono max-w-md overflow-x-auto">
                              {JSON.stringify(log.metadata || {}, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              pagination={auditPagination}
              onPageChange={(page) => {
                if (page < 1 || page > auditPagination.totalPages || page === auditPagination.page) return
                setAuditPagination((current) => ({ ...current, page }))
              }}
            />
          </section>
        )}

        {activeTab === 'system' && (
          <section className="grid gap-6">
            {systemError && <div role="alert" className="alert alert--danger">{systemError}</div>}

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Storage Usage Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm reveal-item" style={{ '--reveal-delay': '50ms' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Disk Space</span>
                    <h2 className="text-xl font-bold text-gray-800 mt-1">Storage usage</h2>
                  </div>
                  <span className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600"><HardDrive size={22} /></span>
                </div>

                {systemLoading ? (
                  <div className="py-6 text-gray-400 font-semibold">Calculating storage size...</div>
                ) : storageStats ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-extrabold text-gray-800">{storageStats.avatarStorageMb} MB</p>
                      <p className="text-sm text-gray-500 mt-1">Total avatar uploads directory footprint</p>
                    </div>

                    <div className="bg-gray-100 rounded-full h-2 w-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(100, (storageStats.avatarStorageMb / 100) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-gray-500">
                      <span>{storageStats.totalAvatars} active user avatars</span>
                      <span>Cap: 100 MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-gray-400 font-semibold">No storage statistics available.</div>
                )}
              </div>

              {/* Server Logs Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm reveal-item" style={{ '--reveal-delay': '120ms' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">AI Assistant Metrics</span>
                    <h2 className="text-xl font-bold text-gray-800 mt-1">AI Provider stats</h2>
                  </div>
                  <span className="p-2.5 bg-blue-50 rounded-lg text-blue-600"><Cpu size={22} /></span>
                </div>

                {systemLoading ? (
                  <div className="py-6 text-gray-400 font-semibold">Fetching AI stats...</div>
                ) : aiStats.length === 0 ? (
                  <div className="py-6 text-gray-400 font-semibold">No AI prompt records logged.</div>
                ) : (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto">
                    {aiStats.map((stat, i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                        <div>
                          <strong className="text-gray-800 capitalize">{stat.type}</strong>
                          <span className="text-xs text-gray-400 block font-semibold">{stat.provider} model</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600">{stat.count} requests</span>
                          <span className="text-xs text-gray-400 block">Last: {new Date(stat.lastUsed).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
