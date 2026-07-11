import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
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
import { cn, statusTone, ui } from '../utils/tw'

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
      <label className={ui.field.label} htmlFor={id}>{label}</label>
      <div className={ui.field.control}>
        <select className={ui.field.input} id={id} value={value} onChange={onChange}>{children}</select>
        <ChevronDown className="shrink-0 text-ink-muted" size={16} aria-hidden="true" />
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
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-4 text-sm text-ink-soft shadow-card" aria-label="Skills pagination">
      <p>Showing <strong className="text-ink">{startItem}-{endItem}</strong> of {pagination.total}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPrevPage} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}>Prev</button>
        {pages.map((page) => (
          <button key={page} type="button" onClick={() => onPageChange(page)} aria-current={page === pagination.page ? 'page' : undefined} className={cn('grid min-h-9 min-w-9 place-items-center rounded-card border px-3 text-sm font-black transition', page === pagination.page ? 'border-emerald-brand bg-emerald-brand text-white' : 'border-line bg-white text-ink hover:border-emerald-brand hover:bg-emerald-pale')}>
            {page}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNextPage} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}>Next</button>
      </div>
    </nav>
  )
}

function SkillCard({ skill, onDelete, onFavorite, onArchive, onDuplicate, delay, view }) {
  const progress = Math.min(100, Math.max(0, Number(skill.progress) || 0))

  return (
    <article className={cn(ui.card, 'reveal-item relative grid gap-4 overflow-hidden p-5', view === 'list' && 'lg:grid-cols-[minmax(0,1fr)_260px]')} style={{ '--reveal-delay': `${delay}ms` }}>
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: skill.color || '#087f62' }} aria-hidden="true" />
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-card bg-emerald-pale text-emerald-dark-brand" aria-hidden="true"><BookOpenCheck size={19} /></span>
          <div className="min-w-0"><h2 className="truncate text-lg font-black text-ink">{skill.title}</h2><p className="mt-1 text-sm text-ink-soft">{skill.category} · {skill.difficulty || 'Beginner'}</p></div>
        </div>
        <span className={cn(ui.badge.base, statusTone(skill.status))}>{skill.status}</span>
      </div>

      <p className="text-sm leading-6 text-ink-soft">{skill.description || 'No description added.'}</p>

      <div className="grid gap-2">
        <div className="flex items-center justify-between text-sm"><span className="text-ink-soft">Progress</span><strong className="text-ink">{progress}%</strong></div>
        <div className="h-2 overflow-hidden rounded-full bg-line"><i className="block h-full rounded-full bg-emerald-brand transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      {skill.matchingTopics?.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Matching topics</p>
          <div className="flex flex-wrap gap-2">{skill.matchingTopics.map((topic) => <span key={topic._id} className={cn(ui.badge.base, statusTone(topic.status))}>{topic.title}</span>)}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
        <span className="inline-flex items-center gap-1"><CalendarDays size={15} /> Target {formatDate(skill.targetCompletionDate || skill.targetDate)}</span>
        {skill.estimatedHours ? <span>{skill.estimatedHours}h estimated</span> : null}
        <span>Updated {formatDate(skill.updatedAt)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={`/skills/${skill._id}`} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}><Eye size={16} /> Details</Link>
        <Link to={`/skills/${skill._id}/edit`} className={cn(ui.button.base, ui.button.primary, 'min-h-9 px-3')}><Pencil size={16} /> Edit</Link>
        <button type="button" onClick={() => onFavorite(skill)} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}><Star size={16} /> {skill.isFavorite ? 'Unfavorite' : 'Favorite'}</button>
        <button type="button" onClick={() => onArchive(skill)} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}><Archive size={16} /> {skill.isArchived ? 'Unarchive' : 'Archive'}</button>
        <button type="button" onClick={() => onDuplicate(skill._id)} className={cn(ui.button.base, ui.button.secondary, 'min-h-9 px-3')}><Copy size={16} /> Duplicate</button>
        <button type="button" onClick={() => onDelete(skill._id)} className={cn(ui.button.base, ui.button.danger, 'min-h-9 px-3')}><Trash2 size={16} /> Delete</button>
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
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Learning library"
        title="My skills"
        description={`${pagination.total} result${pagination.total === 1 ? '' : 's'} across your learning workspace.`}
        icon={BookOpenCheck}
        actions={<Link to="/skills/new" className={cn(ui.button.base, ui.button.primary)}><Plus size={17} /> Add skill</Link>}
      />

      <section className={cn(ui.panel, 'reveal-item grid gap-4')} aria-labelledby="skill-filters-heading">
        <div className="flex items-start gap-3"><Filter size={18} className="mt-1 text-emerald-dark-brand" /><div><h2 id="skill-filters-heading" className="text-lg font-black text-ink">Search and filters</h2><p className="mt-1 text-sm text-ink-soft">Results update as you search.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2">
            <label className={ui.field.label} htmlFor="skill-search">Search</label>
            <div className={ui.field.control}><Search size={17} className="shrink-0 text-ink-muted" /><input className={ui.field.input} id="skill-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search skills or topics" /></div>
          </div>
          <SelectField id="skill-sort" label="Sort" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField>
          <SelectField id="skill-view" label="View" value={view} onChange={(event) => setView(event.target.value)}><option value="grid">Grid</option><option value="list">List</option></SelectField>
          <SelectField id="page-size" label="Page size" value={filters.limit} onChange={(event) => updateFilter('limit', event.target.value)}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size} per page</option>)}</SelectField>
          <SelectField id="skill-status" label="Skill status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option>{filterOptions.statuses.map((status) => <option key={status}>{status}</option>)}</SelectField>
          <SelectField id="skill-category" label="Category" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}><option value="">All categories</option>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</SelectField>
          <SelectField id="skill-difficulty" label="Difficulty" value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="">All difficulties</option>{filterOptions.difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</SelectField>
          <SelectField id="skill-favorite" label="Favorite" value={filters.favorite} onChange={(event) => updateFilter('favorite', event.target.value)}><option value="">All skills</option><option value="true">Favorites</option><option value="false">Not favorite</option></SelectField>
          <SelectField id="skill-archived" label="Archive" value={filters.archived} onChange={(event) => updateFilter('archived', event.target.value)}><option value="false">Active only</option><option value="true">Include archived</option></SelectField>
          <SelectField id="topic-status" label="Topic status" value={filters.topicStatus} onChange={(event) => updateFilter('topicStatus', event.target.value)}><option value="">All topic statuses</option>{filterOptions.topicStatuses.map((status) => <option key={status}>{status}</option>)}</SelectField>
        </div>
        {hasActiveFilters && <button type="button" onClick={clearFilters} className={cn(ui.button.base, ui.button.secondary, 'w-fit')}><RotateCcw size={15} /> Clear filters</button>}
      </section>

      {error && <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      {loading && skills.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading skills">{Array.from({ length: 3 }).map((_, index) => <div className="skeleton-shimmer h-64 rounded-panel" key={index} />)}</div>
      ) : skills.length === 0 ? (
        <div className={ui.empty}><BookOpenCheck size={25} /><p>{hasActiveFilters ? 'No skills match these filters.' : 'No skills yet. Add one to get started.'}</p></div>
      ) : (
        <div className={cn('grid gap-4', view === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1', loading && 'opacity-70')} aria-busy={loading}>
          {skills.map((skill, index) => (
            <SkillCard key={skill._id} skill={skill} onDelete={handleDelete} onFavorite={handleFavorite} onArchive={handleArchive} onDuplicate={handleDuplicate} delay={index * 60} view={view} />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </div>
  )
}
