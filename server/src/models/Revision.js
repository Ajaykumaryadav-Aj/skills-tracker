import mongoose from 'mongoose'

export const REVISION_STATUSES = ['Upcoming', 'Due Today', 'Completed', 'Missed', 'Snoozed']

const revisionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    revisionDate: { type: Date, required: true, index: true },
    scheduleDay: { type: Number, required: true, min: 1, index: true },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: REVISION_STATUSES, default: 'Upcoming', index: true },
    snoozeUntil: { type: Date, default: null, index: true },
    notes: { type: String, default: '', trim: true, maxlength: 5000 },
  },
  { timestamps: true },
)

revisionSchema.index({ userId: 1, skillId: 1, topicId: 1, revisionDate: 1 }, { unique: true })
revisionSchema.index({ userId: 1, skillId: 1, topicId: 1, scheduleDay: 1 }, { unique: true })
revisionSchema.index({ userId: 1, status: 1, revisionDate: 1 })
revisionSchema.index({ userId: 1, completedAt: -1 })

revisionSchema.pre('validate', function validateStatusTransitions(next) {
  if (this.completedAt && this.status !== 'Completed') this.status = 'Completed'
  next()
})

const Revision = mongoose.model('Revision', revisionSchema)
export default Revision
