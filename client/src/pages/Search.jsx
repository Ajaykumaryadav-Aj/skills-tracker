import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, X, BookOpenCheck, Bookmark, Clock, BookOpenText } from 'lucide-react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import { cn, ui } from '../utils/tw'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ skills: [], topics: [], notes: [], sessions: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = useCallback(async (searchQuery) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setResults({ skills: [], topics: [], notes: [], sessions: [] })
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await api.get('/search', { params: { q: trimmed } })
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform search')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  const totalResults = results.skills.length + results.topics.length + results.notes.length + results.sessions.length

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Global Search"
        title="Find anything"
        description="Search across all your learning skills, checklist topics, written notes, and study sessions."
        icon={SearchIcon}
      />

      <div className="relative flex items-center">
        <label htmlFor="global-search-input" className="sr-only">Search query</label>
        <SearchIcon className="absolute left-4 text-ink-muted" size={20} aria-hidden="true" />
        <input
          id="global-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search (e.g., React, Javascript, arrays)..."
          className="w-full rounded-panel border border-line bg-white py-4 pl-12 pr-12 text-base font-medium text-ink shadow-card outline-none transition focus:border-emerald-brand focus:ring-1 focus:ring-emerald-brand"
          aria-controls="search-results-region"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 grid size-8 place-items-center rounded-full text-ink-muted hover:bg-black/5 hover:text-ink transition"
            aria-label="Clear search input"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </div>
      )}

      <div id="search-results-region" aria-live="polite">
        {loading ? (
          <div className="grid gap-5">
            <div className="skeleton-shimmer h-12 rounded-card" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <span className="skeleton-shimmer h-32 rounded-card" />
              <span className="skeleton-shimmer h-32 rounded-card" />
              <span className="skeleton-shimmer h-32 rounded-card" />
            </div>
          </div>
        ) : query.trim() && totalResults === 0 ? (
          <div className="rounded-panel border border-dashed border-line-strong bg-white/70 py-16 text-center shadow-card">
            <p className="text-base font-bold text-ink-soft">No matches found for &ldquo;{query}&rdquo;</p>
            <p className="mt-1 text-sm text-ink-muted">Double check your spelling or search for broader keywords.</p>
          </div>
        ) : !query.trim() ? (
          <div className="rounded-panel border border-dashed border-line-strong bg-white/70 py-16 text-center shadow-card">
            <p className="text-base font-bold text-ink-soft">Start typing to search...</p>
            <p className="mt-1 text-sm text-ink-muted">Results will populate automatically as you type.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Skills Results */}
            {results.skills.length > 0 && (
              <section aria-labelledby="matched-skills-heading" className="grid gap-3">
                <h3 id="matched-skills-heading" className="text-xs font-extrabold uppercase tracking-wider text-emerald-dark-brand flex items-center gap-2">
                  <BookOpenCheck size={16} /> Skills ({results.skills.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.skills.map((skill) => (
                    <Link
                      key={skill._id}
                      to={`/skills/${skill._id}`}
                      className="group flex flex-col justify-between rounded-card border border-line bg-white p-4 transition hover:border-emerald-brand hover:shadow-card"
                    >
                      <div>
                        <h4 className="font-black text-ink group-hover:text-emerald-brand transition">{skill.title}</h4>
                        <p className="mt-1 text-xs text-ink-soft">{skill.category} &middot; {skill.difficulty || 'Beginner'}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                        <span className={cn(ui.badge.base, 'px-2 py-0.5')}>{skill.status}</span>
                        <span className="text-ink-soft">{skill.progress || 0}% completed</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Topics Results */}
            {results.topics.length > 0 && (
              <section aria-labelledby="matched-topics-heading" className="grid gap-3">
                <h3 id="matched-topics-heading" className="text-xs font-extrabold uppercase tracking-wider text-emerald-dark-brand flex items-center gap-2">
                  <Bookmark size={16} /> Topics ({results.topics.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.topics.map((topic) => (
                    <Link
                      key={topic._id}
                      to={`/skills/${topic.skillId?._id || topic.skillId}`}
                      className="group flex flex-col justify-between rounded-card border border-line bg-white p-4 transition hover:border-emerald-brand hover:shadow-card"
                    >
                      <div>
                        <h4 className="font-black text-ink group-hover:text-emerald-brand transition">{topic.title}</h4>
                        {topic.skillId && (
                          <p className="mt-1 text-xs text-ink-soft">Skill: {topic.skillId.title}</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                        <span className={cn(ui.badge.base, 'px-2 py-0.5')}>{topic.status}</span>
                        <span className="text-ink-muted">Priority: {topic.priority}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Notes Results */}
            {results.notes.length > 0 && (
              <section aria-labelledby="matched-notes-heading" className="grid gap-3">
                <h3 id="matched-notes-heading" className="text-xs font-extrabold uppercase tracking-wider text-emerald-dark-brand flex items-center gap-2">
                  <BookOpenText size={16} /> Notes ({results.notes.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.notes.map((note) => (
                    <Link
                      key={note._id}
                      to={`/skills/${note.skill?._id}`}
                      className="group flex flex-col justify-between rounded-card border border-line bg-white p-4 transition hover:border-emerald-brand hover:shadow-card"
                    >
                      <div>
                        <h4 className="font-black text-ink group-hover:text-emerald-brand transition">{note.title}</h4>
                        <p className="mt-2 text-xs text-ink-soft line-clamp-3 bg-surface-raised p-2 rounded border border-line/60">
                          {note.content?.replace(/<[^>]*>/g, '') || 'No content preview.'}
                        </p>
                      </div>
                      <div className="mt-3 text-xs text-ink-muted flex justify-between">
                        <span>Skill: {note.skill?.title}</span>
                        <span>Topic: {note.topic?.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Sessions Results */}
            {results.sessions.length > 0 && (
              <section aria-labelledby="matched-sessions-heading" className="grid gap-3">
                <h3 id="matched-sessions-heading" className="text-xs font-extrabold uppercase tracking-wider text-emerald-dark-brand flex items-center gap-2">
                  <Clock size={16} /> Study Sessions ({results.sessions.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.sessions.map((session) => (
                    <Link
                      key={session._id}
                      to="/logs"
                      className="group flex flex-col justify-between rounded-card border border-line bg-white p-4 transition hover:border-emerald-brand hover:shadow-card"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={cn(ui.badge.base, 'bg-emerald-pale text-emerald-dark-brand px-2 py-0.5')}>{session.sessionType || 'Study'}</span>
                          <span className="text-xs text-ink-muted">{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-ink-soft">Duration: {session.duration} minutes</p>
                        {session.notes && (
                          <p className="mt-2 text-xs italic text-ink-muted bg-surface-raised p-2 rounded border border-line/60 line-clamp-2">
                            &ldquo;{session.notes}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-ink-muted flex justify-between">
                        <span>Skill: {session.skill?.title}</span>
                        <span>Topic: {session.topic?.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
