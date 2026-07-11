import mongoose from 'mongoose'

export const AI_HISTORY_TYPES = ['roadmap', 'planner', 'notes-summary', 'quiz', 'interview', 'weak-topics', 'recommendations', 'chat']

const aiHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: AI_HISTORY_TYPES, required: true, index: true },
    prompt: { type: String, required: true, maxlength: 20000 },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
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
