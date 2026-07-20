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

const knowledgeMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
])

const knowledgeFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase().replace('.', '')
  const allowedExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp'])
  if (!knowledgeMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    return cb(httpError(400, 'Attachment must be a PDF or image file (jpg, jpeg, png, webp)', 'INVALID_ATTACHMENT_TYPE'))
  }
  return cb(null, true)
}

export const uploadKnowledgeAttachment = multer({
  storage: multer.memoryStorage(),
  fileFilter: knowledgeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // General limit 10MB (images strictly limited to 5MB in controller)
}).single('file')

const chatMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

const chatFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase().replace('.', '')
  const allowedExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'])
  if (!chatMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    return cb(httpError(400, 'Attachment must be a PDF, image (jpg, jpeg, png, webp, gif), or document (doc, docx, xls, xlsx, ppt, pptx, txt)', 'INVALID_ATTACHMENT_TYPE'))
  }
  cb(null, true)
}

export const uploadChatAttachment = multer({
  storage: multer.memoryStorage(),
  fileFilter: chatFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // Max 10MB
}).single('file')
