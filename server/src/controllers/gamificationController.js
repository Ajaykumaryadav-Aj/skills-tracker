import {
  getChallenges,
  getGamificationSummary,
  getLeaderboard,
} from '../services/gamification.service.js'

export const getGamificationMe = async (req, res, next) => {
  try {
    const summary = await getGamificationSummary(req.user.id)
    res.json(summary)
  } catch (err) {
    next(err)
  }
}

export const getGamificationChallenges = async (req, res, next) => {
  try {
    const challenges = await getChallenges(req.user.id)
    res.json({ challenges })
  } catch (err) {
    next(err)
  }
}

export const getGamificationLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await getLeaderboard({
      sort: req.query.sort || 'xp',
      limit: req.query.limit || 10,
    })
    res.json({ leaderboard })
  } catch (err) {
    next(err)
  }
}
