import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['note', 'resource'], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
)

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })

export default mongoose.model('Comment', commentSchema)
