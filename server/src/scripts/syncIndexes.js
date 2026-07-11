import dotenv from 'dotenv'
import mongoose from 'mongoose'
import '../models/LearningLog.js'
import '../models/Roadmap.js'
import '../models/RoadmapTemplate.js'
import '../models/Skill.js'
import '../models/Token.js'
import '../models/Topic.js'
import '../models/User.js'
import '../models/Revision.js'
import '../models/GamificationProfile.js'
import '../models/XPHistory.js'
import '../models/AIHistory.js'

dotenv.config()

await mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 10000,
})

try {
  const results = {}
  for (const [name, model] of Object.entries(mongoose.models)) {
    results[name] = await model.createIndexes()
  }
  console.log('MongoDB indexes created', results)
} finally {
  await mongoose.disconnect()
}
