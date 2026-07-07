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
    return successResponse(res, 'Profile updated successfully.', { user })
  } catch (err) {
    next(err)
  }
}

export const uploadProfileAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw httpError(400, 'Avatar image is required', 'AVATAR_REQUIRED')
    const user = await getUserOrThrow(req.user.id)
    const oldFilename = user.avatar?.filename

    user.avatar = {
      url: avatarUrlFor(req.file.filename),
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    }
    await user.save()
    await deleteAvatarFile(oldFilename)
    const updatedUser = await getUserOrThrow(req.user.id)

    return successResponse(res, 'Avatar uploaded successfully.', { user: updatedUser })
  } catch (err) {
    if (req.file?.filename) await deleteAvatarFile(req.file.filename).catch(() => {})
    next(err)
  }
}

export const deleteProfileAvatar = async (req, res, next) => {
  try {
    const user = await getUserOrThrow(req.user.id)
    const oldFilename = user.avatar?.filename
    user.avatar = { url: '', filename: '', mimetype: '', size: 0 }
    await user.save()
    await deleteAvatarFile(oldFilename)
    const updatedUser = await getUserOrThrow(req.user.id)

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

    return successResponse(res, 'Password changed successfully.')
  } catch (err) {
    next(err)
  }
}
