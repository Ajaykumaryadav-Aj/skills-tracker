import crypto from 'crypto'
import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import Bookmark from '../models/Bookmark.js'
import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'
import Reminder from '../models/Reminder.js'
import Skill from '../models/Skill.js'
import Team from '../models/Team.js'
import User from '../models/User.js'
import { getGamificationSummary } from './gamification.service.js'

export const createActivity = async ({ userId, type, title, description = '', sourceType = '', sourceId, metadata = {} }) => {
  if (!userId || !type || !title) return null
  return Activity.create({ userId, type, title, description, sourceType, sourceId, metadata }).catch(() => null)
}

export const createNotification = async ({ userId, type, title, message = '', sourceType = '', sourceId, metadata = {} }) => {
  if (!userId || !type || !title) return null
  return Notification.create({ userId, type, title, message, sourceType, sourceId, metadata }).catch(() => null)
}

export const createInviteCode = () => crypto.randomBytes(5).toString('hex')

export const getTeamRole = (team, userId) => {
  const member = (team.members || []).find((item) => String(item.userId || '') === String(userId) && item.status === 'active')
  return member?.role || ''
}

export const requireTeamAdmin = (team, userId) => ['owner', 'admin'].includes(getTeamRole(team, userId))

export const findKnowledgeTarget = async ({ userId, targetType, targetId }) => {
  if (!mongoose.Types.ObjectId.isValid(targetId)) return null
  const path = targetType === 'note' ? 'topics.noteItems._id' : 'topics.resources._id'
  const skill = await Skill.findOne({ userId, deletedAt: null, [path]: targetId }).select('title topics.title topics.noteItems topics.resources').lean()
  if (!skill) return null

  for (const topic of skill.topics || []) {
    const collection = targetType === 'note' ? topic.noteItems || [] : topic.resources || []
    const item = collection.find((entry) => String(entry._id) === String(targetId))
    if (item) {
      return {
        skill: { _id: skill._id, title: skill.title },
        topic: { _id: topic._id, title: topic.title },
        item,
        title: item.title || `${targetType} item`,
      }
    }
  }
  return null
}

export const getPublicProfileBySlug = async (slug) => {
  const user = await User.findOne({ 'publicProfile.enabled': true, 'publicProfile.slug': slug })
    .select('name avatar bio location website github linkedin profession experienceLevel publicProfile createdAt')
    .lean()
  if (!user) return null

  const summary = await getGamificationSummary(user._id)
  const profile = user.publicProfile || {}
  return {
    user: {
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      github: user.github,
      linkedin: user.linkedin,
      profession: user.profession,
      experienceLevel: user.experienceLevel,
      joinedAt: user.createdAt,
    },
    stats: {
      learningHours: profile.showLearningHours ? summary.stats.learningHours : null,
      xp: profile.showXp ? summary.profile.totalXp : null,
      level: profile.showXp ? summary.profile.level : null,
      badges: profile.showBadges ? summary.profile.badges : [],
      achievements: profile.showAchievements ? summary.profile.achievements : [],
      skills: summary.stats.skills,
      topics: summary.stats.topics,
      streak: summary.stats.streak,
    },
  }
}

export const getCollaborationSummary = async (userId) => {
  const now = new Date()
  const [notifications, unreadNotifications, teams, activity, reminders] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    Notification.countDocuments({ userId, readAt: null }),
    Team.find({ 'members.userId': userId, 'members.status': 'active' }).sort({ updatedAt: -1 }).limit(4).lean(),
    Activity.find({ userId }).sort({ createdAt: -1 }).limit(8).lean(),
    Reminder.find({ userId, completedAt: null, date: { $gte: new Date(now.toDateString()) } }).sort({ date: 1, time: 1 }).limit(5).lean(),
  ])
  return { notifications, unreadNotifications, teams, activity, reminders }
}

export const serializeComments = async (query) => {
  const comments = await Comment.find({ ...query, deletedAt: null }).populate('userId', 'name avatar').sort({ createdAt: 1 }).lean()
  const byParent = new Map()
  comments.forEach((comment) => {
    const key = String(comment.parentId || 'root')
    byParent.set(key, [...(byParent.get(key) || []), { ...comment, replies: [] }])
  })
  const attach = (comment) => ({ ...comment, replies: (byParent.get(String(comment._id)) || []).map(attach) })
  return (byParent.get('root') || []).map(attach)
}

export const toggleBookmark = async ({ userId, targetType, targetId }) => {
  const existing = await Bookmark.findOne({ userId, targetType, targetId })
  if (existing) {
    await existing.deleteOne()
    return { bookmarked: false, bookmark: null }
  }
  const target = await findKnowledgeTarget({ userId, targetType, targetId })
  if (!target) return null
  const bookmark = await Bookmark.create({
    userId,
    targetType,
    targetId,
    title: target.title,
    metadata: { skill: target.skill, topic: target.topic },
  })
  return { bookmarked: true, bookmark }
}
