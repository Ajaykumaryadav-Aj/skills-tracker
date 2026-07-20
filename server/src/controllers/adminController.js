import LearningLog from '../models/LearningLog.js'
import Roadmap from '../models/Roadmap.js'
import Skill from '../models/Skill.js'
import User from '../models/User.js'
import AuditLog from '../models/AuditLog.js'
import AIHistory from '../models/AIHistory.js'
import Topic from '../models/Topic.js'
import SystemSetting from '../models/SystemSetting.js'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { deleteFile } from '../services/storage.service.js'
import { getUploadsStorageSize } from '../services/userProfile.service.js'
import { logAuditEvent } from '../utils/auditLogger.js'

const maxPageLimit = 50
const userSortOptions = {
  latest: { createdAt: -1 },
  name: { name: 1 },
  email: { email: 1 },
}

const getPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildPagination = ({ page, limit, total }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

const bucketCounts = (items, labelKey = '_id', valueKey = 'count') =>
  items.reduce((acc, item) => {
    acc[item[labelKey] || 'Unknown'] = item[valueKey]
    return acc
  }, {})

export const getUsers = async (req, res, next) => {
  try {
    const {
      search = '',
      role = '',
      sort = 'latest',
      page: requestedPage,
      limit: requestedLimit,
    } = req.query

    const page = getPositiveInteger(requestedPage, 1)
    const limit = Math.min(getPositiveInteger(requestedLimit, 10), maxPageLimit)
    const selectedRole = String(role).trim()
    const searchTerm = String(search).trim()
    const query = {}

    if (selectedRole) {
      if (!['admin', 'user'].includes(selectedRole)) {
        return res.status(400).json({ message: 'Invalid role filter' })
      }
      query.role = selectedRole
    }

    if (searchTerm) {
      const pattern = new RegExp(escapeRegex(searchTerm), 'i')
      query.$or = [{ name: pattern }, { email: pattern }]
    }

    const sortConfig = userSortOptions[sort] || userSortOptions.latest
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortConfig)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    const userIds = users.map((user) => user._id)
    const [skillStats, logStats, roadmapStats] = await Promise.all([
      Skill.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            skillCount: { $sum: 1 },
            topicCount: { $sum: { $size: { $ifNull: ['$topics', []] } } },
            completedSkills: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            averageProgress: { $avg: '$progress' },
            lastActivity: { $max: '$updatedAt' },
          },
        },
      ]),
      LearningLog.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            logCount: { $sum: 1 },
            learningMinutes: { $sum: '$duration' },
          },
        },
      ]),
      Roadmap.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            roadmapCount: { $sum: 1 },
          },
        },
      ]),
    ])

    const statsByUser = new Map()
    for (const item of [...skillStats, ...logStats, ...roadmapStats]) {
      const key = String(item._id)
      statsByUser.set(key, { ...(statsByUser.get(key) || {}), ...item })
    }

    const enrichedUsers = users.map((user) => {
      const stats = statsByUser.get(String(user._id)) || {}
      return {
        ...user,
        role: user.role || 'user',
        stats: {
          skillCount: stats.skillCount || 0,
          topicCount: stats.topicCount || 0,
          completedSkills: stats.completedSkills || 0,
          averageProgress: Math.round(stats.averageProgress || 0),
          logCount: stats.logCount || 0,
          learningMinutes: stats.learningMinutes || 0,
          roadmapCount: stats.roadmapCount || 0,
          lastActivity: stats.lastActivity || user.updatedAt,
        },
      }
    })

    res.json({
      users: enrichedUsers,
      pagination: buildPagination({ page, limit, total }),
      filters: {
        roles: ['admin', 'user'],
        sortOptions: Object.keys(userSortOptions),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    if (String(req.currentUser.id) === userId) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if ((user.role || 'user') === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin account' })
      }
    }

    await Promise.all([
      Skill.deleteMany({ user: userId }),
      LearningLog.deleteMany({ user: userId }),
      Roadmap.deleteMany({ user: userId }),
      User.deleteOne({ _id: userId }),
    ])

    await logAuditEvent(req, req.currentUser.id, 'admin-delete-user', { deletedUserId: userId, userEmail: user.email })

    res.json({ message: 'User and related data deleted' })
  } catch (err) {
    next(err)
  }
}

export const getSkillsStatistics = async (req, res, next) => {
  try {
    const [overview, byStatus, byCategory, topicStatusBreakdown, progressBuckets] = await Promise.all([
      Skill.aggregate([
        {
          $group: {
            _id: null,
            totalSkills: { $sum: 1 },
            averageProgress: { $avg: '$progress' },
            totalTopics: { $sum: { $size: { $ifNull: ['$topics', []] } } },
            notesCount: {
              $sum: {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$topics', []] },
                    as: 'topic',
                    cond: { $gt: [{ $strLenCP: { $ifNull: ['$$topic.notes.content', ''] } }, 0] },
                  },
                },
              },
            },
            resourceCount: {
              $sum: {
                $sum: {
                  $map: {
                    input: { $ifNull: ['$topics', []] },
                    as: 'topic',
                    in: { $size: { $ifNull: ['$$topic.resources', []] } },
                  },
                },
              },
            },
          },
        },
      ]),
      Skill.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Skill.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Skill.aggregate([
        { $unwind: '$topics' },
        { $group: { _id: '$topics.status', count: { $sum: 1 } } },
      ]),
      Skill.aggregate([
        {
          $bucket: {
            groupBy: '$progress',
            boundaries: [0, 25, 50, 75, 101],
            default: 'Unknown',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ])

    res.json({
      overview: {
        totalSkills: overview[0]?.totalSkills || 0,
        averageProgress: Math.round(overview[0]?.averageProgress || 0),
        totalTopics: overview[0]?.totalTopics || 0,
        notesCount: overview[0]?.notesCount || 0,
        resourceCount: overview[0]?.resourceCount || 0,
      },
      byStatus: bucketCounts(byStatus),
      byCategory: bucketCounts(byCategory),
      topicStatusBreakdown: bucketCounts(topicStatusBreakdown),
      progressBuckets: progressBuckets.map((bucket) => ({
        range: bucket._id === 'Unknown' ? 'Unknown' : `${bucket._id}-${bucket._id === 75 ? 100 : bucket._id + 24}`,
        count: bucket.count,
      })),
    })
  } catch (err) {
    next(err)
  }
}

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalUsers,
      adminUsers,
      totalSkills,
      totalRoadmaps,
      logTotals,
      activeUsersFromSkills,
      activeUsersFromLogs,
      recentUsers,
      recentSkills,
      statusBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Skill.countDocuments(),
      Roadmap.countDocuments(),
      LearningLog.aggregate([
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            learningMinutes: { $sum: '$duration' },
          },
        },
      ]),
      Skill.distinct('user', { updatedAt: { $gte: thirtyDaysAgo } }),
      LearningLog.distinct('user', { createdAt: { $gte: thirtyDaysAgo } }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5).lean(),
      Skill.find()
        .select('title category status progress user updatedAt')
        .populate('user', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Skill.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ])

    const activeUserIds = new Set([
      ...activeUsersFromSkills.map(String),
      ...activeUsersFromLogs.map(String),
    ])

    res.json({
      summary: {
        totalUsers,
        adminUsers,
        regularUsers: Math.max(totalUsers - adminUsers, 0),
        totalSkills,
        totalRoadmaps,
        totalLogs: logTotals[0]?.totalLogs || 0,
        learningMinutes: logTotals[0]?.learningMinutes || 0,
        activeUsers30d: activeUserIds.size,
      },
      skillStatusBreakdown: bucketCounts(statusBreakdown),
      recentUsers: recentUsers.map((user) => ({ ...user, role: user.role || 'user' })),
      recentSkills,
    })
  } catch (err) {
    next(err)
  }
}

export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      search = '',
      action = '',
      page: requestedPage,
      limit: requestedLimit,
    } = req.query

    const page = getPositiveInteger(requestedPage, 1)
    const limit = Math.min(getPositiveInteger(requestedLimit, 20), maxPageLimit)
    const query = {}

    if (action) {
      query.action = action
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i')
      const matchingUsers = await User.find({
        $or: [{ name: pattern }, { email: pattern }]
      }).select('_id').lean()
      const userIds = matchingUsers.map(u => u._id)
      
      query.$or = [
        { userId: { $in: userIds } },
        { action: new RegExp(escapeRegex(search), 'i') }
      ]
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ])

    res.json({
      logs,
      pagination: buildPagination({ page, limit, total, isPaginated: true }),
    })
  } catch (err) {
    next(err)
  }
}

export const getAIUsageStats = async (req, res, next) => {
  try {
    const usage = await AIHistory.aggregate([
      {
        $group: {
          _id: { type: '$type', provider: '$provider' },
          count: { $sum: 1 },
          lastUsed: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id.type',
          provider: '$_id.provider',
          count: 1,
          lastUsed: 1
        }
      },
      { $sort: { count: -1 } }
    ])

    res.json({ usage })
  } catch (err) {
    next(err)
  }
}

export const getStorageUsageStats = async (req, res, next) => {
  try {
    const localSize = await getUploadsStorageSize()
    const dbSizeResult = await User.aggregate([
      { $match: { 'avatar.url': { $ne: '' } } },
      { $group: { _id: null, totalSize: { $sum: '$avatar.size' } } }
    ])
    const dbSize = dbSizeResult[0]?.totalSize || 0
    const totalSize = dbSize || localSize
    const totalAvatars = await User.countDocuments({ 'avatar.url': { $ne: '' } })
    
    res.json({
      avatarStorageBytes: totalSize,
      avatarStorageMb: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      totalAvatars,
    })
  } catch (err) {
    next(err)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (name) user.name = name
    if (email) user.email = email.toLowerCase().trim()
    if (role) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' })
      }
      user.role = role
    }

    await user.save()
    await logAuditEvent(req, req.currentUser.id, 'admin-update-user', { targetUserId: user._id, name, email, role })
    res.json({ message: 'User updated successfully', user })
  } catch (err) {
    next(err)
  }
}

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (String(req.currentUser.id) === String(user._id)) {
      return res.status(400).json({ message: 'Admins cannot deactivate their own accounts' })
    }

    user.isActive = user.isActive === false ? true : false
    await user.save()

    await logAuditEvent(req, req.currentUser.id, 'admin-toggle-user-status', { targetUserId: user._id, isActive: user.isActive })
    res.json({ message: `User status changed to ${user.isActive ? 'active' : 'inactive'}`, user })
  } catch (err) {
    next(err)
  }
}

export const verifyUserEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.emailVerified = true
    user.verifiedAt = user.verifiedAt || new Date()
    await user.save()

    await logAuditEvent(req, req.currentUser.id, 'admin-verify-user-email', { targetUserId: user._id })
    res.json({ message: 'User email verified successfully', user })
  } catch (err) {
    next(err)
  }
}

export const resetUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const hash = await bcrypt.hash(password, 10)
    user.password = hash
    await user.save()

    await logAuditEvent(req, req.currentUser.id, 'admin-reset-password', { targetUserId: user._id })
    res.json({ message: 'User password reset successfully' })
  } catch (err) {
    next(err)
  }
}

export const getSystemSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne()
    if (!settings) {
      settings = await SystemSetting.create({})
    }
    res.json(settings)
  } catch (err) {
    next(err)
  }
}

export const updateSystemSettings = async (req, res, next) => {
  try {
    const { aiProvider, uploadLimitsMb, allowedFileTypes, sessionLimitsMinutes } = req.body
    let settings = await SystemSetting.findOne()
    if (!settings) {
      settings = new SystemSetting()
    }

    if (aiProvider) settings.aiProvider = aiProvider
    if (uploadLimitsMb !== undefined) settings.uploadLimitsMb = Number(uploadLimitsMb)
    if (allowedFileTypes) settings.allowedFileTypes = allowedFileTypes
    if (sessionLimitsMinutes !== undefined) settings.sessionLimitsMinutes = Number(sessionLimitsMinutes)

    await settings.save()
    await logAuditEvent(req, req.currentUser.id, 'admin-update-settings', { settings })
    res.json({ message: 'Settings updated successfully', settings })
  } catch (err) {
    next(err)
  }
}

export const getSkillsList = async (req, res, next) => {
  try {
    const page = getPositiveInteger(req.query.page, 1)
    const limit = Math.min(getPositiveInteger(req.query.limit, 10), maxPageLimit)
    const search = String(req.query.search || '').trim()

    const query = { deletedAt: null }
    if (search) {
      query.title = new RegExp(escapeRegex(search), 'i')
    }

    const [skills, total] = await Promise.all([
      Skill.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Skill.countDocuments(query),
    ])

    res.json({ skills, pagination: buildPagination({ page, limit, total }) })
  } catch (err) {
    next(err)
  }
}

export const deleteSkillAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const skill = await Skill.findById(id)
    if (!skill) return res.status(404).json({ message: 'Skill not found' })

    await Promise.all([
      Skill.deleteOne({ _id: id }),
      Topic.deleteMany({ skillId: id }),
      LearningLog.deleteMany({ skill: id }),
    ])

    await logAuditEvent(req, req.currentUser.id, 'admin-delete-skill', { deletedSkillId: id, title: skill.title })
    res.json({ message: 'Skill and associated topics/logs deleted' })
  } catch (err) {
    next(err)
  }
}

export const getTopicsList = async (req, res, next) => {
  try {
    const page = getPositiveInteger(req.query.page, 1)
    const limit = Math.min(getPositiveInteger(req.query.limit, 10), maxPageLimit)
    const search = String(req.query.search || '').trim()

    const query = { deletedAt: null }
    if (search) {
      query.title = new RegExp(escapeRegex(search), 'i')
    }

    const [topics, total] = await Promise.all([
      Topic.find(query)
        .populate('userId', 'name email')
        .populate('skillId', 'title slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Topic.countDocuments(query),
    ])

    res.json({ topics, pagination: buildPagination({ page, limit, total }) })
  } catch (err) {
    next(err)
  }
}

export const deleteTopicAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const topic = await Topic.findById(id)
    if (!topic) return res.status(404).json({ message: 'Topic not found' })

    await Promise.all([
      Topic.deleteOne({ _id: id }),
      LearningLog.deleteMany({ topic: id }),
    ])

    await logAuditEvent(req, req.currentUser.id, 'admin-delete-topic', { deletedTopicId: id, title: topic.title })
    res.json({ message: 'Topic and associated logs deleted' })
  } catch (err) {
    next(err)
  }
}

export const getLogsList = async (req, res, next) => {
  try {
    const page = getPositiveInteger(req.query.page, 1)
    const limit = Math.min(getPositiveInteger(req.query.limit, 10), maxPageLimit)
    const search = String(req.query.search || '').trim()

    const query = {}
    if (search) {
      query.notes = new RegExp(escapeRegex(search), 'i')
    }

    const [logs, total] = await Promise.all([
      LearningLog.find(query)
        .populate('user', 'name email')
        .populate('skill', 'title slug')
        .populate('topic', 'title')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LearningLog.countDocuments(query),
    ])

    res.json({ logs, pagination: buildPagination({ page, limit, total }) })
  } catch (err) {
    next(err)
  }
}

export const deleteLogAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const log = await LearningLog.findById(id)
    if (!log) return res.status(404).json({ message: 'Learning log not found' })

    await LearningLog.deleteOne({ _id: id })

    await logAuditEvent(req, req.currentUser.id, 'admin-delete-log', { deletedLogId: id })
    res.json({ message: 'Learning log deleted' })
  } catch (err) {
    next(err)
  }
}

export const getUploadedFilesList = async (req, res, next) => {
  try {
    const avatars = await User.find({ 'avatar.url': { $ne: '' } }).select('name email avatar').lean()
    const skillsWithFiles = await Skill.find({ 'topics.resources.file.url': { $exists: true } }).select('title user topics.title topics.resources').lean()

    const files = []

    avatars.forEach(user => {
      files.push({
        id: `avatar-${user._id}`,
        type: 'Avatar',
        url: user.avatar.url,
        publicId: user.avatar.publicId || user.avatar.public_id,
        filename: user.avatar.originalFilename || 'avatar.jpg',
        mimetype: user.avatar.mimetype || 'image/jpeg',
        size: user.avatar.size || 0,
        owner: { name: user.name, email: user.email },
        refId: user._id,
        refModel: 'User'
      })
    })

    skillsWithFiles.forEach(skill => {
      ;(skill.topics || []).forEach(topic => {
        ;(topic.resources || []).forEach(res => {
          if (res.file && res.file.url) {
            files.push({
              id: res._id || `res-${Math.random()}`,
              type: res.type || 'Attachment',
              url: res.file.url,
              publicId: res.file.publicId || res.file.public_id,
              filename: res.file.originalName || res.file.originalFilename || 'attachment.pdf',
              mimetype: res.file.mimetype || 'application/pdf',
              size: res.file.size || 0,
              owner: { name: 'Workspace User' },
              refId: skill._id,
              refModel: 'Skill',
              topicTitle: topic.title,
              skillTitle: skill.title
            })
          }
        })
      })
    })

    res.json({ files })
  } catch (err) {
    next(err)
  }
}

export const deleteFileAdmin = async (req, res, next) => {
  try {
    const { publicId, refId, refModel } = req.body
    if (!publicId) return res.status(400).json({ message: 'publicId is required' })

    await deleteFile(publicId).catch(() => {})

    if (refModel === 'User') {
      const user = await User.findById(refId)
      if (user) {
        user.avatar = undefined
        await user.save()
      }
    } else if (refModel === 'Skill') {
      const skill = await Skill.findById(refId)
      if (skill) {
        let updated = false
        ;(skill.topics || []).forEach(topic => {
          topic.resources = (topic.resources || []).filter(res => {
            if (res.file && (res.file.publicId === publicId || res.file.public_id === publicId)) {
              updated = true
              return false
            }
            return true
          })
        })
        if (updated) {
          await skill.save()
        }
      }
    }

    await logAuditEvent(req, req.currentUser.id, 'admin-delete-file', { publicId })
    res.json({ message: 'File and references deleted successfully' })
  } catch (err) {
    next(err)
  }
}

export const getLogFileContent = async (req, res, next) => {
  try {
    const { category } = req.query
    if (!['requests', 'errors', 'auth', 'ai', 'uploads'].includes(category)) {
      return res.status(400).json({ message: 'Invalid log category' })
    }

    const logsDir = path.join(process.cwd(), 'logs')
    const filePath = path.join(logsDir, `${category}.log`)

    if (!fs.existsSync(filePath)) {
      return res.json({ content: '' })
    }

    // Read last 100 lines
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const lines = fileContent.trim().split('\n').slice(-100).reverse()
    res.json({ content: lines.join('\n') })
  } catch (err) {
    next(err)
  }
}


