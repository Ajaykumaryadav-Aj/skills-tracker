import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  Copy,
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as skillService from '../services/skillService'

const defaultFilters = { search: '', status: '', category: '', difficulty: '', topicStatus: '', archived: 'false', favorite: '', sort: 'newest', page: 1, limit: 10 }
const fallbackFilterOptions = {
  categories: [],
  statuses: ['Not Started', 'Learning', 'Completed', 'Paused'],
  difficulties: ['Beginner', 'Intermediate', 'Advanced'],
  topicStatuses: ['Not Started', 'Learning', 'Revision', 'Completed'],
}
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'progress-desc', label: 'Progress high to low' },
  { value: 'title-asc', label: 'A-Z' },
]
const pageSizeOptions = [6, 10, 20, 50]
const formatDate = (date) => (date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set')
const statusClass = (status) => ({
  'Not Started': 'status-badge--idle',
  Learning: 'status-badge--active',
  Paused: 'status-badge--revision',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')
const topicClass = (status) => ({
  'Not Started': 'status-badge--idle',
  Learning: 'status-badge--active',
  Revision: 'status-badge--revision',
  Completed: 'status-badge--complete',
}[status] || 'status-badge--idle')

const buildQueryParams = (filters) => {
  const params = { page: filters.page, limit: filters.limit, sort: filters.sort }
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.difficulty) params.difficulty = filters.difficulty
  if (filters.topicStatus) params.topicStatus = filters.topicStatus
  if (filters.archived) params.archived = filters.archived
  if (filters.favorite) params.favorite = filters.favorite
  return params
}

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="field-control">
        <select id={id} value={value} onChange={onChange}>{children}</select>
        <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
      </div>
    </div>
  )
}

function Pagination({ pagination, onPageChange }) {
  const pages = useMemo(() => {
    const totalPages = pagination.totalPages || 1
    const current = pagination.page || 1
    const start = Math.max(1, current - 2)
    const end = Math.min(totalPages, current + 2)
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [pagination.page, pagination.totalPages])

  if (!pagination.total || pagination.totalPages <= 1) return null
  const startItem = (pagination.page - 1) * pagination.limit + 1
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <nav className="pagination" aria-label="Skills pagination">
      <p>Showing <strong>{startItem}-{endItem}</strong> of {pagination.total}</p>
      <div className="pagination__controls">
        <button type="button" onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrevPage} className="page-direction" aria-label="Previous page">
          <ArrowLeft size={16} /><span>Prev</span>
        </button>
        {pages.map((page) => (
          <button key={page} type="button" onClick={() => onPageChange(page)} aria-current={page === pagination.page ? 'page' : undefined} className={`page-number ${page === pagination.page ? 'page-number--active' : ''}`}>
            {page}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNextPage} className="page-direction" aria-label="Next page">
          <span>Next</span><ArrowRight size={16} />
        </button>
      </div>
    </nav>
  )
}

function SkillCard({ skill, onDelete, onFavorite, onArchive, onDuplicate, delay, view }) {
  const progress = Math.min(100, Math.max(0, Number(skill.progress) || 0))

  return (
    <article className={`skill-card ${view === 'list' ? 'skill-card--list' : ''} reveal-item`} style={{ '--reveal-delay': `${delay}ms`, '--skill-accent': skill.color || '#087f62' }}>
      <div className="skill-card__accent" aria-hidden="true" />
      <div className="skill-card__header">
        <div className="skill-card__title"><span aria-hidden="true"><BookOpenCheck size={19} /></span><div><h2>{skill.title}</h2><p>{skill.category} · {skill.difficulty || 'Beginner'}</p></div></div>
        <span className={`status-badge ${statusClass(skill.status)}`}>{skill.status}</span>
      </div>
      <p className="skill-card__description">{skill.description || 'No description added.'}</p>

      <div className="skill-card__progress">
        <div><span>Progress</span><strong>{progress}%</strong></div>
        <div className="progress-track"><i className="progress-fill" style={{ '--progress': `${progress}%` }} /></div>
      </div>

      {skill.matchingTopics?.length > 0 && (
        <div className="matching-topics">
          <p>Matching topics</p>
          <div>{skill.matchingTopics.map((topic) => <span key={topic._id} className={`status-badge ${topicClass(topic.status)}`}>{topic.title}</span>)}</div>
        </div>
      )}

      <div className="skill-card__meta">
        <span><CalendarDays size={15} /> Target {formatDate(skill.targetCompletionDate || skill.targetDate)}</span>
        {skill.estimatedHours ? <span>{skill.estimatedHours}h estimated</span> : null}
        <span>Updated {formatDate(skill.updatedAt)}</span>
      </div>
      <div className="skill-card__actions">
        <Link to={`/skills/${skill._id}`} className="button button--secondary"><Eye size={16} /> Details</Link>
        <Link to={`/skills/${skill._id}/edit`} className="button button--primary"><Pencil size={16} /> Edit</Link>
        <button type="button" onClick={() => onFavorite(skill)} className="button button--secondary"><Star size={16} /> {skill.isFavorite ? 'Unfavorite' : 'Favorite'}</button>
        <button type="button" onClick={() => onArchive(skill)} className="button button--secondary"><Archive size={16} /> {skill.isArchived ? 'Unarchive' : 'Archive'}</button>
        <button type="button" onClick={() => onDuplicate(skill._id)} className="button button--secondary"><Copy size={16} /> Duplicate</button>
        <button type="button" onClick={() => onDelete(skill._id)} className="button button--danger"><Trash2 size={16} /> Delete</button>
      </div>
    </article>
  )
}

export default function Skills() {
  const [skills, setSkills] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [filterOptions, setFilterOptions] = useState(fallbackFilterOptions)
  const [view, setView] = useState('grid')
  const [pagination, setPagination] = useState({ page: 1, limit: defaultFilters.limit, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const queryParams = useMemo(() => buildQueryParams(filters), [filters])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim()
      setFilters((current) => current.search === nextSearch && current.page === 1 ? current : { ...current, search: nextSearch, page: 1 })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let ignore = false
    const loadSkills = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await skillService.getAllSkills(queryParams)
        if (ignore) return
        setSkills(res.data.skills || [])
        setPagination(res.data.pagination || { page: queryParams.page, limit: queryParams.limit, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false })
        setFilterOptions({
          categories: res.data.filters?.categories || [],
          statuses: res.data.filters?.statuses || fallbackFilterOptions.statuses,
          difficulties: res.data.filters?.difficulties || fallbackFilterOptions.difficulties,
          topicStatuses: res.data.filters?.topicStatuses || fallbackFilterOptions.topicStatuses,
        })
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load skills')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadSkills()
    return () => { ignore = true }
  }, [queryParams, reloadKey])

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: field === 'limit' ? Number(value) : value, page: 1 }))
  const clearFilters = () => { setSearchInput(''); setFilters(defaultFilters) }
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === filters.page) return
    setFilters((current) => ({ ...current, page }))
  }
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this skill?')) return
    try {
      await skillService.deleteSkill(id)
      if (skills.length === 1 && filters.page > 1) setFilters((current) => ({ ...current, page: current.page - 1 }))
      else setReloadKey((current) => current + 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    }
  }
  const handleFavorite = async (skill) => {
    setSkills((current) => current.map((item) => item._id === skill._id ? { ...item, isFavorite: !item.isFavorite } : item))
    try { await skillService.toggleFavoriteSkill(skill._id, { isFavorite: !skill.isFavorite }) } catch { setReloadKey((current) => current + 1) }
  }
  const handleArchive = async (skill) => {
    setSkills((current) => current.filter((item) => item._id !== skill._id))
    try { await skillService.toggleArchiveSkill(skill._id, { isArchived: !skill.isArchived }) } catch { setReloadKey((current) => current + 1) }
  }
  const handleDuplicate = async (id) => {
    try {
      await skillService.duplicateSkill(id)
      setReloadKey((current) => current + 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Duplicate failed')
    }
  }

  const categoryOptions = filterOptions.categories.includes(filters.category) || !filters.category
    ? filterOptions.categories
    : [filters.category, ...filterOptions.categories]
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.category || filters.topicStatus)

  return (
    <div className="skills-page">
      <PageHeader
        eyebrow="Learning library"
        title="My skills"
        description={`${pagination.total} result${pagination.total === 1 ? '' : 's'} across your learning workspace.`}
        icon={BookOpenCheck}
        actions={<Link to="/skills/new" className="button button--primary"><Plus size={17} /> Add skill</Link>}
      />

      <section className="filter-panel reveal-item" aria-labelledby="skill-filters-heading">
        <div className="filter-panel__heading"><Filter size={18} /><div><h2 id="skill-filters-heading">Search and filters</h2><p>Results update as you search.</p></div></div>
        <div className="skill-filter-grid">
          <div className="skill-filter-search">
            <label className="field-label" htmlFor="skill-search">Search</label>
            <div className="field-control field-control--icon"><Search size={17} /><input id="skill-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search skills or topics" /></div>
          </div>
          <SelectField id="skill-sort" label="Sort" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectField>
          <SelectField id="skill-view" label="View" value={view} onChange={(event) => setView(event.target.value)}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </SelectField>
          <SelectField id="page-size" label="Page size" value={filters.limit} onChange={(event) => updateFilter('limit', event.target.value)}>
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size} per page</option>)}
          </SelectField>
          <SelectField id="skill-status" label="Skill status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">All statuses</option>{filterOptions.statuses.map((status) => <option key={status}>{status}</option>)}
          </SelectField>
          <SelectField id="skill-category" label="Category" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
            <option value="">All categories</option>{categoryOptions.map((category) => <option key={category}>{category}</option>)}
          </SelectField>
          <SelectField id="skill-difficulty" label="Difficulty" value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}>
            <option value="">All difficulties</option>{filterOptions.difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
          </SelectField>
          <SelectField id="skill-favorite" label="Favorite" value={filters.favorite} onChange={(event) => updateFilter('favorite', event.target.value)}>
            <option value="">All skills</option><option value="true">Favorites</option><option value="false">Not favorite</option>
          </SelectField>
          <SelectField id="skill-archived" label="Archive" value={filters.archived} onChange={(event) => updateFilter('archived', event.target.value)}>
            <option value="false">Active only</option><option value="true">Include archived</option>
          </SelectField>
          <SelectField id="topic-status" label="Topic status" value={filters.topicStatus} onChange={(event) => updateFilter('topicStatus', event.target.value)}>
            <option value="">All topic statuses</option>{filterOptions.topicStatuses.map((status) => <option key={status}>{status}</option>)}
          </SelectField>
        </div>
        {hasActiveFilters && <button type="button" onClick={clearFilters} className="clear-filters"><RotateCcw size={15} /> Clear filters</button>}
      </section>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}

      {loading && skills.length === 0 ? (
        <div className="skills-list" role="status" aria-label="Loading skills">{Array.from({ length: 3 }).map((_, index) => <div className="skeleton-skill" key={index} />)}</div>
      ) : skills.length === 0 ? (
        <div className="empty-state"><BookOpenCheck size={25} /><p>{hasActiveFilters ? 'No skills match these filters.' : 'No skills yet. Add one to get started.'}</p></div>
      ) : (
        <div className={`skills-list skills-list--${view} ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
          {skills.map((skill, index) => (
            <SkillCard
              key={skill._id}
              skill={skill}
              onDelete={handleDelete}
              onFavorite={handleFavorite}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate}
              delay={index * 60}
              view={view}
            />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </div>
  )
}
