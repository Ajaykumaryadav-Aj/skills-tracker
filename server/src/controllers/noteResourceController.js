import fs from 'fs'
import path from 'path'
import Skill from '../models/Skill.js'
import { isRichTextBlank, sanitizeRichText } from '../utils/richText.js'
import { uploadStream, deleteFile } from '../services/storage.service.js'

const resourceTypes = new Set(['YouTube', 'Documentation', 'GitHub', 'Website', 'PDF', 'Course', 'article', 'video', 'course', 'documentation', 'tutorial', 'other'])

const badRequest = (message) => {
  const error = new Error(message)
  error.status = 400
  return error
}

const findTopicForUser = async ({ userId, skillId, topicId }) => {
  const skill = await Skill.findOne({ _id: skillId, user: userId })
  if (!skill) return { status: 404, message: 'Skill not found' }

  const topic = skill.topics.id(topicId)
  if (!topic) return { status: 404, message: 'Topic not found' }

  return { skill, topic }
}

const normalizeResourceUrl = (value) => {
  if (!value) return ''
  try {
    const parsed = new URL(String(value || '').trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw badRequest('Resource URL must use http or https')
    }
    return parsed.href
  } catch (err) {
    if (err.status) throw err
    throw badRequest('Resource URL must be valid')
  }
}

const normalizeResourcePayload = (body, { partial = false } = {}) => {
  const payload = {}

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim()
    if (!title) throw badRequest('Resource title is required')
    payload.title = title
  }

  if (!partial && !body.file && !body.url) throw badRequest('Resource URL or attachment is required')

  if ((!partial || body.url !== undefined) && !body.file) {
    payload.url = normalizeResourceUrl(body.url)
  }

  if (!partial || body.type !== undefined) {
    const type = body.type || 'other'
    if (!resourceTypes.has(type)) throw badRequest('Invalid resource type')
    payload.type = type
  }

  if (!partial || body.description !== undefined) {
    payload.description = String(body.description || '').trim()
  }

  if (body.favorite !== undefined) {
    payload.favorite = Boolean(body.favorite)
  }

  return payload
}

const normalizeTags = (value) => {
  const raw = Array.isArray(value) ? value : String(value || '').split(',')
  return Array.from(new Set(raw.map((tag) => String(tag).trim()).filter(Boolean))).slice(0, 12)
}

const normalizeNotePayload = (body, { partial = false } = {}) => {
  const payload = {}
  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim()
    if (!title) throw badRequest('Note title is required')
    payload.title = title
  }
  if (!partial || body.content !== undefined) {
    const content = String(body.content || '').trim()
    if (!content) throw badRequest('Note content is required')
    payload.content = content
  }
  if (body.tags !== undefined) payload.tags = normalizeTags(body.tags)
  if (body.pinned !== undefined) payload.pinned = Boolean(body.pinned)
  if (body.favorite !== undefined) payload.favorite = Boolean(body.favorite)
  return payload
}

const sortItems = (items, sort = 'updated-desc') => {
  const list = [...items]
  const direction = sort.endsWith('asc') ? 1 : -1
  if (sort.startsWith('title')) return list.sort((a, b) => String(a.title).localeCompare(String(b.title)) * direction)
  if (sort.startsWith('created')) return list.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt)) * direction)
  return list.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || ((new Date(a.updatedAt) - new Date(b.updatedAt)) * direction))
}

const paginateList = (items, query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50)
  const total = items.length
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  }
}

const filterNotes = (notes, query) => {
  const search = String(query.search || '').trim().toLowerCase()
  const tag = String(query.tag || '').trim().toLowerCase()
  const favorite = query.favorite === 'true'
  const pinned = query.pinned === 'true'
  return sortItems((notes || []).filter((note) => {
    const haystack = `${note.title || ''} ${note.content || ''} ${(note.tags || []).join(' ')}`.toLowerCase()
    if (search && !haystack.includes(search)) return false
    if (tag && !(note.tags || []).some((item) => String(item).toLowerCase() === tag)) return false
    if (favorite && !note.favorite) return false
    if (pinned && !note.pinned) return false
    return true
  }), query.sort)
}

const filterResources = (resources, query) => {
  const search = String(query.search || '').trim().toLowerCase()
  const type = String(query.type || '').trim()
  const favorite = query.favorite === 'true'
  return sortItems((resources || []).filter((resource) => {
    const haystack = `${resource.title || ''} ${resource.description || ''} ${resource.url || ''}`.toLowerCase()
    if (search && !haystack.includes(search)) return false
    if (type && resource.type !== type) return false
    if (favorite && !resource.favorite) return false
    return true
  }), query.sort)
}

const publicUploadPath = (filename) => `/uploads/knowledge/${filename}`

const removeUploadedFile = (filename) => {
  if (!filename) return
  const target = path.join(process.cwd(), 'uploads', 'knowledge', filename)
  fs.promises.unlink(target).catch(() => {})
}

const respondWithTopicError = (res, result) => {
  if (result.status) {
    res.status(result.status).json({ message: result.message })
    return true
  }
  return false
}

// ============== NOTES ==============

export const addNote = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const content = sanitizeRichText(req.body.content)
    if (isRichTextBlank(content)) throw badRequest('Note content is required')

    result.topic.notes = {
      content,
      updatedAt: new Date(),
    }

    await result.skill.save()
    res.status(201).json({ note: result.topic.notes, topic: result.topic })
  } catch (err) {
    next(err)
  }
}

export const getNote = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    res.json({ note: result.topic.notes || { content: '', updatedAt: null } })
  } catch (err) {
    next(err)
  }
}

export const updateNote = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const content = sanitizeRichText(req.body.content)
    if (isRichTextBlank(content)) throw badRequest('Note content cannot be empty')

    result.topic.notes = {
      content,
      updatedAt: new Date(),
    }

    await result.skill.save()
    res.json({ note: result.topic.notes, topic: result.topic })
  } catch (err) {
    next(err)
  }
}

export const deleteNote = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    result.topic.notes = { content: '', updatedAt: null }

    await result.skill.save()
    res.json({ note: result.topic.notes, message: 'Note deleted' })
  } catch (err) {
    next(err)
  }
}

// ============== KNOWLEDGE HUB NOTES ==============

export const getKnowledgeHub = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const notes = paginateList(filterNotes(result.topic.noteItems || [], req.query), req.query)
    const resources = paginateList(filterResources(result.topic.resources || [], req.query), req.query)
    res.json({
      notes: notes.items,
      resources: resources.items,
      pagination: { notes: notes.pagination, resources: resources.pagination },
    })
  } catch (err) {
    next(err)
  }
}

export const getNotes = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const notes = paginateList(filterNotes(result.topic.noteItems || [], req.query), req.query)
    res.json({ notes: notes.items, pagination: notes.pagination })
  } catch (err) {
    next(err)
  }
}

export const createNoteItem = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const note = normalizeNotePayload(req.body)
    result.topic.noteItems.push(note)
    await result.skill.save()
    res.status(201).json({ note: result.topic.noteItems[result.topic.noteItems.length - 1] })
  } catch (err) {
    next(err)
  }
}

export const updateNoteItem = async (req, res, next) => {
  try {
    const { skillId, topicId, noteId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const note = result.topic.noteItems.id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    Object.assign(note, normalizeNotePayload(req.body, { partial: true }))
    await result.skill.save()
    res.json({ note })
  } catch (err) {
    next(err)
  }
}

export const toggleNotePin = async (req, res, next) => {
  try {
    const { skillId, topicId, noteId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const note = result.topic.noteItems.id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.pinned = !note.pinned
    await result.skill.save()
    res.json({ note })
  } catch (err) {
    next(err)
  }
}

export const toggleNoteFavorite = async (req, res, next) => {
  try {
    const { skillId, topicId, noteId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const note = result.topic.noteItems.id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.favorite = !note.favorite
    await result.skill.save()
    res.json({ note })
  } catch (err) {
    next(err)
  }
}

export const deleteNoteItem = async (req, res, next) => {
  try {
    const { skillId, topicId, noteId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return
    const note = result.topic.noteItems.id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.deleteOne()
    await result.skill.save()
    res.json({ message: 'Note deleted' })
  } catch (err) {
    next(err)
  }
}

// ============== RESOURCES ==============

export const addResource = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    let filePayload = {}
    if (req.file) {
      // Validate size limits
      if (req.file.mimetype.startsWith('image/')) {
        if (req.file.size > 5 * 1024 * 1024) throw httpError(400, 'Image must be less than 5MB', 'IMAGE_TOO_LARGE')
      } else if (req.file.mimetype === 'application/pdf') {
        if (req.file.size > 10 * 1024 * 1024) throw httpError(400, 'PDF must be less than 10MB', 'PDF_TOO_LARGE')
      }

      const resType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image'
      const folderPath = req.file.mimetype === 'application/pdf' ? 'skills-tracker/pdfs' : 'skills-tracker/resources'

      const uploadResult = await uploadStream(req.file.buffer, {
        folder: folderPath,
        resourceType: resType,
        originalFilename: req.file.originalname
      })

      filePayload = {
        url: uploadResult.secureUrl,
        type: req.file.mimetype === 'application/pdf' ? 'PDF' : 'Website',
        file: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
          resourceType: uploadResult.resourceType,
          originalFilename: req.file.originalname,
          public_id: uploadResult.publicId,
          filename: '',
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: uploadResult.size || req.file.size,
        },
      }
    }

    const resource = { ...normalizeResourcePayload({ ...req.body, file: req.file }), ...filePayload }
    result.topic.resources.push(resource)

    await result.skill.save()
    res.status(201).json({ resource: result.topic.resources[result.topic.resources.length - 1] })
  } catch (err) {
    next(err)
  }
}

export const getResources = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    res.json({ resources: result.topic.resources || [] })
  } catch (err) {
    next(err)
  }
}

export const getResource = async (req, res, next) => {
  try {
    const { skillId, topicId, resourceId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const resource = result.topic.resources.id(resourceId)
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    res.json({ resource })
  } catch (err) {
    next(err)
  }
}

export const updateResource = async (req, res, next) => {
  try {
    const { skillId, topicId, resourceId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const resource = result.topic.resources.id(resourceId)
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    const updates = normalizeResourcePayload(req.body, { partial: true })
    if (req.file) {
      // Validate size limits
      if (req.file.mimetype.startsWith('image/')) {
        if (req.file.size > 5 * 1024 * 1024) throw httpError(400, 'Image must be less than 5MB', 'IMAGE_TOO_LARGE')
      } else if (req.file.mimetype === 'application/pdf') {
        if (req.file.size > 10 * 1024 * 1024) throw httpError(400, 'PDF must be less than 10MB', 'PDF_TOO_LARGE')
      }

      // Clean up old file
      const oldPublicId = resource.file?.publicId || resource.file?.public_id
      if (oldPublicId) {
        const oldResType = resource.file.resourceType || (resource.file.mimetype === 'application/pdf' ? 'raw' : 'image')
        await deleteFile(oldPublicId, { resourceType: oldResType }).catch(() => {})
      } else if (resource.file?.filename) {
        removeUploadedFile(resource.file.filename)
      }

      const resType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image'
      const folderPath = req.file.mimetype === 'application/pdf' ? 'skills-tracker/pdfs' : 'skills-tracker/resources'

      const uploadResult = await uploadStream(req.file.buffer, {
        folder: folderPath,
        resourceType: resType,
        originalFilename: req.file.originalname
      })

      updates.url = uploadResult.secureUrl
      updates.type = req.file.mimetype === 'application/pdf' ? 'PDF' : (updates.type || resource.type || 'Website')
      updates.file = {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
        resourceType: uploadResult.resourceType,
        originalFilename: req.file.originalname,
        public_id: uploadResult.publicId,
        filename: '',
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: uploadResult.size || req.file.size,
      }
    }
    Object.assign(resource, updates)

    await result.skill.save()
    res.json({ resource })
  } catch (err) {
    next(err)
  }
}

export const toggleResourceFavorite = async (req, res, next) => {
  try {
    const { skillId, topicId, resourceId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const resource = result.topic.resources.id(resourceId)
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    resource.favorite = !resource.favorite
    await result.skill.save()

    res.json({ resource })
  } catch (err) {
    next(err)
  }
}

export const deleteResource = async (req, res, next) => {
  try {
    const { skillId, topicId, resourceId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const resource = result.topic.resources.id(resourceId)
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    // Clean up old file
    const oldPublicId = resource.file?.publicId || resource.file?.public_id
    if (oldPublicId) {
      const oldResType = resource.file.resourceType || (resource.file.mimetype === 'application/pdf' ? 'raw' : 'image')
      await deleteFile(oldPublicId, { resourceType: oldResType }).catch(() => {})
    } else if (resource.file?.filename) {
      removeUploadedFile(resource.file.filename)
    }

    resource.deleteOne()
    await result.skill.save()

    res.json({ message: 'Resource deleted' })
  } catch (err) {
    next(err)
  }
}

export const getKnowledgeStats = async (req, res, next) => {
  try {
    const skills = await Skill.find({ user: req.user.id, deletedAt: null }).select('title topics.title topics.noteItems topics.resources').lean()
    const allNotes = []
    const favoriteResources = []
    let totalResources = 0
    skills.forEach((skill) => {
      ;(skill.topics || []).forEach((topic) => {
        ;(topic.noteItems || []).forEach((note) => allNotes.push({ ...note, skill: { _id: skill._id, title: skill.title }, topic: { _id: topic._id, title: topic.title } }))
        ;(topic.resources || []).forEach((resource) => {
          totalResources += 1
          if (resource.favorite) favoriteResources.push({ ...resource, skill: { _id: skill._id, title: skill.title }, topic: { _id: topic._id, title: topic.title } })
        })
      })
    })
    const recentlyUpdatedNotes = allNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
    res.json({
      totalNotes: allNotes.length,
      totalResources,
      recentlyUpdatedNotes,
      favoriteResources: favoriteResources.slice(0, 5),
    })
  } catch (err) {
    next(err)
  }
}

export const globalKnowledgeSearch = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const skills = await Skill.find({ user: req.user.id, deletedAt: null }).select('title topics.title topics.noteItems topics.resources').lean()
    const notes = []
    const resources = []
    skills.forEach((skill) => {
      ;(skill.topics || []).forEach((topic) => {
        ;(topic.noteItems || []).forEach((note) => {
          const haystack = `${note.title || ''} ${note.content || ''} ${(note.tags || []).join(' ')}`.toLowerCase()
          if (!search || haystack.includes(search)) notes.push({ ...note, skill: { _id: skill._id, title: skill.title }, topic: { _id: topic._id, title: topic.title } })
        })
        ;(topic.resources || []).forEach((resource) => {
          const haystack = `${resource.title || ''} ${resource.description || ''} ${resource.url || ''}`.toLowerCase()
          if (!search || haystack.includes(search)) resources.push({ ...resource, skill: { _id: skill._id, title: skill.title }, topic: { _id: topic._id, title: topic.title } })
        })
      })
    })
    res.json({ notes: notes.slice(0, 25), resources: resources.slice(0, 25) })
  } catch (err) {
    next(err)
  }
}
