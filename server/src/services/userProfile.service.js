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
]

export const sanitizeProfilePayload = (body) =>
  profileFields.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = String(body[field] || '').trim()
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
