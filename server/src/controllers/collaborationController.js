import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import Bookmark from '../models/Bookmark.js'
import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'
import Reminder from '../models/Reminder.js'
import Team from '../models/Team.js'
import User from '../models/User.js'
import {
  createActivity,
  createInviteCode,
  createNotification,
  findKnowledgeTarget,
  getCollaborationSummary,
  getPublicProfileBySlug,
  requireTeamAdmin,
  serializeComments,
  toggleBookmark,
} from '../services/collaboration.service.js'
import { successResponse } from '../utils/apiResponse.js'

const pageOptions = (query, fallback = 10) => ({
  page: Math.max(Number.parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || fallback, 1), 50),
})

const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
const normalizedEmail = (value) => String(value || '').trim().toLowerCase()
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value)

const ensureUniquePublicSlug = async (base, userId) => {
  let slug = base || `learner-${String(userId).slice(-6)}`
  let suffix = 1
  while (await User.exists({ _id: { $ne: userId }, 'publicProfile.slug': slug })) {
    suffix += 1
    slug = `${base}-${suffix}`
  }
  return slug
}

export const getMyPrivacy = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('publicProfile name').lean()
    successResponse(res, 'Privacy settings loaded', { publicProfile: user.publicProfile || {} })
  } catch (err) {
    next(err)
  }
}

export const updateMyPrivacy = async (req, res, next) => {
  try {
    const body = req.body || {}
    const current = await User.findById(req.user.id).select('name publicProfile')
    const slug = await ensureUniquePublicSlug(slugify(body.slug || current.publicProfile?.slug || current.name), req.user.id)
    current.publicProfile = {
      enabled: Boolean(body.enabled),
      slug,
      showLearningHours: body.showLearningHours !== false,
      showXp: body.showXp !== false,
      showBadges: body.showBadges !== false,
      showAchievements: body.showAchievements !== false,
    }
    await current.save()
    successResponse(res, 'Privacy settings updated', { publicProfile: current.publicProfile })
  } catch (err) {
    next(err)
  }
}

export const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await getPublicProfileBySlug(req.params.slug)
    if (!profile) return res.status(404).json({ success: false, message: 'Public profile not found', errors: [] })
    successResponse(res, 'Public profile loaded', profile)
  } catch (err) {
    next(err)
  }
}

export const createTeam = async (req, res, next) => {
  try {
    const team = await Team.create({
      name: String(req.body.name || '').trim(),
      description: String(req.body.description || '').trim(),
      inviteCode: createInviteCode(),
      ownerId: req.user.id,
      members: [{ userId: req.user.id, role: 'owner', status: 'active', joinedAt: new Date() }],
    })
    await createActivity({ userId: req.user.id, type: 'skill-created', title: `Created team ${team.name}`, sourceType: 'team', sourceId: team._id })
    successResponse(res, 'Team created', { team }, 201)
  } catch (err) {
    next(err)
  }
}

export const getTeams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('email').lean()
    const membershipFilters = [{ ownerId: req.user.id }, { 'members.userId': req.user.id }]
    if (user?.email) membershipFilters.push({ 'members.email': user.email })
    const teams = await Team.find({ $or: membershipFilters })
      .populate('members.userId', 'name email avatar')
      .sort({ updatedAt: -1 })
      .lean()
    successResponse(res, 'Teams loaded', { teams })
  } catch (err) {
    next(err)
  }
}

export const joinTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({ inviteCode: String(req.body.inviteCode || '').trim() })
    if (!team) return res.status(404).json({ success: false, message: 'Team invite not found', errors: [] })
    const existing = team.members.find((member) => String(member.userId || '') === String(req.user.id))
    if (existing) {
      existing.status = 'active'
      existing.joinedAt = new Date()
    } else {
      team.members.push({ userId: req.user.id, role: 'member', status: 'active', joinedAt: new Date() })
    }
    await team.save()
    await createActivity({ userId: req.user.id, type: 'skill-created', title: `Joined team ${team.name}`, sourceType: 'team', sourceId: team._id })
    successResponse(res, 'Joined team', { team })
  } catch (err) {
    next(err)
  }
}

export const inviteMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId)
    if (!team) return res.status(404).json({ success: false, message: 'Team not found', errors: [] })
    if (!requireTeamAdmin(team, req.user.id)) return res.status(403).json({ success: false, message: 'Only team admins can invite members', errors: [] })
    const email = normalizedEmail(req.body.email)
    const user = await User.findOne({ email }).select('_id email')
    if (team.members.some((member) => normalizedEmail(member.email) === email || (user && String(member.userId || '') === String(user._id)))) {
      return res.status(409).json({ success: false, message: 'This member is already invited or joined', errors: [] })
    }
    team.members.push({ userId: user?._id, email, role: req.body.role || 'member', status: user ? 'active' : 'invited', invitedBy: req.user.id })
    await team.save()
    if (user) await createNotification({ userId: user._id, type: 'Team Invite', title: `Team invite: ${team.name}`, message: 'You were added to a team.', sourceType: 'team', sourceId: team._id })
    successResponse(res, 'Invite sent', { team })
  } catch (err) {
    next(err)
  }
}

export const removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId)
    if (!team) return res.status(404).json({ success: false, message: 'Team not found', errors: [] })
    if (!requireTeamAdmin(team, req.user.id)) return res.status(403).json({ success: false, message: 'Only team admins can remove members', errors: [] })
    team.members = team.members.filter((member) => String(member._id) !== String(req.params.memberId) && member.role !== 'owner')
    await team.save()
    successResponse(res, 'Member removed', { team })
  } catch (err) {
    next(err)
  }
}

export const leaveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId)
    if (!team) return res.status(404).json({ success: false, message: 'Team not found', errors: [] })
    const member = team.members.find((item) => String(item.userId || '') === String(req.user.id))
    if (!member) return res.status(404).json({ success: false, message: 'Membership not found', errors: [] })
    if (member.role === 'owner') return res.status(400).json({ success: false, message: 'Owner cannot leave before transferring ownership', errors: [] })
    team.members = team.members.filter((item) => String(item.userId || '') !== String(req.user.id))
    await team.save()
    successResponse(res, 'Left team', { team })
  } catch (err) {
    next(err)
  }
}

export const getActivityFeed = async (req, res, next) => {
  try {
    const { page, limit } = pageOptions(req.query, 15)
    const query = { userId: req.user.id }
    if (req.query.type) query.type = req.query.type
    const [items, total] = await Promise.all([
      Activity.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Activity.countDocuments(query),
    ])
    successResponse(res, 'Activity feed loaded', { activities: items, pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } })
  } catch (err) {
    next(err)
  }
}

export const getComments = async (req, res, next) => {
  try {
    const target = await findKnowledgeTarget({ userId: req.user.id, targetType: req.params.targetType, targetId: req.params.targetId })
    if (!target) return res.status(404).json({ success: false, message: 'Target not found', errors: [] })
    const comments = await serializeComments({ targetType: req.params.targetType, targetId: req.params.targetId })
    successResponse(res, 'Comments loaded', { comments })
  } catch (err) {
    next(err)
  }
}

export const createComment = async (req, res, next) => {
  try {
    const target = await findKnowledgeTarget({ userId: req.user.id, targetType: req.params.targetType, targetId: req.params.targetId })
    if (!target) return res.status(404).json({ success: false, message: 'Target not found', errors: [] })
    if (req.body.parentId && !isObjectId(req.body.parentId)) return res.status(400).json({ success: false, message: 'Invalid parent comment', errors: [] })
    const comment = await Comment.create({
      userId: req.user.id,
      targetType: req.params.targetType,
      targetId: req.params.targetId,
      parentId: req.body.parentId || null,
      body: String(req.body.body || '').trim(),
    })
    successResponse(res, 'Comment added', { comment }, 201)
  } catch (err) {
    next(err)
  }
}

export const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOneAndUpdate({ _id: req.params.commentId, userId: req.user.id, deletedAt: null }, { body: String(req.body.body || '').trim() }, { new: true, runValidators: true })
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found', errors: [] })
    successResponse(res, 'Comment updated', { comment })
  } catch (err) {
    next(err)
  }
}

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOneAndUpdate({ _id: req.params.commentId, userId: req.user.id, deletedAt: null }, { deletedAt: new Date() }, { new: true })
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found', errors: [] })
    successResponse(res, 'Comment deleted', {})
  } catch (err) {
    next(err)
  }
}

export const toggleTargetBookmark = async (req, res, next) => {
  try {
    const result = await toggleBookmark({ userId: req.user.id, targetType: req.params.targetType, targetId: req.params.targetId })
    if (!result) return res.status(404).json({ success: false, message: 'Target not found', errors: [] })
    successResponse(res, result.bookmarked ? 'Bookmarked' : 'Bookmark removed', result)
  } catch (err) {
    next(err)
  }
}

export const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean()
    successResponse(res, 'Bookmarks loaded', { bookmarks })
  } catch (err) {
    next(err)
  }
}

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = pageOptions(req.query, 20)
    const query = { userId: req.user.id }
    if (req.query.unread === 'true') query.readAt = null
    const [notifications, total, unread] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user.id, readAt: null }),
    ])
    successResponse(res, 'Notifications loaded', { notifications, unread, pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } })
  } catch (err) {
    next(err)
  }
}

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { readAt: new Date() }, { new: true })
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found', errors: [] })
    successResponse(res, 'Notification marked read', { notification })
  } catch (err) {
    next(err)
  }
}

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, readAt: null }, { readAt: new Date() })
    successResponse(res, 'All notifications marked read', {})
  } catch (err) {
    next(err)
  }
}

export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user.id })
    successResponse(res, 'Notification deleted', {})
  } catch (err) {
    next(err)
  }
}

export const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.id }).sort({ date: 1, time: 1 }).limit(100).lean()
    successResponse(res, 'Reminders loaded', { reminders })
  } catch (err) {
    next(err)
  }
}

export const createReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.create({ userId: req.user.id, title: req.body.title, date: req.body.date, time: req.body.time || '09:00', repeat: req.body.repeat || 'none' })
    await createNotification({ userId: req.user.id, type: 'Reminder', title: `Reminder: ${reminder.title}`, message: 'A new reminder was created.', sourceType: 'reminder', sourceId: reminder._id })
    successResponse(res, 'Reminder created', { reminder }, 201)
  } catch (err) {
    next(err)
  }
}

export const updateReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true, runValidators: true, omitUndefined: true })
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found', errors: [] })
    successResponse(res, 'Reminder updated', { reminder })
  } catch (err) {
    next(err)
  }
}

export const deleteReminder = async (req, res, next) => {
  try {
    await Reminder.deleteOne({ _id: req.params.id, userId: req.user.id })
    successResponse(res, 'Reminder deleted', {})
  } catch (err) {
    next(err)
  }
}

export const getSummary = async (req, res, next) => {
  try {
    successResponse(res, 'Collaboration summary loaded', await getCollaborationSummary(req.user.id))
  } catch (err) {
    next(err)
  }
}
