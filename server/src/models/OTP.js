import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    otpHash: { type: String, required: true, select: false },
    purpose: {
      type: String,
      enum: ['register', 'forgot-password'],
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0, min: 0 },
    resendCount: { type: Number, default: 0, min: 0 },
    lastSentAt: { type: Date, required: true },
    windowStartedAt: { type: Date, required: true },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
)

otpSchema.index({ userId: 1, purpose: 1 }, { unique: true })
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const OTP = mongoose.model('OTP', otpSchema)
export default OTP
