import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import httpError from '../utils/httpError.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const avatarUploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars')

fs.mkdirSync(avatarUploadDir, { recursive: true })

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase().replace('.', '')
  if (!allowedMimeTypes.has(file.mimetype) || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    return cb(httpError(400, 'Avatar must be a jpg, jpeg, png, or webp image', 'INVALID_AVATAR_TYPE'))
  }
  return cb(null, true)
}

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // Max 5MB for avatar
}).single('avatar')
