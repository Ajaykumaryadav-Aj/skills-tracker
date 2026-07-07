import mongoose from 'mongoose'

const templateTopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subtopics: [
    {
      title: { type: String, required: true },
      description: { type: String },
      resources: [
        {
          title: { type: String },
          url: { type: String },
          type: { type: String },
          description: { type: String },
        },
      ],
    },
  ],
})

const templateSkillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  topics: [templateTopicSchema],
  estimatedHours: { type: Number },
})

const roadmapTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    estimatedHours: { type: Number },
    skills: [templateSkillSchema],
    prerequisites: [{ type: String }],
    keywords: [{ type: String }],
  },
  {
    timestamps: true,
  },
)

roadmapTemplateSchema.index({ category: 1, difficulty: 1 })
roadmapTemplateSchema.index({ createdAt: -1 })
roadmapTemplateSchema.index({ keywords: 1 })

const RoadmapTemplate = mongoose.model('RoadmapTemplate', roadmapTemplateSchema)
export default RoadmapTemplate
