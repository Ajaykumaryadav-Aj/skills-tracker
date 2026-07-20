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
  FileText,
  Settings,
  Lock,
  Edit,
  Trash2,
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
    <nav className="pagination" aria-label="Pagination controls">
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

  // Modals state
  const [editingUser, setEditingUser] = useState(null)
  const [resetPwUser, setResetPwUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('user')
  const [newPassword, setNewPassword] = useState('')

  // Content Management States
  const [contentTab, setContentTab] = useState('skills')
  const [skillsList, setSkillsList] = useState([])
  const [topicsList, setTopicsList] = useState([])
  const [logsList, setLogsList] = useState([])
  const [contentSearch, setContentSearch] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [contentPagination, setContentPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  })

  // File Management States
  const [filesList, setFilesList] = useState([])
  const [filesSearch, setFilesSearch] = useState('')
  const [filesLoading, setFilesLoading] = useState(false)

  // Settings States
  const [settings, setSettings] = useState({
    aiProvider: 'gemini',
    uploadLimitsMb: 10,
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    sessionLimitsMinutes: 120
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Syslogs States
  const [syslogCategory, setSyslogCategory] = useState('requests')
  const [syslogContent, setSyslogContent] = useState('')
  const [syslogLoading, setSyslogLoading] = useState(false)

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

  // System metrics states
  const [aiStats, setAiStats] = useState([])
  const [storageStats, setStorageStats] = useState(null)
  const [systemLoading, setSystemLoading] = useState(false)
  const [systemError, setSystemError] = useState('')

  const userParams = useMemo(() => buildUserParams(filters), [filters])

  // Initial dashboard metrics loading
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const [analyticsResponse, statsResponse] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getSkillsStatistics(),
      ])
      setAnalytics(analyticsResponse.data)
      setSkillsStats(statsResponse.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load analytics.')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
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

  // Load Users List
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

  // Load Content Management Items
  const loadContentList = async () => {
    try {
      setContentLoading(true)
      const params = {
        page: contentPagination.page,
        limit: contentPagination.limit,
        search: contentSearch
      }

      if (contentTab === 'skills') {
        const res = await adminService.getSkillsList(params)
        setSkillsList(res.data.skills || [])
        setContentPagination(res.data.pagination)
      } else if (contentTab === 'topics') {
        const res = await adminService.getTopicsList(params)
        setTopicsList(res.data.topics || [])
        setContentPagination(res.data.pagination)
      } else if (contentTab === 'logs') {
        const res = await adminService.getLogsList(params)
        setLogsList(res.data.logs || [])
        setContentPagination(res.data.pagination)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load content')
    } finally {
      setContentLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'content') {
      loadContentList()
    }
  }, [activeTab, contentTab, contentPagination.page, contentSearch])

  // Delete Content Helpers
  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Delete this skill and all associated topics and learning logs?')) return
    try {
      await adminService.deleteSkillAdmin(id)
      loadContentList()
      loadAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete skill')
    }
  }

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Delete this topic and associated learning logs?')) return
    try {
      await adminService.deleteTopicAdmin(id)
      loadContentList()
      loadAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete topic')
    }
  }

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Delete this learning log?')) return
    try {
      await adminService.deleteLogAdmin(id)
      loadContentList()
      loadAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete log')
    }
  }

  // Load Files Management
  const loadFilesList = async () => {
    try {
      setFilesLoading(true)
      const res = await adminService.getUploadedFilesList()
      setFilesList(res.data.files || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load uploaded files list')
    } finally {
      setFilesLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'files') {
      loadFilesList()
    }
  }, [activeTab])

  // Delete File Cleanup Helper
  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Are you sure you want to delete ${file.filename} from Cloudinary?`)) return
    try {
      await adminService.deleteFileAdmin({
        publicId: file.publicId,
        refId: file.refId,
        refModel: file.refModel
      })
      loadFilesList()
      loadAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file')
    }
  }

  // Load System Settings
  const loadSystemSettings = async () => {
    try {
      setSettingsLoading(true)
      const res = await adminService.getSystemSettings()
      setSettings(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSystemSettings()
    }
  }, [activeTab])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      setSettingsSaving(true)
      await adminService.updateSystemSettings(settings)
      alert('System settings updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update system settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Load System Logs content
  const loadSyslogContent = async () => {
    try {
      setSyslogLoading(true)
      const res = await adminService.getLogFileContent({ category: syslogCategory })
      setSyslogContent(res.data.content || 'No log lines found.')
    } catch (err) {
      setSyslogContent('Unable to read log file on server.')
    } finally {
      setSyslogLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'syslogs') {
      loadSyslogContent()
    }
  }, [activeTab, syslogCategory])

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
    if (activeTab !== 'settings') return
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

  // User Actions Helpers
  const handleEditUser = (user) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role || 'user')
  }

  const handleSaveEditUser = async (e) => {
    e.preventDefault()
    try {
      await adminService.updateUser(editingUser._id, {
        name: editName,
        email: editEmail,
        role: editRole
      })
      setEditingUser(null)
      setReloadUsersKey(current => current + 1)
      loadAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user')
    }
  }

  const handleVerifyEmail = async (user) => {
    if (!window.confirm(`Manually verify email for ${user.name}?`)) return
    try {
      await adminService.verifyUserEmail(user._id)
      setReloadUsersKey(current => current + 1)
      loadAnalytics()
      alert('Email marked as verified successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify email')
    }
  }

  const handleToggleStatus = async (user) => {
    const actionName = user.isActive === false ? 'activate' : 'deactivate'
    if (!window.confirm(`Are you sure you want to ${actionName} account for ${user.name}?`)) return
    try {
      await adminService.toggleUserStatus(user._id)
      setReloadUsersKey(current => current + 1)
      loadAnalytics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user status')
    }
  }

  const handleResetPassword = (user) => {
    setResetPwUser(user)
    setNewPassword('')
  }

  const handleSaveResetPassword = async (e) => {
    e.preventDefault()
    try {
      await adminService.resetUserPassword(resetPwUser._id, { password: newPassword })
      setResetPwUser(null)
      alert('Password reset completed successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password')
    }
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
      loadAnalytics()
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Failed to delete user.')
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered files list
  const filteredFiles = useMemo(() => {
    const term = filesSearch.toLowerCase().trim()
    if (!term) return filesList
    return filesList.filter(f => f.filename.toLowerCase().includes(term) || f.type.toLowerCase().includes(term))
  }, [filesList, filesSearch])

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
            <p>Track growth, activity, system settings, file usage, and audits from one focused view.</p>
          </div>
          <div className="dashboard-date">
            <span>Today</span>
            <strong>{formatDate(new Date())}</strong>
          </div>
        </section>

        {error && <div role="alert" className="alert alert--danger">{error}</div>}

        {/* Tab Controls */}
        <div className="flex border-b border-gray-300/60 mb-6 gap-6 reveal-item overflow-x-auto whitespace-nowrap pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Overview & Users
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'content' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Content Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'files' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            File Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'settings' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            System & AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('syslogs')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'syslogs' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Server Logs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'audit' ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Audit Trails
          </button>
        </div>

        {/* Tab 1: Overview & Users */}
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
              <UsersTable
                users={users}
                loading={usersLoading}
                deletingId={deletingId}
                onDelete={handleDelete}
                onEdit={handleEditUser}
                onToggleStatus={handleToggleStatus}
                onVerifyEmail={handleVerifyEmail}
                onResetPassword={handleResetPassword}
              />
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

        {/* Tab 2: Content Management */}
        {activeTab === 'content' && (
          <section className="users-panel reveal-item" aria-labelledby="content-heading">
            <div className="users-toolbar">
              <div className="users-heading">
                <span className="users-heading__icon" aria-hidden="true"><Layers3 size={20} /></span>
                <div>
                  <h2 id="content-heading">Content curation</h2>
                  <p>Browse and prune user created skills, topics, and progress history logs</p>
                </div>
              </div>

              <div className="filter-grid" aria-label="Content search bar">
                <div className="field-group field-group--search">
                  <label htmlFor="content-search">Search title or notes</label>
                  <div className="field-control">
                    <Search size={17} aria-hidden="true" />
                    <input
                      id="content-search"
                      value={contentSearch}
                      onChange={(e) => setContentSearch(e.target.value)}
                      placeholder="Type query to filter..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-200 mb-6 gap-6">
              <button
                type="button"
                onClick={() => { setContentTab('skills'); setContentPagination(c => ({ ...c, page: 1 })) }}
                className={`pb-2 font-bold text-sm transition border-b-2 ${contentTab === 'skills' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
              >
                Skills List
              </button>
              <button
                type="button"
                onClick={() => { setContentTab('topics'); setContentPagination(c => ({ ...c, page: 1 })) }}
                className={`pb-2 font-bold text-sm transition border-b-2 ${contentTab === 'topics' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
              >
                Topics List
              </button>
              <button
                type="button"
                onClick={() => { setContentTab('logs'); setContentPagination(c => ({ ...c, page: 1 })) }}
                className={`pb-2 font-bold text-sm transition border-b-2 ${contentTab === 'logs' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-500'}`}
              >
                Learning Logs
              </button>
            </div>

            {contentLoading ? (
              <div className="py-12 text-center text-gray-500 font-semibold">Loading contents list...</div>
            ) : (
              <>
                {contentTab === 'skills' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-55 text-gray-600 font-bold">
                          <th className="p-3">Skill Title</th>
                          <th className="p-3">Creator</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Progress</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skillsList.map(skill => (
                          <tr key={skill._id} className="border-b border-gray-150 hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-gray-800">{skill.title}</td>
                            <td className="p-3 text-gray-600">{skill.user?.name || 'Unknown'} ({skill.user?.email || 'N/A'})</td>
                            <td className="p-3 font-mono text-xs">{skill.category}</td>
                            <td className="p-3 font-bold text-emerald-600">{skill.progress}%</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSkill(skill._id)}
                                className="px-2 py-1 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {contentTab === 'topics' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-55 text-gray-600 font-bold">
                          <th className="p-3">Topic Title</th>
                          <th className="p-3">Belongs to Skill</th>
                          <th className="p-3">Creator</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topicsList.map(topic => (
                          <tr key={topic._id} className="border-b border-gray-150 hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-gray-800">{topic.title}</td>
                            <td className="p-3 text-gray-600 font-mono text-xs">{topic.skillId?.title || 'Unknown Skill'}</td>
                            <td className="p-3 text-gray-600">{topic.userId?.name || 'Unknown'}</td>
                            <td className="p-3 font-semibold">{topic.status}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteTopic(topic._id)}
                                className="px-2 py-1 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {contentTab === 'logs' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-55 text-gray-600 font-bold">
                          <th className="p-3">User</th>
                          <th className="p-3">Skill / Topic</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Study Notes Preview</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsList.map(log => (
                          <tr key={log._id} className="border-b border-gray-150 hover:bg-gray-50/50">
                            <td className="p-3 text-gray-700 font-semibold">{log.user?.name || 'Unknown'}</td>
                            <td className="p-3">
                              <div className="text-gray-850 font-medium">{log.topic?.title || 'N/A'}</div>
                              <div className="text-xs text-gray-500 font-mono">{log.skill?.title || 'N/A'}</div>
                            </td>
                            <td className="p-3 font-mono text-xs">{log.duration} mins</td>
                            <td className="p-3 text-gray-500 italic max-w-xs truncate">{log.notes || '(Empty notes)'}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log._id)}
                                className="px-2 py-1 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Pagination
                  pagination={contentPagination}
                  onPageChange={(page) => {
                    setContentPagination(current => ({ ...current, page }))
                  }}
                />
              </>
            )}
          </section>
        )}

        {/* Tab 3: File Management */}
        {activeTab === 'files' && (
          <section className="users-panel reveal-item" aria-labelledby="files-heading">
            <div className="users-toolbar">
              <div className="users-heading">
                <span className="users-heading__icon" aria-hidden="true"><HardDrive size={20} /></span>
                <div>
                  <h2 id="files-heading">File uploads inventory</h2>
                  <p>Review and clean up user avatars and notes attachments hosted on Cloudinary</p>
                </div>
              </div>

              <div className="filter-grid" aria-label="Files search filter">
                <div className="field-group field-group--search">
                  <label htmlFor="files-search">Search file names</label>
                  <div className="field-control">
                    <Search size={17} aria-hidden="true" />
                    <input
                      id="files-search"
                      value={filesSearch}
                      onChange={(e) => setFilesSearch(e.target.value)}
                      placeholder="Type file keyword..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {filesLoading ? (
              <div className="py-12 text-center text-gray-500 font-semibold">Scanning file repositories...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-semibold">No uploaded files matches this query.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-55 text-gray-600 font-bold">
                      <th className="p-3">File Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">File Size</th>
                      <th className="p-3">Cloudinary ID</th>
                      <th className="p-3">Owner Reference</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map(file => (
                      <tr key={file.id} className="border-b border-gray-150 hover:bg-gray-50/50">
                        <td className="p-3">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-600 hover:text-emerald-800 underline truncate block max-w-xs"
                          >
                            {file.filename}
                          </a>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            file.type === 'Avatar' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {file.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs">{Math.round((file.size / 1024) * 10) / 10} KB</td>
                        <td className="p-3 font-mono text-xs text-gray-450 truncate max-w-[120px]" title={file.publicId}>{file.publicId || 'N/A'}</td>
                        <td className="p-3 text-gray-600">
                          <div>{file.owner?.name || 'User'}</div>
                          <div className="text-xs text-gray-400 font-mono">{file.owner?.email || ''}</div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file)}
                            className="px-2.5 py-1 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition"
                          >
                            Purge File
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 4: System & AI Settings */}
        {activeTab === 'settings' && (
          <section className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Form Settings */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm reveal-item" style={{ '--reveal-delay': '50ms' }}>
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                  <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Settings size={20} /></span>
                  <h2 className="text-lg font-bold text-gray-800">System settings configs</h2>
                </div>

                {settingsLoading ? (
                  <div className="py-6 text-gray-400 font-semibold">Reading configs from backend...</div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label htmlFor="ai-provider" className="block text-xs font-bold text-gray-600 uppercase mb-1">Default AI Provider</label>
                      <div className="select-control">
                        <select
                          id="ai-provider"
                          value={settings.aiProvider}
                          onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                        >
                          <option value="gemini">Google Gemini AI</option>
                          <option value="openai">OpenAI ChatGPT</option>
                          <option value="claude">Anthropic Claude</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="upload-limit" className="block text-xs font-bold text-gray-600 uppercase mb-1">Max Upload Limits (MB)</label>
                      <input
                        type="number"
                        id="upload-limit"
                        value={settings.uploadLimitsMb}
                        onChange={(e) => setSettings({ ...settings, uploadLimitsMb: Number(e.target.value) })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="session-limit" className="block text-xs font-bold text-gray-600 uppercase mb-1">Max Learning Session (Mins)</label>
                      <input
                        type="number"
                        id="session-limit"
                        value={settings.sessionLimitsMinutes}
                        onChange={(e) => setSettings({ ...settings, sessionLimitsMinutes: Number(e.target.value) })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-bold transition flex justify-center items-center gap-2"
                    >
                      {settingsSaving ? 'Saving configs...' : 'Save configs'}
                    </button>
                  </form>
                )}
              </div>

              {/* Stats Usage Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm reveal-item" style={{ '--reveal-delay': '120ms' }}>
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                  <span className="p-2 bg-blue-50 rounded-lg text-blue-600"><Cpu size={20} /></span>
                  <h2 className="text-lg font-bold text-gray-800">AI Assistant usage stats</h2>
                </div>

                {systemLoading ? (
                  <div className="py-6 text-gray-400 font-semibold font-mono">Gathering analytics...</div>
                ) : aiStats.length === 0 ? (
                  <div className="py-6 text-gray-400 font-semibold font-mono text-center">No recorded AI usages logged yet.</div>
                ) : (
                  <div className="space-y-4">
                    {aiStats.map((stat, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <div>
                          <strong className="text-gray-800 capitalize font-bold text-sm block">{stat.type} prompt</strong>
                          <span className="text-xs text-gray-400 font-mono font-semibold block">{stat.provider} model engine</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 text-sm block">{stat.count} operations</span>
                          <span className="text-xs text-gray-400 block font-mono">Last used: {new Date(stat.lastUsed).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 5: System Logs Viewer */}
        {activeTab === 'syslogs' && (
          <section className="users-panel reveal-item" aria-labelledby="syslogs-heading">
            <div className="users-toolbar">
              <div className="users-heading">
                <span className="users-heading__icon" aria-hidden="true"><Terminal size={20} /></span>
                <div>
                  <h2 id="syslogs-heading">Active server log stream</h2>
                  <p>Examine real-time log files directly from the hosting server environment</p>
                </div>
              </div>

              <div className="filter-grid" aria-label="Syslogs filter toolbar">
                <div className="field-group">
                  <label htmlFor="syslog-select">Select Log Stream</label>
                  <div className="select-control">
                    <select
                      id="syslog-select"
                      value={syslogCategory}
                      onChange={(e) => setSyslogCategory(e.target.value)}
                    >
                      <option value="requests">API Requests (requests.log)</option>
                      <option value="errors">Exceptions & Failures (errors.log)</option>
                      <option value="auth">Security & Logins (auth.log)</option>
                      <option value="ai">AI Model Prompts (ai.log)</option>
                      <option value="uploads">Storage Uploads (uploads.log)</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>

            {syslogLoading ? (
              <div className="py-12 text-center text-gray-500 font-semibold font-mono">Streaming lines...</div>
            ) : (
              <div className="bg-gray-950 text-emerald-400 p-4 rounded-xl border border-gray-800 font-mono text-xs overflow-x-auto min-h-[300px] max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {syslogContent || '(This log file is currently empty)'}
              </div>
            )}
          </section>
        )}

        {/* Tab 6: Audit Logs */}
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
                      <option value="admin-update-user">Admin Update User</option>
                      <option value="admin-toggle-user-status">Admin Toggle Status</option>
                      <option value="admin-verify-user-email">Admin Manually Verify Email</option>
                      <option value="admin-reset-password">Admin Reset Password</option>
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
                    <tr className="border-b border-gray-300 bg-gray-100 text-gray-650 font-bold">
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
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-250 reveal-item">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Edit size={20} /> Edit User Details</h2>
            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">System Role</label>
                <div className="select-control">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold text-sm transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwUser && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-250 reveal-item">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={20} /> Reset User Password</h2>
            <p className="text-sm text-gray-500 mb-4">Set a new password for <strong>{resetPwUser.name}</strong> ({resetPwUser.email}).</p>
            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResetPwUser(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold text-sm transition"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
