import { query } from 'express-validator'

export const leaderboardValidator = [
  query('sort').optional({ checkFalsy: true }).isIn(['xp', 'hours', 'streak']).withMessage('Leaderboard sort is invalid'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
]
