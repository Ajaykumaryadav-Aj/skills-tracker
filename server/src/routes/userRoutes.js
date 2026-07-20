import express from 'express'
import {
  changePassword,
  deleteProfileAvatar,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
} from '../controllers/userController.js'
import auth from '../middlewares/authMiddleware.js'
import { changePasswordLimiter } from '../middlewares/rateLimiters.js'
import { uploadAvatar } from '../middlewares/uploadMiddleware.js'
import validate from '../middlewares/validationMiddleware.js'
import { changePasswordValidator, updateProfileValidator } from '../validations/userValidators.js'

const router = express.Router()

router.use(auth)

router.get('/profile', getProfile)
router.put('/profile', updateProfileValidator, validate, updateProfile)

router.post('/avatar', uploadAvatar, uploadProfileAvatar)
router.delete('/avatar', deleteProfileAvatar)
router.put('/change-password', changePasswordLimiter, changePasswordValidator, validate, changePassword)

export default router
