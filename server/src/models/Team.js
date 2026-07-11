import mongoose from 'mongoose'

const teamMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, default: '', lowercase: true, trim: true },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'invited'], default: 'active' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 400 },
    inviteCode: { type: String, required: true, unique: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [teamMemberSchema],
  },
  { timestamps: true },
)

teamSchema.index({ 'members.userId': 1, updatedAt: -1 })
teamSchema.index({ 'members.email': 1 })

export default mongoose.model('Team', teamSchema)
