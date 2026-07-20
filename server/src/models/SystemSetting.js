import mongoose from 'mongoose'

const systemSettingSchema = new mongoose.Schema(
  {
    aiProvider: { type: String, default: 'gemini' },
    uploadLimitsMb: { type: Number, default: 10 },
    allowedFileTypes: { type: [String], default: ['image/jpeg', 'image/png', 'application/pdf'] },
    sessionLimitsMinutes: { type: Number, default: 120 }
  },
  { timestamps: true }
)

export default mongoose.model('SystemSetting', systemSettingSchema)
