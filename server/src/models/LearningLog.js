import mongoose from 'mongoose'

export const SESSION_TYPES = ['Study', 'Practice', 'Revision', 'Project']

const learningLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    date: { type: Date, required: true },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    duration: { type: Number, required: true, min: 1 },
    sessionType: { type: String, enum: SESSION_TYPES, default: 'Study', index: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
)

learningLogSchema.pre('validate', function calculateDuration(next) {
  if (this.startTime && this.endTime) {
    const diffMinutes = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000)
    if (diffMinutes > 0) this.duration = diffMinutes
  }
  next()
})

learningLogSchema.index({ user: 1, date: -1 })
learningLogSchema.index({ user: 1, skill: 1, date: -1 })
learningLogSchema.index({ user: 1, topic: 1 })
learningLogSchema.index({ user: 1, sessionType: 1, date: -1 })

const LearningLog = mongoose.model('LearningLog', learningLogSchema)
export default LearningLog
