import LearningLog from '../models/LearningLog.js'
import Skill from '../models/Skill.js'
import Topic from '../models/Topic.js'

const findOwnedTopic = (userId, skillId, topicId) =>
  Topic.findOne({
    _id: topicId,
    skillId,
    userId,
    deletedAt: null,
  })

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
      date: new Date(date),
      duration: Number(duration),
      notes: notes || '',
    })

    res.status(201).json({ log })
  } catch (err) {
    next(err)
  }
}

export const getLearningLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, skillId } = req.query
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const filter = { user: req.user.id }
    if (skillId) filter.skill = skillId
    if (startDate || endDate) filter.date = {}
    if (startDate) filter.date.$gte = new Date(startDate)
    if (endDate) filter.date.$lte = new Date(endDate)

    const [logs, total] = await Promise.all([
      LearningLog.find(filter)
        .populate('skill', 'title category')
        .populate('topic', 'title status deletedAt')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LearningLog.countDocuments(filter),
    ])

    const normalizedLogs = logs.map((log) => {
      const populatedSkill = log.skill
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
    })

    res.json({
      logs: normalizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const updateLearningLog = async (req, res, next) => {
  try {
    const { id } = req.params
    const { skillId, topicId, date, duration, notes } = req.body
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

    if (date) log.date = new Date(date)
    if (duration !== undefined) log.duration = Number(duration)
    if (notes !== undefined) log.notes = notes

    await log.save()
    res.json({ log })
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
