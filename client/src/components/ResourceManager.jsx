import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react'
import * as noteResourceService from '../services/noteResourceService'

const resourceTypes = [
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'course', label: 'Course' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'other', label: 'Other' },
]

const emptyForm = {
  title: '',
  url: '',
  type: 'article',
  description: '',
}

const normalizeHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || '').trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    return parsed.href
  } catch {
    return ''
  }
}

function ResourceForm({ form, errors, saving, editing, onChange, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-surface-raised p-4 text-left">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h6 className="font-semibold text-ink">{editing ? 'Edit resource' : 'Add resource'}</h6>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink hover:bg-emerald-pale"
        >
          <X size={15} className="mr-1 inline" aria-hidden="true" /> Cancel
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="resource-title">
            Title
          </label>
          <input
            id="resource-title"
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
            maxLength={200}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/10"
            placeholder="React docs"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="resource-url">
            URL
          </label>
          <input
            id="resource-url"
            value={form.url}
            onChange={(event) => onChange('url', event.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/10"
            placeholder="https://example.com"
          />
          {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="resource-type">
            Type
          </label>
          <select
            id="resource-type"
            value={form.type}
            onChange={(event) => onChange('type', event.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/10"
          >
            {resourceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="resource-description">
            Description
          </label>
          <textarea
            id="resource-description"
            value={form.description}
            onChange={(event) => onChange('description', event.target.value)}
            maxLength={500}
            className="h-24 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/10"
            placeholder="Short context"
          />
          <div className="mt-1 flex justify-between gap-2 text-xs">
            {errors.description ? (
              <p className="text-red-600">{errors.description}</p>
            ) : (
              <span className="text-ink-muted">{form.description.length}/500</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg bg-emerald-brand px-4 py-2 text-sm font-medium text-white hover:bg-emerald-brand hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save size={15} className="mr-1 inline" aria-hidden="true" /> {saving ? 'Saving...' : editing ? 'Update resource' : 'Save resource'}
      </button>
    </form>
  )
}

function ResourceItem({ resource, typeLabel, toggling, deleting, onEdit, onDelete, onToggleFavorite }) {
  const safeUrl = normalizeHttpUrl(resource.url)

  return (
    <div className="rounded-lg border border-line bg-white p-4 text-left shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-pale px-2.5 py-1 text-xs font-medium text-ink">
              {typeLabel}
            </span>
            {resource.favorite && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                Favorite
              </span>
            )}
          </div>
          <h6 className="break-words font-semibold text-ink">{resource.title}</h6>
          {resource.description && (
            <p className="mt-1 break-words text-sm leading-6 text-ink-soft">{resource.description}</p>
          )}
          <p className="mt-2 break-all text-xs text-ink-muted">{safeUrl || resource.url}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {safeUrl && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink size={15} className="mr-1 inline" aria-hidden="true" /> Open
            </a>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={toggling}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface-raised disabled:opacity-50"
          >
            <Star size={15} className="mr-1 inline" fill={resource.favorite ? 'currentColor' : 'none'} aria-hidden="true" /> {resource.favorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface-raised"
          >
            <Pencil size={15} className="mr-1 inline" aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} className="mr-1 inline" aria-hidden="true" /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResourceManager({ skillId, topicId, onUpdated }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [busyResourceId, setBusyResourceId] = useState(null)

  const typeLabels = useMemo(
    () => Object.fromEntries(resourceTypes.map((type) => [type.value, type.label])),
    [],
  )

  const fetchResources = async () => {
    try {
      setError('')
      const res = await noteResourceService.getResources(skillId, topicId)
      setResources(res.data.resources || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    const loadResources = async () => {
      try {
        const res = await noteResourceService.getResources(skillId, topicId)
        if (ignore) return
        setResources(res.data.resources || [])
        setError('')
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Failed to load resources.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadResources()
    return () => {
      ignore = true
    }
  }, [skillId, topicId])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const title = form.title.trim()
    const url = normalizeHttpUrl(form.url)

    if (!title) nextErrors.title = 'Title is required.'
    if (title.length > 200) nextErrors.title = 'Title must be 200 characters or less.'
    if (!url) nextErrors.url = 'Enter a valid http or https URL.'
    if (!resourceTypes.some((type) => type.value === form.type)) nextErrors.type = 'Choose a valid type.'
    if (form.description.length > 500) {
      nextErrors.description = 'Description must be 500 characters or less.'
    }

    setFormErrors(nextErrors)
    return { valid: Object.keys(nextErrors).length === 0, url }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setFormErrors({})
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const { valid, url } = validateForm()
    if (!valid) return

    const payload = {
      title: form.title.trim(),
      url,
      type: form.type,
      description: form.description.trim(),
    }

    try {
      setSaving(true)
      setError('')
      if (editingId) {
        await noteResourceService.updateResource(skillId, topicId, editingId, payload)
      } else {
        await noteResourceService.addResource(skillId, topicId, payload)
      }
      resetForm()
      await fetchResources()
      onUpdated?.()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save resource.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (resource) => {
    setForm({
      title: resource.title || '',
      url: resource.url || '',
      type: resource.type || 'other',
      description: resource.description || '',
    })
    setFormErrors({})
    setEditingId(resource._id)
    setShowForm(true)
  }

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return

    try {
      setBusyResourceId(resourceId)
      setError('')
      await noteResourceService.deleteResource(skillId, topicId, resourceId)
      await fetchResources()
      onUpdated?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resource.')
    } finally {
      setBusyResourceId(null)
    }
  }

  const handleToggleFavorite = async (resourceId) => {
    try {
      setBusyResourceId(resourceId)
      setError('')
      await noteResourceService.toggleResourceFavorite(skillId, topicId, resourceId)
      await fetchResources()
      onUpdated?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update favorite.')
    } finally {
      setBusyResourceId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {resources.length} resource{resources.length === 1 ? '' : 's'}
        </p>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-emerald-brand/20 px-3 py-2 text-sm font-medium text-emerald-dark-brand hover:bg-emerald-pale"
          >
            <Plus size={15} className="mr-1 inline" aria-hidden="true" /> Add resource
          </button>
        )}
      </div>

      {showForm && (
        <ResourceForm
          form={form}
          errors={formErrors}
          saving={saving}
          editing={Boolean(editingId)}
          onChange={updateForm}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}

      {loading ? (
        <div className="rounded-lg border border-line bg-surface-raised p-4 text-center text-sm text-ink-soft">
          Loading resources...
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface-raised p-4 text-center text-sm text-ink-soft">
          No resources yet.
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <ResourceItem
              key={resource._id}
              resource={resource}
              typeLabel={typeLabels[resource.type] || 'Other'}
              toggling={busyResourceId === resource._id}
              deleting={busyResourceId === resource._id}
              onEdit={() => startEdit(resource)}
              onDelete={() => handleDelete(resource._id)}
              onToggleFavorite={() => handleToggleFavorite(resource._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
