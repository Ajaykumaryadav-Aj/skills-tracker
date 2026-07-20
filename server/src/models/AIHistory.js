import mongoose from 'mongoose'

export const AI_HISTORY_TYPES = [
  'roadmap',
  'structured-roadmap',
  'planner',
  'notes-summary',
  'interview',
  'weak-topics',
  'recommendations',
  'chat',
  'debug',
  'notes-generator',
  'resources'
]

const aiHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: AI_HISTORY_TYPES, required: true, index: true },
    title: { type: String, default: '' },
    prompt: { type: String, required: true, maxlength: 20000 },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
    content: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    provider: { type: String, default: 'mock' },
    model: { type: String, default: '' },
    cacheKey: { type: String, required: true },
  },
  { timestamps: true },
)

aiHistorySchema.index({ userId: 1, type: 1, createdAt: -1 })
aiHistorySchema.index({ userId: 1, cacheKey: 1 })

const AIHistory = mongoose.model('AIHistory', aiHistorySchema)
export default AIHistory
