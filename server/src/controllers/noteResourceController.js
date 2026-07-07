import Skill from '../models/Skill.js'
import { isRichTextBlank, sanitizeRichText } from '../utils/richText.js'

const resourceTypes = new Set(['article', 'video', 'course', 'documentation', 'tutorial', 'other'])

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

  if (!partial || body.url !== undefined) {
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

// ============== RESOURCES ==============

export const addResource = async (req, res, next) => {
  try {
    const { skillId, topicId } = req.params
    const result = await findTopicForUser({ userId: req.user.id, skillId, topicId })
    if (respondWithTopicError(res, result)) return

    const resource = normalizeResourcePayload(req.body)
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

    resource.deleteOne()
    await result.skill.save()

    res.json({ message: 'Resource deleted' })
  } catch (err) {
    next(err)
  }
}

