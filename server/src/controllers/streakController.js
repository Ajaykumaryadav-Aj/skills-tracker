import { getUserStreakSummary } from '../services/streakService.js'

export const getStreakSummary = async (req, res, next) => {
  try {
    const summary = await getUserStreakSummary(req.user.id)
    res.json(summary)
  } catch (err) {
    next(err)
  }
}
