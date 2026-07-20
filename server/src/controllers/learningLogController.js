import mongoose from 'mongoose'
import LearningLog from '../models/LearningLog.js'
import Skill from '../models/Skill.js'
import Topic from '../models/Topic.js'
import User from '../models/User.js'
import { getUserStreakSummary } from '../services/streakService.js'
import { awardGoalAndStreakXp, awardXp } from '../services/gamification.service.js'
import { createActivity } from '../services/collaboration.service.js'

const findOwnedTopic = (userId, skillId, topicId) =>
  Topic.findOne({
    _id: topicId,
    skillId,
    userId,
    deletedAt: null,
  })

const goalDefaults = { dailyStudyHours: 1, weeklyStudyHours: 7, monthlyStudyHours: 30 }

const startOfUtcDay = (date = new Date()) => {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const addDays = (date, amount) => {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + amount)
  return d
}

const addMonths = (date, amount) => {
  const d = new Date(date)
  d.setUTCMonth(d.getUTCMonth() + amount)
  return d
}

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10)

const minutesToHours = (minutes) => Math.round((Number(minutes || 0) / 60) * 10) / 10

const clampPercent = (value) => Math.min(100, Math.max(0, Math.round(value || 0)))

const parseLogPayload = ({ date, startTime, endTime, duration, notes, sessionType }) => {
  const start = startTime ? new Date(startTime) : null
  const end = endTime ? new Date(endTime) : null
  const calculatedDuration = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : Number(duration)
  return {
    date: date ? startOfUtcDay(date) : startOfUtcDay(start || new Date()),
    startTime: start,
    endTime: end,
    duration: calculatedDuration,
    sessionType: sessionType || 'Study',
    notes: notes || '',
  }
}

const normalizeLog = (log) => {
  const populatedSkill = log.skill && typeof log.skill === 'object' ? log.skill : null
  const populatedTopic = log.topic && typeof log.topic === 'object' ? log.topic : null
  return {
    ...log,
    skill: populatedSkill
      ? { _id: populatedSkill._id, title: populatedSkill.title, category: populatedSkill.category }
      : null,
    topic: populatedTopic
      ? { _id: populatedTopic._id, title: populatedTopic.deletedAt ? 'Deleted Topic' : populatedTopic.title, status: populatedTopic.status }
      : { _id: log.topic, title: 'Deleted Topic' },
  }
}

const populateLogQuery = (query) => query
  .populate('skill', 'title category')
  .populate('topic', 'title status deletedAt')

const activityLevel = (minutes) => {
  if (!minutes) return 'none'
  if (minutes < 30) return 'low'
  if (minutes < 120) return 'medium'
  return 'high'
}

const csvValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

const buildLearningProgress = async (userId) => {
  const user = await User.findById(userId).select('learningGoals').lean()
  const goals = { ...goalDefaults, ...(user?.learningGoals || {}) }
  const todayStart = startOfUtcDay()
  const tomorrowStart = addDays(todayStart, 1)
  const weekStart = addDays(todayStart, -6)
  const monthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1))
  const calendarStart = addDays(todayStart, -364)

  const userObjectId = new mongoose.Types.ObjectId(userId)
  const [totals, dailyRows, sessions, streak] = await Promise.all([
    LearningLog.aggregate([
      { $match: { user: userObjectId, date: { $gte: calendarStart, $lt: tomorrowStart } } },
      {
        $group: {
          _id: null,
          todayMinutes: { $sum: { $cond: [{ $gte: ['$date', todayStart] }, '$duration', 0] } },
          weeklyMinutes: { $sum: { $cond: [{ $gte: ['$date', weekStart] }, '$duration', 0] } },
          monthlyMinutes: { $sum: { $cond: [{ $gte: ['$date', monthStart] }, '$duration', 0] } },
          totalMinutes: { $sum: '$duration' },
        },
      },
    ]),
    LearningLog.aggregate([
      { $match: { user: userObjectId, date: { $gte: calendarStart, $lt: tomorrowStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } },
          minutes: { $sum: '$duration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    populateLogQuery(LearningLog.find({ user: userId, date: { $gte: calendarStart, $lt: tomorrowStart } }))
      .sort({ date: -1, startTime: -1 })
      .lean(),
    getUserStreakSummary(userId),
  ])

  const totalsRow = totals[0] || {}
  const rowMap = new Map(dailyRows.map((row) => [row._id, row]))
  const sessionsByDate = sessions.reduce((map, log) => {
    const key = toDateKey(log.date)
    map[key] = map[key] || []
    map[key].push(normalizeLog(log))
    return map
  }, {})

  const calendar = Array.from({ length: 365 }, (_, index) => {
    const date = addDays(calendarStart, index)
    const key = toDateKey(date)
    const row = rowMap.get(key)
    const minutes = row?.minutes || 0
    return {
      date: key,
      minutes,
      hours: minutesToHours(minutes),
      sessions: row?.sessions || 0,
      level: activityLevel(minutes),
    }
  })

  const dailyHours = Array.from({ length: 14 }, (_, index) => {
    const key = toDateKey(addDays(todayStart, index - 13))
    return { label: key.slice(5), date: key, hours: minutesToHours(rowMap.get(key)?.minutes || 0) }
  })
  const weeklyHours = Array.from({ length: 8 }, (_, index) => {
    const start = addDays(todayStart, (index - 7) * 7)
    const end = addDays(start, 6)
    let minutes = 0
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) minutes += rowMap.get(toDateKey(d))?.minutes || 0
    return { label: `${toDateKey(start).slice(5)}-${toDateKey(end).slice(5)}`, hours: minutesToHours(minutes) }
  })
  const monthlyHours = Array.from({ length: 6 }, (_, index) => {
    const month = addMonths(monthStart, index - 5)
    const nextMonth = addMonths(month, 1)
    let minutes = 0
    for (let d = new Date(month); d < nextMonth && d < tomorrowStart; d = addDays(d, 1)) minutes += rowMap.get(toDateKey(d))?.minutes || 0
    return { label: month.toLocaleString('en', { month: 'short', timeZone: 'UTC' }), hours: minutesToHours(minutes) }
  })

  const goalProgress = {
    today: { minutes: totalsRow.todayMinutes || 0, hours: minutesToHours(totalsRow.todayMinutes), targetHours: goals.dailyStudyHours, percent: clampPercent(((totalsRow.todayMinutes || 0) / ((goals.dailyStudyHours || 0) * 60)) * 100) },
    week: { minutes: totalsRow.weeklyMinutes || 0, hours: minutesToHours(totalsRow.weeklyMinutes), targetHours: goals.weeklyStudyHours, percent: clampPercent(((totalsRow.weeklyMinutes || 0) / ((goals.weeklyStudyHours || 0) * 60)) * 100) },
    month: { minutes: totalsRow.monthlyMinutes || 0, hours: minutesToHours(totalsRow.monthlyMinutes), targetHours: goals.monthlyStudyHours, percent: clampPercent(((totalsRow.monthlyMinutes || 0) / ((goals.monthlyStudyHours || 0) * 60)) * 100) },
  }

  return {
    goals,
    goalProgress,
    todayLearning: { minutes: totalsRow.todayMinutes || 0, hours: minutesToHours(totalsRow.todayMinutes) },
    learningHours: { total: minutesToHours(totalsRow.totalMinutes), weekly: goalProgress.week.hours, monthly: goalProgress.month.hours },
    streak,
    analytics: { dailyHours, weeklyHours, monthlyHours },
    calendar,
    sessionsByDate,
  }
}

export const createLearningLog = async (req, res, next) => {
  try {
    const { skillId, topicId, date, duration, notes } = req.body
    const skill = await Skill.findOne({ _id: skillId, user: req.user.id })
    if (!skill) return res.status(404).json({ message: 'Skill not found' })

    const topic = await findOwnedTopic(req.user.id, skillId, topicId)
    if (!topic) return res.status(404).json({ message: 'Topic not found' })

    const log = await LearningLog.create({
      user: req.user.id,
      skill: skillId,
      topic: topicId,
      ...parseLogPayload({ date, duration, notes, sessionType: req.body.sessionType, startTime: req.body.startTime, endTime: req.body.endTime }),
    })
    await awardXp({
      userId: req.user.id,
      action: 'ADD_LEARNING_SESSION',
      sourceType: 'learning-session',
      sourceId: log._id,
      eventKey: `learning-session:create:${log._id}`,
    })
    const progress = await buildLearningProgress(req.user.id)
    await awardGoalAndStreakXp(req.user.id, progress, log._id)

    await createActivity({
      userId: req.user.id,
      type: 'session-added',
      title: 'Added a study session',
      description: `Logged a ${log.duration} mins study session for topic: "${topic.title}"`,
      sourceType: 'learning-session',
      sourceId: log._id,
    })

    res.status(201).json({ log })
  } catch (err) {
    next(err)
  }
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getLearningLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, skillId, topicId, sessionType, search = '', sort = 'latest' } = req.query
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const filter = { user: req.user.id }
    if (skillId) filter.skill = skillId
    if (topicId) filter.topic = topicId
    if (sessionType) filter.sessionType = sessionType
    if (startDate || endDate) filter.date = {}
    if (startDate) filter.date.$gte = new Date(startDate)
    if (endDate) filter.date.$lte = new Date(endDate)

    const searchTerm = String(search).trim()
    if (searchTerm) {
      filter.notes = new RegExp(escapeRegex(searchTerm), 'i')
    }

    const sortOptions = {
      latest: { date: -1, startTime: -1 },
      oldest: { date: 1, startTime: 1 },
      duration: { duration: -1, date: -1 },
      notes: { notes: 1, date: -1 },
    }

    const [logs, total] = await Promise.all([
      populateLogQuery(LearningLog.find(filter))
        .sort(sortOptions[sort] || sortOptions.latest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LearningLog.countDocuments(filter),
    ])

    const normalizedLogs = logs.map(normalizeLog)

    res.json({
      logs: normalizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const updateLearningLog = async (req, res, next) => {
  try {
    const { id } = req.params
    const { skillId, topicId, date, duration, notes, startTime, endTime, sessionType } = req.body
    const log = await LearningLog.findOne({ _id: id, user: req.user.id })
    if (!log) return res.status(404).json({ message: 'Learning log not found' })

    if (skillId || topicId) {
      const nextSkillId = skillId || log.skill
      const nextTopicId = topicId || log.topic
      const relationChanged = String(nextSkillId) !== String(log.skill) || String(nextTopicId) !== String(log.topic)
      if (relationChanged) {
        const skill = await Skill.findOne({ _id: nextSkillId, user: req.user.id })
        if (!skill) return res.status(404).json({ message: 'Skill not found' })
        const topic = await findOwnedTopic(req.user.id, nextSkillId, nextTopicId)
        if (!topic) return res.status(404).json({ message: 'Topic not found' })
      }
      log.skill = nextSkillId
      log.topic = nextTopicId
    }

    const timing = parseLogPayload({
      date: date || log.date,
      duration: duration ?? log.duration,
      notes: notes ?? log.notes,
      sessionType: sessionType || log.sessionType,
      startTime: startTime === undefined ? log.startTime : startTime,
      endTime: endTime === undefined ? log.endTime : endTime,
    })
    if (timing.startTime && timing.endTime && timing.endTime <= timing.startTime) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }
    if (date || startTime !== undefined) log.date = timing.date
    if (startTime !== undefined) log.startTime = timing.startTime
    if (endTime !== undefined) log.endTime = timing.endTime
    if (startTime !== undefined || endTime !== undefined || duration !== undefined) log.duration = timing.duration
    if (sessionType) log.sessionType = timing.sessionType
    if (notes !== undefined) log.notes = notes

    await log.save()
    res.json({ log })
  } catch (err) {
    next(err)
  }
}

export const updateLearningGoals = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id).select('learningGoals')
    if (!currentUser) return res.status(404).json({ message: 'User not found' })
    currentUser.learningGoals = {
      ...goalDefaults,
      ...(currentUser.learningGoals?.toObject?.() || currentUser.learningGoals || {}),
      ...Object.fromEntries(
        ['dailyStudyHours', 'weeklyStudyHours', 'monthlyStudyHours']
          .filter((key) => req.body[key] !== undefined)
          .map((key) => [key, Number(req.body[key])]),
      ),
    }
    await currentUser.save()
    res.json({ goals: currentUser.learningGoals })
  } catch (err) {
    next(err)
  }
}

export const getLearningProgress = async (req, res, next) => {
  try {
    res.json(await buildLearningProgress(req.user.id))
  } catch (err) {
    next(err)
  }
}

export const exportLearningLogsCsv = async (req, res, next) => {
  try {
    const logs = await populateLogQuery(LearningLog.find({ user: req.user.id }).sort({ date: -1, startTime: -1 })).lean()
    const rows = logs.map(normalizeLog)
    const header = ['Date', 'Start Time', 'End Time', 'Duration Minutes', 'Session Type', 'Skill', 'Topic', 'Notes']
    const csv = [
      header.map(csvValue).join(','),
      ...rows.map((log) => [
        toDateKey(log.date),
        log.startTime ? new Date(log.startTime).toISOString() : '',
        log.endTime ? new Date(log.endTime).toISOString() : '',
        log.duration,
        log.sessionType || 'Study',
        log.skill?.title || '',
        log.topic?.title || 'Deleted Topic',
        log.notes || '',
      ].map(csvValue).join(',')),
    ].join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="learning-history.csv"')
    res.send(csv)
  } catch (err) {
    next(err)
  }
}

export const deleteLearningLog = async (req, res, next) => {
  try {
    const log = await LearningLog.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!log) return res.status(404).json({ message: 'Learning log not found' })
    res.json({ message: 'Log deleted' })
  } catch (err) {
    next(err)
  }
}
