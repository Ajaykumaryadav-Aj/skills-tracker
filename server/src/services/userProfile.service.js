import fs from 'fs/promises'
import path from 'path'
import { avatarUploadDir } from '../middlewares/uploadMiddleware.js'

export const publicUserFields = '-password'

export const profileFields = [
  'name',
  'bio',
  'location',
  'website',
  'github',
  'linkedin',
  'profession',
  'experienceLevel',
  'timezone',
  'learningGoal',
  'notificationPreferences',
  'learningGoals',
]

export const sanitizeProfilePayload = (body) =>
  profileFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      if (typeof body[field] === 'object' && body[field] !== null) {
        payload[field] = body[field]
      } else {
        payload[field] = String(body[field] || '').trim()
      }
    }
    return payload
  }, {})

export const avatarUrlFor = (filename) => `/uploads/avatars/${filename}`

export const deleteAvatarFile = async (filename) => {
  if (!filename) return
  const target = path.join(avatarUploadDir, path.basename(filename))
  try {
    await fs.unlink(target)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

export const getUploadsStorageSize = async () => {
  try {
    const files = await fs.readdir(avatarUploadDir)
    let totalSize = 0
    for (const file of files) {
      const stats = await fs.stat(path.join(avatarUploadDir, file))
      totalSize += stats.size
    }
    return totalSize
  } catch (error) {
    console.error('Error calculating storage size:', error)
    return 0
  }
}
