import Revision from '../models/Revision.js'
import Skill from '../models/Skill.js'
import Topic from '../models/Topic.js'

export const DEFAULT_REVISION_DAYS = [1, 3, 7, 15, 30, 60, 90]

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const startOfDay = (date = new Date()) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

export const addDays = (date, days) => new Date(startOfDay(date).getTime() + Number(days) * MS_PER_DAY)

export const dateKey = (date) => startOfDay(date).toISOString().slice(0, 10)

export const deriveRevisionStatus = (revision, today = startOfDay()) => {
  if (revision.status === 'Completed' || revision.completedAt) return 'Completed'

  const snoozeUntil = revision.snoozeUntil ? startOfDay(revision.snoozeUntil) : null
  if (snoozeUntil && snoozeUntil > today) return 'Snoozed'

  const effectiveDate = snoozeUntil && snoozeUntil <= today ? snoozeUntil : startOfDay(revision.revisionDate)
  if (effectiveDate.getTime() === today.getTime()) return 'Due Today'
  if (effectiveDate < today) return 'Missed'
  return 'Upcoming'
}

export const serializeRevision = (revision, today = startOfDay()) => {
  const plain = revision.toObject ? revision.toObject() : revision
  return {
    ...plain,
    status: deriveRevisionStatus(plain, today),
    revisionDateKey: dateKey(plain.revisionDate),
  }
}

const revisionBaseDocs = ({ userId, skillId, topicId, baseDate = new Date() }) =>
  DEFAULT_REVISION_DAYS.map((day) => ({
    userId,
    skillId,
    topicId,
    scheduleDay: day,
    revisionDate: addDays(baseDate, day),
    status: 'Upcoming',
  }))

const distanceFromCanonical = (revision, topicBaseDate, scheduleDay) =>
  Math.abs(startOfDay(revision.revisionDate).getTime() - addDays(topicBaseDate, scheduleDay).getTime())

const inferScheduleDay = (revision, topicBaseDate) => {
  if (DEFAULT_REVISION_DAYS.includes(Number(revision.scheduleDay))) return Number(revision.scheduleDay)

  return DEFAULT_REVISION_DAYS
    .map((day) => ({ day, distance: distanceFromCanonical(revision, topicBaseDate, day) }))
    .sort((a, b) => a.distance - b.distance)[0].day
}

const pickRevisionKeeper = (items) =>
  items.slice().sort((a, b) => {
    if (Boolean(b.completedAt) !== Boolean(a.completedAt)) return Number(Boolean(b.completedAt)) - Number(Boolean(a.completedAt))
    if (Boolean(b.notes) !== Boolean(a.notes)) return Number(Boolean(b.notes)) - Number(Boolean(a.notes))
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  })[0]

export const normalizeRevisionSchedulesForUser = async (userId) => {
  const topics = await Topic.find({ userId, deletedAt: null }).select('_id skillId createdAt').lean()
  if (!topics.length) return { removed: 0, updated: 0 }

  let removed = 0
  let updated = 0

  for (const topic of topics) {
    const topicBaseDate = topic.createdAt || new Date()
    const revisions = await Revision.find({ userId, topicId: topic._id }).sort({ createdAt: 1 })
    if (!revisions.length) continue

    const groups = new Map()
    revisions.forEach((revision) => {
      const scheduleDay = inferScheduleDay(revision, topicBaseDate)
      const current = groups.get(scheduleDay) || []
      current.push(revision)
      groups.set(scheduleDay, current)
    })

    for (const [scheduleDay, items] of groups.entries()) {
      const keeper = pickRevisionKeeper(items)
      const duplicates = items.filter((revision) => String(revision._id) !== String(keeper._id))
      if (duplicates.length) {
        await Revision.deleteMany({ _id: { $in: duplicates.map((revision) => revision._id) } })
        removed += duplicates.length
      }

      const canonicalDate = addDays(topicBaseDate, scheduleDay)
      const updates = { scheduleDay }
      if (!keeper.completedAt && !keeper.snoozeUntil) updates.revisionDate = canonicalDate
      const changed =
        keeper.scheduleDay !== scheduleDay ||
        (!keeper.completedAt && !keeper.snoozeUntil && startOfDay(keeper.revisionDate).getTime() !== canonicalDate.getTime())

      if (changed) {
        await Revision.updateOne({ _id: keeper._id }, { $set: updates })
        updated += 1
      }
    }
  }

  return { removed, updated }
}

export const generateRevisionScheduleForTopic = async ({ userId, skillId, topicId, baseDate = new Date() }) => {
  const [skill, topic] = await Promise.all([
    Skill.exists({ _id: skillId, userId, deletedAt: null }),
    Topic.exists({ _id: topicId, skillId, userId, deletedAt: null }),
  ])

  if (!skill || !topic) {
    const error = new Error(!skill ? 'Skill not found' : 'Topic not found')
    error.status = 404
    throw error
  }

  const operations = revisionBaseDocs({ userId, skillId, topicId, baseDate }).map((doc) => ({
    updateOne: {
      filter: {
        userId: doc.userId,
        skillId: doc.skillId,
        topicId: doc.topicId,
        scheduleDay: doc.scheduleDay,
      },
      update: { $setOnInsert: doc },
      upsert: true,
    },
  }))

  if (operations.length) await Revision.bulkWrite(operations, { ordered: false })
  return Revision.find({ userId, skillId, topicId }).sort({ revisionDate: 1 }).lean()
}

export const ensureRevisionSchedulesForUser = async (userId) => {
  const topics = await Topic.find({ userId, deletedAt: null }).select('_id skillId createdAt').lean()
  if (!topics.length) return 0

  const existing = await Revision.find({ userId, topicId: { $in: topics.map((topic) => topic._id) } }).select('topicId scheduleDay revisionDate').lean()
  const existingByTopic = new Map()
  existing.forEach((revision) => {
    const topic = topics.find((item) => String(item._id) === String(revision.topicId))
    if (!topic) return
    const topicBaseDate = topic.createdAt || new Date()
    const scheduleDay = inferScheduleDay(revision, topicBaseDate)
    const days = existingByTopic.get(String(revision.topicId)) || new Set()
    days.add(scheduleDay)
    existingByTopic.set(String(revision.topicId), days)
  })

  const operations = topics.flatMap((topic) => {
    const existingDays = existingByTopic.get(String(topic._id)) || new Set()
    return revisionBaseDocs({
      userId,
      skillId: topic.skillId,
      topicId: topic._id,
      baseDate: topic.createdAt || new Date(),
    }).filter((doc) => !existingDays.has(doc.scheduleDay)).map((doc) => ({
      updateOne: {
        filter: {
          userId: doc.userId,
          skillId: doc.skillId,
          topicId: doc.topicId,
        scheduleDay: doc.scheduleDay,
      },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }))
  })

  if (operations.length) await Revision.bulkWrite(operations, { ordered: false })
  return operations.length
}

export const buildRevisionQuery = ({ userId, skillId, topicId, startDate, endDate }) => {
  const query = { userId }
  if (skillId) query.skillId = skillId
  if (topicId) query.topicId = topicId
  if (startDate || endDate) {
    query.revisionDate = {}
    if (startDate) query.revisionDate.$gte = startOfDay(startDate)
    if (endDate) query.revisionDate.$lte = addDays(endDate, 1)
  }
  return query
}

export const summarizeRevisions = (revisions) => {
  const today = startOfDay()
  const summary = {
    dueToday: 0,
    upcoming: 0,
    missed: 0,
    completed: 0,
    snoozed: 0,
    total: revisions.length,
    completionRate: 0,
    averageDelayDays: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
    calendar: [],
  }

  const weekStart = addDays(today, -6)
  const monthStart = addDays(today, -29)
  const delayValues = []
  const calendarMap = new Map()

  revisions.forEach((revision) => {
    const status = deriveRevisionStatus(revision, today)
    if (status === 'Due Today') summary.dueToday += 1
    if (status === 'Upcoming') summary.upcoming += 1
    if (status === 'Missed') summary.missed += 1
    if (status === 'Completed') summary.completed += 1
    if (status === 'Snoozed') summary.snoozed += 1

    if (revision.completedAt) {
      const completedDay = startOfDay(revision.completedAt)
      if (completedDay >= weekStart) summary.completedThisWeek += 1
      if (completedDay >= monthStart) summary.completedThisMonth += 1
      delayValues.push(Math.max(0, Math.round((completedDay - startOfDay(revision.revisionDate)) / MS_PER_DAY)))
    }

    const key = dateKey(revision.snoozeUntil && status === 'Snoozed' ? revision.snoozeUntil : revision.revisionDate)
    const entry = calendarMap.get(key) || { date: key, dueToday: 0, completed: 0, missed: 0, upcoming: 0, snoozed: 0, revisions: [] }
    if (status === 'Due Today') entry.dueToday += 1
    if (status === 'Completed') entry.completed += 1
    if (status === 'Missed') entry.missed += 1
    if (status === 'Upcoming') entry.upcoming += 1
    if (status === 'Snoozed') entry.snoozed += 1
    entry.revisions.push(serializeRevision(revision, today))
    calendarMap.set(key, entry)
  })

  summary.completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0
  summary.averageDelayDays = delayValues.length
    ? Number((delayValues.reduce((sum, value) => sum + value, 0) / delayValues.length).toFixed(1))
    : 0
  summary.calendar = Array.from(calendarMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  return summary
}
