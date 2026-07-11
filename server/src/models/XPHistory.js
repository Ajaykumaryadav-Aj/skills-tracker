import mongoose from 'mongoose'

const xpHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventKey: { type: String, required: true },
    action: { type: String, required: true, index: true },
    sourceType: { type: String, required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    xp: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

xpHistorySchema.index({ userId: 1, eventKey: 1 }, { unique: true })
xpHistorySchema.index({ userId: 1, createdAt: -1 })

const XPHistory = mongoose.model('XPHistory', xpHistorySchema)
export default XPHistory
