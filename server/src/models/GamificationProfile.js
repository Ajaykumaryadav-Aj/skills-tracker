import mongoose from 'mongoose'

const achievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    badgeKey: { type: String, default: '' },
    xpReward: { type: Number, default: 0 },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const levelHistorySchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    totalXp: { type: Number, required: true },
    reachedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const gamificationProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalXp: { type: Number, min: 0, default: 0, index: true },
    level: { type: Number, min: 1, default: 1, index: true },
    achievements: [achievementSchema],
    badges: [badgeSchema],
    levelHistory: [levelHistorySchema],
  },
  { timestamps: true },
)

const GamificationProfile = mongoose.model('GamificationProfile', gamificationProfileSchema)
export default GamificationProfile
