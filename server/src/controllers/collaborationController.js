import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import Bookmark from '../models/Bookmark.js'
import Comment from '../models/Comment.js'
import User from '../models/User.js'
import {
  createActivity,
  findKnowledgeTarget,
  getCollaborationSummary,
  getPublicProfileBySlug,
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



export const getSummary = async (req, res, next) => {
  try {
    successResponse(res, 'Collaboration summary loaded', await getCollaborationSummary(req.user.id))
  } catch (err) {
    next(err)
  }
}
