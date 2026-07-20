import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['Not Started', 'Learning', 'Revision', 'Completed'],
    default: 'Not Started',
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  subtopics: [
    {
      title: { type: String, required: true },
      description: { type: String },
      status: {
        type: String,
        enum: ['Not Started', 'Learning', 'Revision', 'Completed'],
        default: 'Not Started',
      },
      resources: [
        {
          title: { type: String },
          url: { type: String },
          type: { type: String },
          description: { type: String },
        },
      ],
      notes: {
        content: { type: String },
        updatedAt: { type: Date },
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
})

const skillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  status: {
    type: String,
    enum: ['Not Started', 'In progress', 'Completed'],
    default: 'Not Started',
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  topics: [topicSchema],
  estimatedHours: { type: Number },
  targetDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
})

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String }, // emoji or icon identifier
    category: {
      type: String,
      enum: ['Frontend', 'Backend', 'Full Stack', 'Mobile', 'DevOps', 'Data Science', 'Other'],
      default: 'Other',
    },
    skills: [skillSchema],
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    isTemplate: { type: Boolean, default: false },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapTemplate' },
    sourceTemplate: { type: String }, // 'Frontend Developer', 'Backend Developer', etc.
    startDate: { type: Date },
    targetDate: { type: Date },
    estimatedHours: { type: Number },
    completedHours: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

// Calculate overall progress based on skills completion count
roadmapSchema.methods.recalculateProgress = function () {
  if (!this.skills || this.skills.length === 0) {
    this.progress = 0
    return 0
  }

  const completedCount = this.skills.filter((s) => s.status === 'Completed').length
  this.progress = Math.round((completedCount / this.skills.length) * 100)
  return this.progress
}

// Calculate overall status
roadmapSchema.methods.recalculateStatus = function () {
  if (!this.skills || this.skills.length === 0) {
    this.status = 'Not Started'
    return 'Not Started'
  }

  const allCompleted = this.skills.every((s) => s.status === 'Completed')
  const anyStarted = this.skills.some((s) => s.status === 'In progress' || (s.progress && s.progress > 0))

  if (allCompleted) {
    this.status = 'Completed'
  } else if (anyStarted) {
    this.status = 'In Progress'
  } else {
    this.status = 'Not Started'
  }

  return this.status
}

roadmapSchema.index({ user: 1, updatedAt: -1 })
roadmapSchema.index({ user: 1, status: 1 })
roadmapSchema.index({ user: 1, category: 1 })

const Roadmap = mongoose.model('Roadmap', roadmapSchema)
export default Roadmap
