import Skill, { SKILL_DIFFICULTIES, SKILL_STATUSES } from '../models/Skill.js'
import Topic from '../models/Topic.js'
import Revision from '../models/Revision.js'
import Activity from '../models/Activity.js'
import { generateRevisionScheduleForTopic } from '../services/revision.service.js'
import { awardXp, evaluateAchievements } from '../services/gamification.service.js'
import { logAuditEvent } from '../utils/auditLogger.js'

const skillStatusOptions = SKILL_STATUSES
const topicStatusOptions = ['Not Started', 'Learning', 'Revision', 'Completed']
const maxPageLimit = 50

const sortOptions = {
  latest: { createdAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'progress-desc': { progress: -1, updatedAt: -1 },
  progress: { progress: -1, updatedAt: -1 },
  'progress-asc': { progress: 1, updatedAt: -1 },
  'title-asc': { title: 1, updatedAt: -1 },
  az: { title: 1, updatedAt: -1 },
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'skill'

const ownerFilter = (userId, extra = {}) => ({
  ...extra,
  deletedAt: null,
  $or: [{ userId }, { user: userId }],
})

const topicOwnerFilter = (userId, skillId, extra = {}) => ({
  ...extra,
  userId,
  skillId,
  deletedAt: null,
})

const normalizeStatus = (status) => {
  if (status === 'Not started') return 'Not Started'
  if (status === 'In progress') return 'Learning'
  return status
}

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

const normalizeSkillPayload = (body) => {
  const targetCompletionDate = body.targetCompletionDate ?? body.targetDate
  const payload = {}
  const stringFields = ['title', 'description', 'category', 'icon', 'color', 'difficulty', 'status']
  stringFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field] || '').trim()
  })
  if (payload.status) payload.status = normalizeStatus(payload.status)
  if (targetCompletionDate !== undefined) {
    payload.targetCompletionDate = targetCompletionDate ? new Date(targetCompletionDate) : null
    payload.targetDate = payload.targetCompletionDate
  }
  if (body.estimatedHours !== undefined && body.estimatedHours !== '') payload.estimatedHours = Number(body.estimatedHours)
  if (body.progress !== undefined && body.progress !== '') payload.progress = Math.min(100, Math.max(0, Number(body.progress)))
  if (body.isFavorite !== undefined) payload.isFavorite = toBoolean(body.isFavorite)
  if (body.isArchived !== undefined) payload.isArchived = toBoolean(body.isArchived)
  return payload
}

const normalizeTopicPayload = (body) => {
  const payload = {}
  const stringFields = ['title', 'description', 'status', 'priority']
  stringFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field] || '').trim()
  })
  if (body.estimatedHours !== undefined && body.estimatedHours !== '') payload.estimatedHours = Number(body.estimatedHours)
  if (body.actualHours !== undefined && body.actualHours !== '') payload.actualHours = Number(body.actualHours)
  if (body.order !== undefined && body.order !== '') payload.order = Number(body.order)
  if (body.dueDate !== undefined) payload.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (payload.status === 'Completed') payload.completedAt = new Date()
  if (payload.status && payload.status !== 'Completed') payload.completedAt = null
  return payload
}

const topicMirrorPayload = (topic) => ({
  _id: topic._id,
  title: topic.title,
  description: topic.description || '',
  status: topic.status,
  priority: topic.priority || 'Medium',
  estimatedHours: topic.estimatedHours || 0,
  actualHours: topic.actualHours || 0,
  order: topic.order || 0,
  dueDate: topic.dueDate || null,
  completedAt: topic.completedAt || null,
  notes: topic.notes || { content: '', updatedAt: null },
  resources: topic.resources || [],
})

const hydrateTopicFromSkill = (topic, skill) => {
  const embeddedTopic = skill.topics.id(topic._id)
  if (!embeddedTopic) return topic
  const plainEmbedded = embeddedTopic.toObject ? embeddedTopic.toObject() : embeddedTopic
  return {
    ...topic,
    notes: plainEmbedded.notes || { content: '', updatedAt: null },
    resources: plainEmbedded.resources || [],
  }
}

const getSkillForUser = (userId, skillId) => Skill.findOne(ownerFilter(userId, { _id: skillId }))

const syncSkillProgress = async (skill) => {
  skill.topics.sort((a, b) => (a.order || 0) - (b.order || 0))
  skill.recalculateProgress()
  await skill.save()
  return skill
}

const ensureTopicDocuments = async (skill) => {
  const existingIds = new Set(
    (await Topic.find(topicOwnerFilter(String(skill.userId || skill.user), skill._id)).select('_id').lean())
      .map((topic) => String(topic._id)),
  )
  const missing = (skill.topics || []).filter((topic) => !existingIds.has(String(topic._id)))
  if (!missing.length) return
  await Topic.insertMany(missing.map((topic, index) => ({
    _id: topic._id,
    skillId: skill._id,
    userId: skill.userId || skill.user,
    title: topic.title,
    description: topic.description || '',
    status: topic.status || 'Not Started',
    priority: topic.priority || 'Medium',
    estimatedHours: topic.estimatedHours || 0,
    actualHours: topic.actualHours || 0,
    order: topic.order ?? index,
    dueDate: topic.dueDate || null,
    completedAt: topic.completedAt || null,
  })))
}

const uniqueSlugForUser = async ({ userId, title, excludeId }) => {
  const base = slugify(title)
  let slug = base
  let suffix = 1
  while (await Skill.exists({
    ...ownerFilter(userId, { slug }),
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })) {
    suffix += 1
    slug = `${base}-${suffix}`
  }
  return slug
}

const buildPagination = ({ page, limit, total, isPaginated }) => {
  const effectiveLimit = isPaginated ? limit : total || limit
  const totalPages = isPaginated ? Math.max(Math.ceil(total / limit), 1) : 1

  return {
    page: isPaginated ? page : 1,
    limit: effectiveLimit,
    total,
    totalPages,
    hasNextPage: isPaginated && page < totalPages,
    hasPrevPage: isPaginated && page > 1,
  }
}

export const createSkill = async (req, res, next) => {
  try {
    const payload = normalizeSkillPayload(req.body)
    const skill = await Skill.create({
      user: req.user.id,
      userId: req.user.id,
      ...payload,
      slug: await uniqueSlugForUser({ userId: req.user.id, title: payload.title }),
    })
    await awardXp({
      userId: req.user.id,
      action: 'CREATE_SKILL',
      sourceType: 'skill',
      sourceId: skill._id,
      eventKey: `skill:create:${skill._id}`,
    })
    await Activity.create({
      userId: req.user.id,
      type: 'skill-created',
      title: `Created skill ${skill.title}`,
      description: skill.category,
      sourceType: 'skill',
      sourceId: skill._id,
    }).catch(() => null)

    await logAuditEvent(req, req.user.id, 'skill-create', { skillId: skill._id, title: skill.title })

    res.status(201).json({ skill })
  } catch (err) {
    next(err)
  }
}

export const getSkills = async (req, res, next) => {
  try {
    const {
      search = '',
      status = '',
      category = '',
      difficulty = '',
      topicStatus = '',
      archived = 'false',
      favorite = '',
      sort = 'latest',
      page: requestedPage,
      limit: requestedLimit,
    } = req.query

    const searchTerm = String(search).trim()
    const selectedStatus = String(status).trim()
    const selectedCategory = String(category).trim()
    const selectedDifficulty = String(difficulty).trim()
    const selectedTopicStatus = String(topicStatus).trim()
    const selectedSort = sortOptions[sort] ? sort : 'latest'
    const includeArchived = String(archived) === 'true'
    const selectedFavorite = String(favorite).trim()
    const isPaginated = ['search', 'status', 'category', 'difficulty', 'topicStatus', 'archived', 'favorite', 'sort', 'page', 'limit'].some(
      (key) => req.query[key] !== undefined,
    )
    const page = getPositiveInteger(requestedPage, 1)
    const limit = Math.min(getPositiveInteger(requestedLimit, 10), maxPageLimit)

    const query = ownerFilter(req.user.id, includeArchived ? {} : { isArchived: false })
    const projection = {}

    if (searchTerm) {
      const searchPattern = new RegExp(escapeRegex(searchTerm), 'i')
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { title: searchPattern },
            { description: searchPattern },
            { category: searchPattern },
            { 'topics.title': searchPattern },
          ],
        },
      ]
    }

    if (selectedStatus) {
      const normalizedStatus = normalizeStatus(selectedStatus)
      if (!skillStatusOptions.includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid skill status filter' })
      }
      query.status = normalizedStatus
    }

    if (selectedCategory) {
      query.category = new RegExp(`^${escapeRegex(selectedCategory)}$`, 'i')
    }

    if (selectedDifficulty) {
      if (!SKILL_DIFFICULTIES.includes(selectedDifficulty)) return res.status(400).json({ message: 'Invalid difficulty filter' })
      query.difficulty = selectedDifficulty
    }

    if (selectedFavorite) {
      query.isFavorite = selectedFavorite === 'true'
    }

    if (selectedTopicStatus) {
      if (!topicStatusOptions.includes(selectedTopicStatus)) {
        return res.status(400).json({ message: 'Invalid topic status filter' })
      }
      query['topics.status'] = selectedTopicStatus
    }

    const sortConfig = sortOptions[selectedSort]

    const skillsQuery = Skill.find(query, projection).sort(sortConfig).lean()
    if (isPaginated) {
      skillsQuery.skip((page - 1) * limit).limit(limit)
    }

    const [skills, total, categories] = await Promise.all([
      skillsQuery,
      Skill.countDocuments(query),
      Skill.distinct('category', ownerFilter(req.user.id)),
    ])

    const topicSearchPattern = searchTerm ? new RegExp(escapeRegex(searchTerm), 'i') : null
    const enrichedSkills = skills.map((skill) => ({
      ...skill,
      matchingTopics: (skill.topics || [])
        .filter((topic) => {
          const matchesSearch = topicSearchPattern ? topicSearchPattern.test(topic.title) : true
          const matchesStatus = selectedTopicStatus ? topic.status === selectedTopicStatus : true
          return matchesSearch && matchesStatus
        })
        .slice(0, 5),
    }))

    res.json({
      skills: enrichedSkills,
      pagination: buildPagination({ page, limit, total, isPaginated }),
      filters: {
        categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        statuses: skillStatusOptions,
        difficulties: SKILL_DIFFICULTIES,
        topicStatuses: topicStatusOptions,
        sortOptions: Object.keys(sortOptions),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const getSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOne(ownerFilter(req.user.id, { _id: req.params.id })).lean()
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    res.json({ skill })
  } catch (err) {
    next(err)
  }
}

export const updateSkill = async (req, res, next) => {
  try {
    const updates = normalizeSkillPayload(req.body)
    if (updates.title) updates.slug = await uniqueSlugForUser({ userId: req.user.id, title: updates.title, excludeId: req.params.id })

    const skill = await Skill.findOneAndUpdate(
      ownerFilter(req.user.id, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true, omitUndefined: true },
    )

    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    
    await logAuditEvent(req, req.user.id, 'skill-update', { skillId: skill._id, title: skill.title, updates })

    res.json({ skill })
  } catch (err) {
    next(err)
  }
}

export const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOneAndUpdate(
      ownerFilter(req.user.id, { _id: req.params.id }),
      { deletedAt: new Date(), isArchived: true },
      { new: true },
    )
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    await Topic.updateMany(topicOwnerFilter(req.user.id, req.params.id), { deletedAt: new Date() })
    await Revision.deleteMany({ userId: req.user.id, skillId: req.params.id })

    await logAuditEvent(req, req.user.id, 'skill-delete', { skillId: skill._id, title: skill.title })

    res.json({ message: 'Skill deleted' })
  } catch (err) {
    next(err)
  }
}

export const toggleArchiveSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOne(ownerFilter(req.user.id, { _id: req.params.id }))
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    skill.isArchived = req.body.isArchived === undefined ? !skill.isArchived : toBoolean(req.body.isArchived)
    await skill.save()
    res.json({ skill })
  } catch (err) {
    next(err)
  }
}

export const toggleFavoriteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOne(ownerFilter(req.user.id, { _id: req.params.id }))
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    skill.isFavorite = req.body.isFavorite === undefined ? !skill.isFavorite : toBoolean(req.body.isFavorite)
    await skill.save()
    res.json({ skill })
  } catch (err) {
    next(err)
  }
}

export const duplicateSkill = async (req, res, next) => {
  try {
    const source = await Skill.findOne(ownerFilter(req.user.id, { _id: req.params.id })).lean()
    if (!source) return res.status(404).json({ message: 'Skill not found' })
    const title = `${source.title} Copy`
    const sourceTopics = await Topic.find(topicOwnerFilter(req.user.id, req.params.id)).sort({ order: 1 }).lean()
    const duplicate = await Skill.create({
      ...source,
      _id: undefined,
      user: req.user.id,
      userId: req.user.id,
      title,
      slug: await uniqueSlugForUser({ userId: req.user.id, title }),
      isFavorite: false,
      isArchived: false,
      deletedAt: null,
      createdAt: undefined,
      updatedAt: undefined,
      topics: [],
    })
    const duplicatedTopics = await Topic.insertMany(sourceTopics.map((topic, index) => ({
      ...topic,
      _id: undefined,
      skillId: duplicate._id,
      userId: req.user.id,
      order: index,
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: null,
    })))
    duplicate.topics = duplicatedTopics.map(topicMirrorPayload)
    duplicate.recalculateProgress()
    await duplicate.save()
    await Promise.all(duplicatedTopics.map((topic) => generateRevisionScheduleForTopic({
      userId: req.user.id,
      skillId: duplicate._id,
      topicId: topic._id,
      baseDate: topic.createdAt || new Date(),
    })))
    res.status(201).json({ skill: duplicate })
  } catch (err) {
    next(err)
  }
}

export const getSkillStats = async (req, res, next) => {
  try {
    const filter = ownerFilter(req.user.id)
    const [totalSkills, activeSkills, completedSkills, favoriteSkills, archivedSkills] = await Promise.all([
      Skill.countDocuments(filter),
      Skill.countDocuments(ownerFilter(req.user.id, { status: 'Learning', isArchived: false })),
      Skill.countDocuments(ownerFilter(req.user.id, { status: 'Completed' })),
      Skill.countDocuments(ownerFilter(req.user.id, { isFavorite: true })),
      Skill.countDocuments(ownerFilter(req.user.id, { isArchived: true })),
    ])
    res.json({ totalSkills, activeSkills, completedSkills, favoriteSkills, archivedSkills })
  } catch (err) {
    next(err)
  }
}

// Topics controllers
export const getTopics = async (req, res, next) => {
  try {
    const skill = await getSkillForUser(req.user.id, req.params.id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    await ensureTopicDocuments(skill)

    const { search = '', status = '', priority = '', sort = 'order' } = req.query
    const query = topicOwnerFilter(req.user.id, req.params.id)
    const searchTerm = String(search).trim()
    if (searchTerm) query.title = new RegExp(escapeRegex(searchTerm), 'i')
    if (status) query.status = String(status)
    if (priority) query.priority = String(priority)

    const sortOptions = {
      order: { order: 1, createdAt: 1 },
      dueDate: { dueDate: 1, order: 1 },
      title: { title: 1, order: 1 },
      status: { status: 1, order: 1 },
    }
    const topics = await Topic.find(query).sort(sortOptions[sort] || sortOptions.order).lean()
    res.json({ topics: topics.map((topic) => hydrateTopicFromSkill(topic, skill)) })
  } catch (err) {
    next(err)
  }
}

export const getTopic = async (req, res, next) => {
  try {
    const skill = await getSkillForUser(req.user.id, req.params.id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    await ensureTopicDocuments(skill)
    const topic = await Topic.findOne(topicOwnerFilter(req.user.id, req.params.id, { _id: req.params.topicId })).lean()
    if (!topic) return res.status(404).json({ message: 'Topic not found' })
    res.json({ topic: hydrateTopicFromSkill(topic, skill) })
  } catch (err) {
    next(err)
  }
}

export const addTopic = async (req, res, next) => {
  try {
    const skill = await getSkillForUser(req.user.id, req.params.id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })

    const count = await Topic.countDocuments(topicOwnerFilter(req.user.id, req.params.id))
    const topic = await Topic.create({
      skillId: skill._id,
      userId: req.user.id,
      order: count,
      ...normalizeTopicPayload(req.body),
    })
    skill.topics.push(topicMirrorPayload(topic))
    await syncSkillProgress(skill)
    await generateRevisionScheduleForTopic({
      userId: req.user.id,
      skillId: skill._id,
      topicId: topic._id,
      baseDate: topic.createdAt || new Date(),
    })
    if (topic.status === 'Completed') {
      await awardXp({
        userId: req.user.id,
        action: 'COMPLETE_TOPIC',
        sourceType: 'topic',
        sourceId: topic._id,
        eventKey: `topic:complete:${topic._id}`,
      })
      await Activity.create({
        userId: req.user.id,
        type: 'topic-completed',
        title: `Completed topic ${topic.title}`,
        description: skill.title,
        sourceType: 'topic',
        sourceId: topic._id,
        metadata: { skillId: skill._id },
      }).catch(() => null)
    }
    await evaluateAchievements(req.user.id)

    await logAuditEvent(req, req.user.id, 'topic-create', { skillId: skill._id, topicId: topic._id, title: topic.title })

    res.status(201).json({ topic, skill })
  } catch (err) {
    next(err)
  }
}

export const updateTopic = async (req, res, next) => {
  try {
    const { id, topicId } = req.params
    const skill = await getSkillForUser(req.user.id, id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })

    const topic = skill.topics.id(topicId)
    if (!topic) return res.status(404).json({ message: 'Topic not found' })

    const updates = normalizeTopicPayload(req.body)
    const wasCompleted = topic.status === 'Completed'
    const updatedTopic = await Topic.findOneAndUpdate(
      topicOwnerFilter(req.user.id, id, { _id: topicId }),
      updates,
      { new: true, runValidators: true },
    )
    if (!updatedTopic) return res.status(404).json({ message: 'Topic not found' })

    Object.assign(topic, topicMirrorPayload({ ...updatedTopic.toObject(), notes: topic.notes, resources: topic.resources }))
    await syncSkillProgress(skill)
    if (!wasCompleted && updatedTopic.status === 'Completed') {
      await awardXp({
        userId: req.user.id,
        action: 'COMPLETE_TOPIC',
        sourceType: 'topic',
        sourceId: updatedTopic._id,
        eventKey: `topic:complete:${updatedTopic._id}`,
      })
      await Activity.create({
        userId: req.user.id,
        type: 'topic-completed',
        title: `Completed topic ${updatedTopic.title}`,
        description: skill.title,
        sourceType: 'topic',
        sourceId: updatedTopic._id,
        metadata: { skillId: skill._id },
      }).catch(() => null)
    }

    await logAuditEvent(req, req.user.id, 'topic-update', { skillId: skill._id, topicId: updatedTopic._id, title: updatedTopic.title, updates })

    res.json({ topic: updatedTopic, skill })
  } catch (err) {
    next(err)
  }
}

export const deleteTopic = async (req, res, next) => {
  try {
    const { id, topicId } = req.params
    const skill = await getSkillForUser(req.user.id, id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })

    const topic = skill.topics.id(topicId)
    if (!topic) return res.status(404).json({ message: 'Topic not found' })

    await Topic.findOneAndUpdate(topicOwnerFilter(req.user.id, id, { _id: topicId }), { deletedAt: new Date() })
    await Revision.deleteMany({ userId: req.user.id, skillId: id, topicId })
    topic.deleteOne()
    await syncSkillProgress(skill)

    await logAuditEvent(req, req.user.id, 'topic-delete', { skillId: skill._id, topicId, title: topic.title })

    res.json({ message: 'Topic removed', skill })
  } catch (err) {
    next(err)
  }
}

export const duplicateTopic = async (req, res, next) => {
  try {
    const skill = await getSkillForUser(req.user.id, req.params.id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    await ensureTopicDocuments(skill)
    const source = await Topic.findOne(topicOwnerFilter(req.user.id, req.params.id, { _id: req.params.topicId })).lean()
    if (!source) return res.status(404).json({ message: 'Topic not found' })
    const count = await Topic.countDocuments(topicOwnerFilter(req.user.id, req.params.id))
    const topic = await Topic.create({
      ...source,
      _id: undefined,
      title: `${source.title} Copy`,
      order: count,
      completedAt: source.status === 'Completed' ? new Date() : null,
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: null,
    })
    skill.topics.push(topicMirrorPayload(topic))
    await syncSkillProgress(skill)
    await generateRevisionScheduleForTopic({
      userId: req.user.id,
      skillId: skill._id,
      topicId: topic._id,
      baseDate: topic.createdAt || new Date(),
    })
    res.status(201).json({ topic, skill })
  } catch (err) {
    next(err)
  }
}

export const reorderTopics = async (req, res, next) => {
  try {
    const skill = await getSkillForUser(req.user.id, req.params.id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })
    await ensureTopicDocuments(skill)
    const topicIds = req.body.topicIds.map(String)
    const topics = await Topic.find(topicOwnerFilter(req.user.id, req.params.id, { _id: { $in: topicIds } }))
    if (topics.length !== topicIds.length) return res.status(400).json({ message: 'Invalid topic order' })
    await Promise.all(topics.map((topic) => {
      topic.order = topicIds.indexOf(String(topic._id))
      return topic.save()
    }))
    skill.topics.forEach((topic) => {
      const nextOrder = topicIds.indexOf(String(topic._id))
      if (nextOrder >= 0) topic.order = nextOrder
    })
    await syncSkillProgress(skill)
    const orderedTopics = await Topic.find(topicOwnerFilter(req.user.id, req.params.id)).sort({ order: 1 }).lean()
    res.json({ topics: orderedTopics, skill })
  } catch (err) {
    next(err)
  }
}
