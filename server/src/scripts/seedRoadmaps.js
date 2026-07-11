import mongoose from 'mongoose'
import dotenv from 'dotenv'
import RoadmapTemplate from '../models/RoadmapTemplate.js'
import { roadmapTemplates } from '../data/roadmapTemplates.js'

dotenv.config()

const seedRoadmapTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skills-tracker')
    console.log('Connected to MongoDB')

    // Clear existing templates
    await RoadmapTemplate.deleteMany({})
    console.log('Cleared existing templates')

    // Insert new templates
    const created = await RoadmapTemplate.insertMany(roadmapTemplates)
    console.log(`Created ${created.length} roadmap templates`)

    // List created templates
    const templates = await RoadmapTemplate.find({})
    console.log('Created templates:', templates.map((t) => t.name))

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (error) {
    console.error('Error seeding templates:', error)
    process.exit(1)
  }
}

seedRoadmapTemplates()
