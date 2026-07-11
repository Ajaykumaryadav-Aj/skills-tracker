import mongoose from 'mongoose'

export const NOTIFICATION_TYPES = ['Achievement', 'Revision Due', 'Daily Goal', 'Team Invite', 'AI Ready', 'Reminder']

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, default: '', trim: true, maxlength: 500 },
    readAt: { type: Date, default: null, index: true },
    sourceType: { type: String, default: '', trim: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
