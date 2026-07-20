import Skill from '../models/Skill.js'
import Topic from '../models/Topic.js'
import LearningLog from '../models/LearningLog.js'

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const globalSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) {
      return res.json({ skills: [], topics: [], notes: [], sessions: [] })
    }

    const regex = new RegExp(escapeRegex(q), 'i')

    const [skills, topics, sessions, userSkills] = await Promise.all([
      // 1. Skills
      Skill.find({ user: req.user.id, title: regex, deletedAt: null })
        .select('title slug category icon color difficulty status progress')
        .limit(10)
        .lean(),

      // 2. Topics
      Topic.find({ userId: req.user.id, title: regex, deletedAt: null })
        .populate('skillId', 'title slug')
        .limit(10)
        .lean(),

      // 3. Sessions (Learning logs)
      LearningLog.find({ user: req.user.id, notes: regex })
        .populate('skill', 'title slug')
        .populate('topic', 'title')
        .limit(10)
        .lean(),

      // 4. Notes (fetched from nested skill topics)
      Skill.find({ user: req.user.id, deletedAt: null })
        .select('title slug topics.title topics.noteItems')
        .lean(),
    ])

    // Filter nested notes
    const notes = []
    const lowerQuery = q.toLowerCase()
    userSkills.forEach((skill) => {
      ;(skill.topics || []).forEach((topic) => {
        ;(topic.noteItems || []).forEach((note) => {
          const matchesTitle = String(note.title || '').toLowerCase().includes(lowerQuery)
          const matchesContent = String(note.content || '').toLowerCase().includes(lowerQuery)
          if (matchesTitle || matchesContent) {
            notes.push({
              _id: note._id,
              title: note.title,
              content: note.content,
              skill: { _id: skill._id, title: skill.title, slug: skill.slug },
              topic: { _id: topic._id, title: topic.title },
            })
          }
        })
      })
    })

    res.json({
      skills,
      topics,
      sessions,
      notes: notes.slice(0, 10),
    })
  } catch (err) {
    next(err)
  }
}
