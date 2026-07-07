import mongoose from 'mongoose'
import { TOPIC_PRIORITIES, TOPIC_STATUSES } from './Topic.js'

export const SKILL_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
export const SKILL_STATUSES = ['Not Started', 'Learning', 'Completed', 'Paused']

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['article', 'video', 'course', 'documentation', 'tutorial', 'other'],
      default: 'other',
    },
    description: { type: String },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: TOPIC_STATUSES,
      default: 'Not Started',
    },
    priority: { type: String, enum: TOPIC_PRIORITIES, default: 'Medium' },
    estimatedHours: { type: Number, min: 0, default: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    order: { type: Number, min: 0, default: 0 },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: {
      content: { type: String },
      updatedAt: { type: Date },
    },
    resources: [resourceSchema],
  },
  { timestamps: true },
)

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true },
    icon: { type: String, default: 'BookOpenCheck', trim: true },
    color: { type: String, default: '#087f62', trim: true },
    difficulty: {
      type: String,
      enum: SKILL_DIFFICULTIES,
      default: 'Beginner',
    },
    status: {
      type: String,
      enum: SKILL_STATUSES,
      default: 'Not Started',
    },
    targetDate: { type: Date },
    targetCompletionDate: { type: Date },
    estimatedHours: { type: Number, min: 0 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    isFavorite: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    topics: [topicSchema],
  },
  {
    timestamps: true,
  },
)

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'skill'

skillSchema.pre('validate', function syncCompatibilityFields(next) {
  if (!this.userId && this.user) this.userId = this.user
  if (!this.user && this.userId) this.user = this.userId
  if (this.targetCompletionDate && !this.targetDate) this.targetDate = this.targetCompletionDate
  if (this.targetDate && !this.targetCompletionDate) this.targetCompletionDate = this.targetDate
  if (!this.slug || this.isModified('title')) this.slug = slugify(this.title)
  if (this.status === 'Not started') this.status = 'Not Started'
  if (this.status === 'In progress') this.status = 'Learning'
  next()
})

// recalculate progress based on topics
skillSchema.methods.recalculateProgress = function () {
  if (!this.topics || this.topics.length === 0) {
    this.progress = 0
    return this.progress
  }

  const completed = this.topics.filter((topic) => topic.status === 'Completed').length
  this.progress = Math.round((completed / this.topics.length) * 100)
  return this.progress
}

skillSchema.index({ user: 1, updatedAt: -1 })
skillSchema.index({ userId: 1, updatedAt: -1 })
skillSchema.index({ user: 1, status: 1, category: 1 })
skillSchema.index({ userId: 1, slug: 1, deletedAt: 1 })
skillSchema.index({ user: 1, progress: -1 })
skillSchema.index({ user: 1, 'topics.status': 1 })
skillSchema.index(
  {
    user: 1,
    title: 'text',
    description: 'text',
    category: 'text',
    'topics.title': 'text',
  },
  {
    weights: {
      title: 6,
      'topics.title': 5,
      category: 3,
      description: 1,
    },
  },
)

const Skill = mongoose.model('Skill', skillSchema)
export default Skill
