import mongoose from 'mongoose'

export const TOPIC_STATUSES = ['Not Started', 'Learning', 'Revision', 'Completed', 'Skipped']
export const TOPIC_PRIORITIES = ['Low', 'Medium', 'High']

const topicSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    status: { type: String, enum: TOPIC_STATUSES, default: 'Not Started', index: true },
    priority: { type: String, enum: TOPIC_PRIORITIES, default: 'Medium', index: true },
    estimatedHours: { type: Number, min: 0, default: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    order: { type: Number, min: 0, default: 0 },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
)

topicSchema.pre('save', function syncCompletedAt(next) {
  if (this.isModified('status')) {
    if (this.status === 'Completed' && !this.completedAt) this.completedAt = new Date()
    if (this.status !== 'Completed') this.completedAt = null
  }
  next()
})

topicSchema.index({ userId: 1, skillId: 1, order: 1 })
topicSchema.index({ userId: 1, skillId: 1, status: 1, priority: 1 })
topicSchema.index({ userId: 1, skillId: 1, title: 1 })

const Topic = mongoose.model('Topic', topicSchema)
export default Topic
