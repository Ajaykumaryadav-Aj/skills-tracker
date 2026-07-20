import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import {
  avatarUrlFor,
  deleteAvatarFile,
  publicUserFields,
  sanitizeProfilePayload,
} from '../services/userProfile.service.js'
import { successResponse } from '../utils/apiResponse.js'
import httpError from '../utils/httpError.js'
import { logAuditEvent } from '../utils/auditLogger.js'
import { uploadStream, deleteFile } from '../services/storage.service.js'
import { logToFile } from '../utils/fileLogger.js'

const getUserOrThrow = async (userId, select = publicUserFields) => {
  const user = await User.findById(userId).select(select)
  if (!user) throw httpError(404, 'User not found', 'USER_NOT_FOUND')
  return user
}

export const getProfile = async (req, res, next) => {
  try {
    const user = await getUserOrThrow(req.user.id)
    return successResponse(res, 'Profile fetched successfully.', { user })
  } catch (err) {
    next(err)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const user = await getUserOrThrow(req.user.id)
    Object.assign(user, sanitizeProfilePayload(req.body))
    await user.save()
    await logAuditEvent(req, req.user.id, 'profile-update', { email: user.email })
    return successResponse(res, 'Profile updated successfully.', { user })
  } catch (err) {
    next(err)
  }
}

export const uploadProfileAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw httpError(400, 'Avatar image is required', 'AVATAR_REQUIRED')
    const user = await getUserOrThrow(req.user.id)
    const oldPublicId = user.avatar?.publicId || user.avatar?.public_id
    const oldFilename = user.avatar?.filename

    // Stream upload to Cloudinary
    const result = await uploadStream(req.file.buffer, {
      folder: 'skills-tracker/profile-images',
      resourceType: 'image',
      originalFilename: req.file.originalname
    })

    user.avatar = {
      url: result.secureUrl,
      publicId: result.publicId,
      secureUrl: result.secureUrl,
      resourceType: result.resourceType,
      originalFilename: req.file.originalname,
      public_id: result.publicId,
      filename: '',
      mimetype: req.file.mimetype,
      size: result.size || req.file.size
    }
    await user.save()

    // Clean up old files
    if (oldPublicId) {
      await deleteFile(oldPublicId, { resourceType: 'image' }).catch(() => {})
    } else if (oldFilename) {
      await deleteAvatarFile(oldFilename).catch(() => {})
    }

    const updatedUser = await getUserOrThrow(req.user.id)
    await logAuditEvent(req, req.user.id, 'profile-avatar-upload', { publicId: result.publicId })
    logToFile('uploads', 'info', `Profile avatar uploaded for user ${req.user.id}`, {
      filename: req.file.originalname,
      size: req.file.size,
      publicId: result.publicId,
    })

    return successResponse(res, 'Avatar uploaded successfully.', { user: updatedUser })
  } catch (err) {
    next(err)
  }
}

export const deleteProfileAvatar = async (req, res, next) => {
  try {
    const user = await getUserOrThrow(req.user.id)
    const oldPublicId = user.avatar?.publicId || user.avatar?.public_id
    const oldFilename = user.avatar?.filename

    user.avatar = {
      url: '',
      publicId: '',
      secureUrl: '',
      resourceType: '',
      originalFilename: '',
      public_id: '',
      filename: '',
      mimetype: '',
      size: 0
    }
    await user.save()

    // Clean up old files
    if (oldPublicId) {
      await deleteFile(oldPublicId, { resourceType: 'image' }).catch(() => {})
    } else if (oldFilename) {
      await deleteAvatarFile(oldFilename).catch(() => {})
    }

    const updatedUser = await getUserOrThrow(req.user.id)
    await logAuditEvent(req, req.user.id, 'profile-avatar-delete', { oldPublicId, oldFilename })

    return successResponse(res, 'Avatar removed successfully.', { user: updatedUser })
  } catch (err) {
    next(err)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const user = await getUserOrThrow(req.user.id, '+password')
    const currentMatches = await bcrypt.compare(req.body.currentPassword, user.password)
    if (!currentMatches) {
      throw httpError(400, 'Unable to change password. Please check your details and try again.', 'CHANGE_PASSWORD_FAILED')
    }

    const samePassword = await bcrypt.compare(req.body.newPassword, user.password)
    if (samePassword) {
      throw httpError(400, 'Unable to change password. Please choose a different password.', 'PASSWORD_REUSED')
    }

    user.password = await bcrypt.hash(req.body.newPassword, 10)
    user.updatedAt = new Date()
    await user.save()


    await logAuditEvent(req, req.user.id, 'password-change-authorized', { email: user.email })

    return successResponse(res, 'Password changed successfully.')
  } catch (err) {
    next(err)
  }
}


