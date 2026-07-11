import mongoose from 'mongoose'

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['note', 'resource'], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

bookmarkSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true })
bookmarkSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('Bookmark', bookmarkSchema)
