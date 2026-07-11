import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import httpError from '../utils/httpError.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const avatarUploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars')
export const knowledgeUploadDir = path.join(__dirname, '..', '..', 'uploads', 'knowledge')

fs.mkdirSync(avatarUploadDir, { recursive: true })
fs.mkdirSync(knowledgeUploadDir, { recursive: true })

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    cb(null, `${req.user.id}-${Date.now()}${extension}`)
  },
})

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase().replace('.', '')
  if (!allowedMimeTypes.has(file.mimetype) || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    return cb(httpError(400, 'Avatar must be a jpg, jpeg, png, or webp image', 'INVALID_AVATAR_TYPE'))
  }
  return cb(null, true)
}

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
}).single('avatar')

const knowledgeMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
])

const knowledgeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, knowledgeUploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    cb(null, `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`)
  },
})

const knowledgeFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase()
  const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.zip'])
  if (!knowledgeMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    return cb(httpError(400, 'Attachment must be a PDF, image, or ZIP file', 'INVALID_ATTACHMENT_TYPE'))
  }
  return cb(null, true)
}

export const uploadKnowledgeAttachment = multer({
  storage: knowledgeStorage,
  fileFilter: knowledgeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('file')
