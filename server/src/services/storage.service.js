import { Readable } from 'stream'
import cloudinary from '../config/cloudinary.js'
import logger from '../config/logger.js'

const bufferToStream = (buffer) => {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

/**
 * Uploads a buffer to Cloudinary using streams.
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Destination folder in Cloudinary
 * @param {string} options.resourceType - Cloudinary resource type ('image', 'raw', 'video', 'auto')
 * @returns {Promise<Object>} Upload result details
 */
export const uploadStream = (buffer, { folder = 'skills-tracker', resourceType = 'auto', originalFilename = '' } = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
      secure: true,
    }

    const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        logger.error({ err: error }, 'Cloudinary stream upload failed')
        return reject(error)
      }
      resolve({
        publicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type || resourceType,
        originalFilename,
        // Keep legacy properties for backward compatibility
        secure_url: result.secure_url,
        public_id: result.public_id,
        size: result.bytes,
        format: result.format,
      })
    })

    bufferToStream(buffer).pipe(upload)
  })
}

/**
 * Deletes an asset from Cloudinary using its public ID.
 * @param {string} publicId - Asset public ID
 * @param {Object} options - Delete options
 * @param {string} options.resourceType - Cloudinary resource type ('image', 'raw', 'video')
 * @returns {Promise<Object>} Destroy result details
 */
export const deleteFile = async (publicId, { resourceType = 'image' } = {}) => {
  if (!publicId) return null
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        logger.error({ err: error, publicId }, 'Cloudinary destroy file failed')
        return reject(error)
      }
      resolve(result)
    })
  })
}
