import mongoose from 'mongoose'

const learningLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    date: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
)

learningLogSchema.index({ user: 1, date: -1 })
learningLogSchema.index({ user: 1, skill: 1, date: -1 })
learningLogSchema.index({ user: 1, topic: 1 })

const LearningLog = mongoose.model('LearningLog', learningLogSchema)
export default LearningLog
