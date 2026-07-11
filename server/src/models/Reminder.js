import mongoose from 'mongoose'

export const REMINDER_REPEATS = ['none', 'daily', 'weekly', 'monthly']

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    date: { type: Date, required: true, index: true },
    time: { type: String, default: '09:00', trim: true },
    repeat: { type: String, enum: REMINDER_REPEATS, default: 'none' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

reminderSchema.index({ userId: 1, date: 1 })

export default mongoose.model('Reminder', reminderSchema)
