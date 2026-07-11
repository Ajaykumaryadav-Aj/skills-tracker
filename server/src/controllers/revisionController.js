import Revision from '../models/Revision.js'
import Topic from '../models/Topic.js'
import Activity from '../models/Activity.js'
import {
  buildRevisionQuery,
  deriveRevisionStatus,
  ensureRevisionSchedulesForUser,
  generateRevisionScheduleForTopic,
  normalizeRevisionSchedulesForUser,
  serializeRevision,
  startOfDay,
  summarizeRevisions,
} from '../services/revision.service.js'
import { awardXp } from '../services/gamification.service.js'

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 12, 1), 50)
  return { page, limit }
}

const populateRevision = (query) =>
  query
    .populate({ path: 'skillId', select: 'title category color icon' })
    .populate({ path: 'topicId', select: 'title status priority' })

const revisionOwnerFilter = (userId, revisionId) => ({ _id: revisionId, userId })

const appendNote = (existing, next) => {
  const trimmed = String(next || '').trim()
  if (!trimmed) return existing || ''
  return [existing, trimmed].filter(Boolean).join('\n')
}

export const generateTopicRevisionSchedule = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.topicId, userId: req.user.id, deletedAt: null }).lean()
    if (!topic) return res.status(404).json({ message: 'Topic not found' })
    const revisions = await generateRevisionScheduleForTopic({
      userId: req.user.id,
      skillId: req.body.skillId || topic.skillId,
      topicId: topic._id,
      baseDate: topic.createdAt || new Date(),
    })
    await normalizeRevisionSchedulesForUser(req.user.id)
    res.status(201).json({ revisions })
  } catch (err) {
    next(err)
  }
}

export const getRevisions = async (req, res, next) => {
  try {
    await ensureRevisionSchedulesForUser(req.user.id)
    await normalizeRevisionSchedulesForUser(req.user.id)
    const { status = '', search = '' } = req.query
    const { page, limit } = getPagination(req.query)
    const query = buildRevisionQuery({
      userId: req.user.id,
      skillId: req.query.skillId,
      topicId: req.query.topicId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    })

    const docs = await populateRevision(Revision.find(query).sort({ revisionDate: 1, createdAt: 1 }).lean())
    const today = startOfDay()
    const searchTerm = String(search).trim().toLowerCase()
    const filtered = docs
      .map((revision) => serializeRevision(revision, today))
      .filter((revision) => {
        const matchesStatus = status ? revision.status === status : true
        const skillTitle = revision.skillId?.title || ''
        const topicTitle = revision.topicId?.title || ''
        const matchesSearch = searchTerm
          ? `${skillTitle} ${topicTitle}`.toLowerCase().includes(searchTerm)
          : true
        return matchesStatus && matchesSearch
      })

    const total = filtered.length
    const revisions = filtered.slice((page - 1) * limit, page * limit)
    res.json({
      revisions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const getRevisionStats = async (req, res, next) => {
  try {
    await ensureRevisionSchedulesForUser(req.user.id)
    await normalizeRevisionSchedulesForUser(req.user.id)
    const docs = await populateRevision(Revision.find({ userId: req.user.id }).sort({ revisionDate: 1 }).lean())
    const summary = summarizeRevisions(docs)
    res.json({
      widgets: {
        dueToday: summary.dueToday,
        upcoming: summary.upcoming,
        missed: summary.missed,
        completed: summary.completed,
        snoozed: summary.snoozed,
        completionRate: summary.completionRate,
      },
      analytics: {
        completionRate: summary.completionRate,
        averageDelayDays: summary.averageDelayDays,
        completedThisWeek: summary.completedThisWeek,
        completedThisMonth: summary.completedThisMonth,
      },
      calendar: summary.calendar,
    })
  } catch (err) {
    next(err)
  }
}

export const completeRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findOne(revisionOwnerFilter(req.user.id, req.params.id))
    if (!revision) return res.status(404).json({ message: 'Revision not found' })
    if (revision.status === 'Completed') return res.status(400).json({ message: 'Revision is already completed' })

    revision.status = 'Completed'
    revision.completedAt = new Date()
    revision.snoozeUntil = null
    revision.notes = appendNote(revision.notes, req.body.notes)
    await revision.save()
    await awardXp({
      userId: req.user.id,
      action: 'COMPLETE_REVISION',
      sourceType: 'revision',
      sourceId: revision._id,
      eventKey: `revision:complete:${revision._id}`,
    })
    await Activity.create({
      userId: req.user.id,
      type: 'revision-completed',
      title: 'Completed a revision',
      description: revision.notes || '',
      sourceType: 'revision',
      sourceId: revision._id,
      metadata: { skillId: revision.skillId, topicId: revision.topicId },
    }).catch(() => null)

    const populated = await populateRevision(Revision.findById(revision._id).lean())
    res.json({ revision: serializeRevision(populated) })
  } catch (err) {
    next(err)
  }
}

export const snoozeRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findOne(revisionOwnerFilter(req.user.id, req.params.id))
    if (!revision) return res.status(404).json({ message: 'Revision not found' })
    if (revision.status === 'Completed' || revision.completedAt) {
      return res.status(400).json({ message: 'Completed revisions cannot be snoozed' })
    }

    revision.status = 'Snoozed'
    revision.snoozeUntil = new Date(req.body.snoozeUntil)
    revision.notes = appendNote(revision.notes, req.body.notes)
    await revision.save()

    const populated = await populateRevision(Revision.findById(revision._id).lean())
    res.json({ revision: serializeRevision(populated) })
  } catch (err) {
    next(err)
  }
}

export const skipRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findOne(revisionOwnerFilter(req.user.id, req.params.id))
    if (!revision) return res.status(404).json({ message: 'Revision not found' })
    if (deriveRevisionStatus(revision) === 'Completed') return res.status(400).json({ message: 'Revision is already completed' })

    revision.status = 'Completed'
    revision.completedAt = new Date()
    revision.snoozeUntil = null
    revision.notes = appendNote(revision.notes, req.body.notes || 'Skipped by learner.')
    await revision.save()

    const populated = await populateRevision(Revision.findById(revision._id).lean())
    res.json({ revision: serializeRevision(populated) })
  } catch (err) {
    next(err)
  }
}

export const updateRevisionNotes = async (req, res, next) => {
  try {
    const revision = await Revision.findOneAndUpdate(
      revisionOwnerFilter(req.user.id, req.params.id),
      { notes: String(req.body.notes || '').trim() },
      { new: true, runValidators: true },
    )
    if (!revision) return res.status(404).json({ message: 'Revision not found' })
    const populated = await populateRevision(Revision.findById(revision._id).lean())
    res.json({ revision: serializeRevision(populated) })
  } catch (err) {
    next(err)
  }
}
