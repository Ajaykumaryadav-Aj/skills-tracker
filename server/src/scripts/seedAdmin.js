import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { isAdminEmail } from '../utils/adminAccess.js'

dotenv.config()

const email = String(process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase()
const password = String(process.env.ADMIN_SEED_PASSWORD || '')

if (!email || !password) {
  throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required')
}

if (!isAdminEmail(email)) {
  throw new Error('ADMIN_SEED_EMAIL must be included in ADMIN_EMAILS')
}

if (password.length < 8) {
  throw new Error('Admin password must be at least 8 characters')
}

await mongoose.connect(process.env.MONGO_URI)

try {
  const passwordHash = await bcrypt.hash(password, 12)
  const existingUser = await User.findOne({ email })

  if (existingUser) {
    existingUser.password = passwordHash
    existingUser.role = 'admin'
    existingUser.emailVerified = true
    existingUser.verifiedAt = existingUser.verifiedAt || new Date()
    await existingUser.save()
  } else {
    await User.create({
      name: 'Admin',
      email,
      password: passwordHash,
      role: 'admin',
      emailVerified: true,
      verifiedAt: new Date(),
    })
  }

  console.log('Admin account created or updated successfully')
} finally {
  await mongoose.disconnect()
}
