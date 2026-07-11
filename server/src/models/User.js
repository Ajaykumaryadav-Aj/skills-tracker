import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date },
    lastLogin: { type: Date },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      secureUrl: { type: String, default: '' },
      resourceType: { type: String, default: '' },
      originalFilename: { type: String, default: '' },
      public_id: { type: String, default: '' },
      filename: { type: String, default: '' },
      mimetype: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    bio: { type: String, default: '', maxlength: 500 },
    location: { type: String, default: '', maxlength: 120 },
    website: { type: String, default: '', maxlength: 300 },
    github: { type: String, default: '', maxlength: 300 },
    linkedin: { type: String, default: '', maxlength: 300 },
    profession: { type: String, default: '', maxlength: 120 },
    experienceLevel: {
      type: String,
      enum: ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: '',
    },
    timezone: { type: String, default: '', maxlength: 80 },
    learningGoal: { type: String, default: '', maxlength: 800 },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      index: true,
    },
  },
  { timestamps: true }
)

userSchema.index({ createdAt: -1 })
userSchema.index({ role: 1, createdAt: -1 })

const User = mongoose.model('User', userSchema)
export default User
