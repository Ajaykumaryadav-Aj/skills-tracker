import mongoose from 'mongoose'

const tokenSchema = new mongoose.Schema({
  token: { type: String, select: false },
  tokenHash: { type: String, unique: true, sparse: true, index: true },
  expiresAt: { type: Date, required: true },
})

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Token = mongoose.model('Token', tokenSchema)
export default Token
