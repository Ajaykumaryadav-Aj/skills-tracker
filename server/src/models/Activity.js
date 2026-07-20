import mongoose from 'mongoose'

export const ACTIVITY_TYPES = [
  'skill-created',
  'topic-completed',
  'revision-completed',
  'achievement-unlocked',
  'xp-gained',
  'team-joined',
  'team-left',
  'session-added',
  'badge-earned',
  'goal-completed'
]

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 400 },
    sourceType: { type: String, default: '', trim: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

activitySchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Activity', activitySchema)
