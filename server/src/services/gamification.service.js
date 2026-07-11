import mongoose from 'mongoose'
import GamificationProfile from '../models/GamificationProfile.js'
import LearningLog from '../models/LearningLog.js'
import Revision from '../models/Revision.js'
import Skill from '../models/Skill.js'
import Topic from '../models/Topic.js'
import User from '../models/User.js'
import XPHistory from '../models/XPHistory.js'
import Activity from '../models/Activity.js'
import Notification from '../models/Notification.js'
import { getUserStreakSummary } from './streakService.js'

export const XP_ACTIONS = {
  CREATE_SKILL: { xp: 25, label: 'Created a skill' },
  COMPLETE_TOPIC: { xp: 40, label: 'Completed a topic' },
  COMPLETE_REVISION: { xp: 20, label: 'Completed a revision' },
  ADD_LEARNING_SESSION: { xp: 15, label: 'Added a learning session' },
  DAILY_GOAL_COMPLETED: { xp: 30, label: 'Completed daily goal' },
  WEEKLY_GOAL_COMPLETED: { xp: 75, label: 'Completed weekly goal' },
  MONTHLY_GOAL_COMPLETED: { xp: 150, label: 'Completed monthly goal' },
  STREAK_DAY: { xp: 10, label: 'Maintained a learning streak' },
  ACHIEVEMENT_UNLOCKED: { xp: 50, label: 'Unlocked achievement' },
}

const ACHIEVEMENTS = [
  { key: 'first-skill', title: 'First Skill', description: 'Create your first skill.', badgeKey: 'skill-starter', xpReward: 50 },
  { key: 'first-topic', title: 'First Topic', description: 'Create your first topic.', badgeKey: 'topic-spark', xpReward: 50 },
  { key: 'first-session', title: 'First Learning Session', description: 'Log your first learning session.', badgeKey: 'session-starter', xpReward: 50 },
  { key: 'first-revision', title: 'First Revision', description: 'Complete your first revision.', badgeKey: 'revision-rookie', xpReward: 50 },
  { key: 'streak-7', title: '7 Day Streak', description: 'Maintain a 7 day learning streak.', badgeKey: 'weekly-flame', xpReward: 100 },
  { key: 'streak-30', title: '30 Day Streak', description: 'Maintain a 30 day learning streak.', badgeKey: 'monthly-flame', xpReward: 250 },
  { key: 'hours-100', title: '100 Learning Hours', description: 'Record 100 learning hours.', badgeKey: 'hundred-hours', xpReward: 300 },
  { key: 'skills-completed-10', title: '10 Skills Completed', description: 'Complete 10 skills.', badgeKey: 'skill-finisher', xpReward: 300 },
  { key: 'topics-completed-100', title: '100 Topics Completed', description: 'Complete 100 topics.', badgeKey: 'topic-master', xpReward: 400 },
]

const BADGES = new Map(ACHIEVEMENTS.map((achievement) => [
  achievement.badgeKey,
  {
    key: achievement.badgeKey,
    title: achievement.title,
    description: achievement.description,
  },
]))

const startOfDay = (date = new Date()) => {
  const value = new Date(date)
  value.setUTCHours(0, 0, 0, 0)
  return value
}

const addDays = (date, amount) => {
  const value = new Date(date)
  value.setUTCDate(value.getUTCDate() + amount)
  return value
}

const toDateKey = (date) => startOfDay(date).toISOString().slice(0, 10)

const weekKey = (date = new Date()) => {
  const day = startOfDay(date)
  const dayOfWeek = day.getUTCDay() || 7
  return toDateKey(addDays(day, 1 - dayOfWeek))
}

const monthKey = (date = new Date()) => {
  const day = startOfDay(date)
  return `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}`
}

export const getLevelInfo = (totalXp = 0) => {
  const thresholds = [0, 100, 250, 500]
  while (thresholds.length < 100) {
    const level = thresholds.length + 1
    thresholds.push(thresholds.at(-1) + Math.round(250 + level * 125))
  }

  let level = 1
  for (let index = 0; index < thresholds.length; index += 1) {
    if (totalXp >= thresholds[index]) level = index + 1
    else break
  }

  const currentLevelXp = thresholds[level - 1] || 0
  const nextLevelXp = thresholds[level] || currentLevelXp
  const progress = nextLevelXp > currentLevelXp
    ? Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
    : 100

  return { level, currentLevelXp, nextLevelXp, progress: Math.min(100, Math.max(0, progress)) }
}

export const getOrCreateGamificationProfile = async (userId) => {
  let profile = await GamificationProfile.findOne({ userId })
  if (!profile) {
    profile = await GamificationProfile.create({
      userId,
      totalXp: 0,
      level: 1,
      levelHistory: [{ level: 1, totalXp: 0, reachedAt: new Date() }],
    })
  }
  return profile
}

const syncProfileLevel = async (profile) => {
  const { level } = getLevelInfo(profile.totalXp)
  if (level > profile.level) {
    for (let nextLevel = profile.level + 1; nextLevel <= level; nextLevel += 1) {
      profile.levelHistory.push({ level: nextLevel, totalXp: profile.totalXp, reachedAt: new Date() })
    }
    profile.level = level
  }
  return profile
}

export const awardXp = async ({ userId, action, sourceType, sourceId, eventKey, metadata = {}, xp }) => {
  const config = XP_ACTIONS[action]
  const amount = Number(xp ?? config?.xp ?? 0)
  if (!amount || !eventKey || !sourceId) return { awarded: false, reason: 'invalid-reward' }

  try {
    const history = await XPHistory.create({
      userId,
      action,
      sourceType,
      sourceId,
      eventKey,
      xp: amount,
      metadata,
    })
    const profile = await getOrCreateGamificationProfile(userId)
    profile.totalXp += amount
    await syncProfileLevel(profile)
    await profile.save()
    await Activity.create({
      userId,
      type: 'xp-gained',
      title: `Gained ${amount} XP`,
      description: config?.label || action,
      sourceType,
      sourceId,
      metadata: { ...metadata, action, xp: amount },
    }).catch(() => null)
    await evaluateAchievements(userId)
    return { awarded: true, history, profile }
  } catch (err) {
    if (err.code === 11000) return { awarded: false, reason: 'duplicate' }
    throw err
  }
}

const unlockAchievement = async (userId, achievement) => {
  const profile = await getOrCreateGamificationProfile(userId)
  if (profile.achievements.some((item) => item.key === achievement.key)) return false

  profile.achievements.push({
    key: achievement.key,
    title: achievement.title,
    description: achievement.description,
    badgeKey: achievement.badgeKey,
    xpReward: achievement.xpReward,
    unlockedAt: new Date(),
  })

  const badge = BADGES.get(achievement.badgeKey)
  if (badge && !profile.badges.some((item) => item.key === badge.key)) {
    profile.badges.push({ ...badge, unlockedAt: new Date() })
  }

  await profile.save()
  await Activity.create({
    userId,
    type: 'achievement-unlocked',
    title: `Unlocked ${achievement.title}`,
    description: achievement.description,
    sourceType: 'achievement',
    sourceId: new mongoose.Types.ObjectId(),
    metadata: { achievementKey: achievement.key, badgeKey: achievement.badgeKey },
  }).catch(() => null)
  await Notification.create({
    userId,
    type: 'Achievement',
    title: `Achievement unlocked: ${achievement.title}`,
    message: achievement.description,
    sourceType: 'achievement',
    sourceId: new mongoose.Types.ObjectId(),
    metadata: { achievementKey: achievement.key, badgeKey: achievement.badgeKey },
  }).catch(() => null)
  await awardXp({
    userId,
    action: 'ACHIEVEMENT_UNLOCKED',
    sourceType: 'achievement',
    sourceId: new mongoose.Types.ObjectId(),
    eventKey: `achievement:${achievement.key}`,
    xp: achievement.xpReward,
    metadata: { achievementKey: achievement.key },
  })
  return true
}

export const getGamificationStats = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const [skillCounts, topicCounts, logTotals, revisionCompleted, streak] = await Promise.all([
    Skill.aggregate([
      { $match: { userId: userObjectId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
    ]),
    Topic.aggregate([
      { $match: { userId: userObjectId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
    ]),
    LearningLog.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: null, sessions: { $sum: 1 }, minutes: { $sum: '$duration' } } },
    ]),
    Revision.countDocuments({ userId, completedAt: { $ne: null } }),
    getUserStreakSummary(userId),
  ])

  const skills = skillCounts[0] || { total: 0, completed: 0 }
  const topics = topicCounts[0] || { total: 0, completed: 0 }
  const logs = logTotals[0] || { sessions: 0, minutes: 0 }

  return {
    skills,
    topics,
    sessions: logs.sessions || 0,
    learningHours: Math.round(((logs.minutes || 0) / 60) * 10) / 10,
    revisionsCompleted: revisionCompleted,
    streak,
  }
}

export const evaluateAchievements = async (userId) => {
  const stats = await getGamificationStats(userId)
  const checks = {
    'first-skill': stats.skills.total >= 1,
    'first-topic': stats.topics.total >= 1,
    'first-session': stats.sessions >= 1,
    'first-revision': stats.revisionsCompleted >= 1,
    'streak-7': stats.streak.currentStreak >= 7 || stats.streak.longestStreak >= 7,
    'streak-30': stats.streak.currentStreak >= 30 || stats.streak.longestStreak >= 30,
    'hours-100': stats.learningHours >= 100,
    'skills-completed-10': stats.skills.completed >= 10,
    'topics-completed-100': stats.topics.completed >= 100,
  }

  const unlocked = []
  for (const achievement of ACHIEVEMENTS) {
    if (checks[achievement.key]) {
      const didUnlock = await unlockAchievement(userId, achievement)
      if (didUnlock) unlocked.push(achievement.key)
    }
  }
  return unlocked
}

export const awardGoalAndStreakXp = async (userId, progress, sourceId) => {
  const date = toDateKey(new Date())
  const rewards = []
  if (progress?.goalProgress?.today?.percent >= 100) {
    rewards.push(awardXp({ userId, action: 'DAILY_GOAL_COMPLETED', sourceType: 'goal', sourceId, eventKey: `goal:daily:${date}` }))
  }
  if (progress?.goalProgress?.week?.percent >= 100) {
    rewards.push(awardXp({ userId, action: 'WEEKLY_GOAL_COMPLETED', sourceType: 'goal', sourceId, eventKey: `goal:weekly:${weekKey()}` }))
  }
  if (progress?.goalProgress?.month?.percent >= 100) {
    rewards.push(awardXp({ userId, action: 'MONTHLY_GOAL_COMPLETED', sourceType: 'goal', sourceId, eventKey: `goal:monthly:${monthKey()}` }))
  }
  const streak = progress?.streak || await getUserStreakSummary(userId)
  if ((streak.currentStreak || 0) > 1) {
    rewards.push(awardXp({ userId, action: 'STREAK_DAY', sourceType: 'streak', sourceId, eventKey: `streak:${date}` }))
  }
  await Promise.all(rewards)
}

export const getChallenges = async (userId) => {
  const today = startOfDay()
  const tomorrow = addDays(today, 1)
  const weekStart = addDays(today, -((today.getUTCDay() || 7) - 1))
  const userObjectId = new mongoose.Types.ObjectId(userId)

  const [dailyLogs, weeklyLogs, dailyTopics, weeklyTopics, dailyRevisions, weeklyRevisions, streak] = await Promise.all([
    LearningLog.aggregate([{ $match: { user: userObjectId, date: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, minutes: { $sum: '$duration' } } }]),
    LearningLog.aggregate([{ $match: { user: userObjectId, date: { $gte: weekStart, $lt: tomorrow } } }, { $group: { _id: null, minutes: { $sum: '$duration' } } }]),
    Topic.countDocuments({ userId, status: 'Completed', completedAt: { $gte: today, $lt: tomorrow } }),
    Topic.countDocuments({ userId, status: 'Completed', completedAt: { $gte: weekStart, $lt: tomorrow } }),
    Revision.countDocuments({ userId, completedAt: { $gte: today, $lt: tomorrow } }),
    Revision.countDocuments({ userId, completedAt: { $gte: weekStart, $lt: tomorrow } }),
    getUserStreakSummary(userId),
  ])

  const dailyMinutes = dailyLogs[0]?.minutes || 0
  const weeklyMinutes = weeklyLogs[0]?.minutes || 0
  return {
    daily: [
      { key: 'daily-study-2h', title: 'Study 2 Hours', target: 120, progress: dailyMinutes, unit: 'minutes', completed: dailyMinutes >= 120 },
      { key: 'daily-complete-3-topics', title: 'Complete 3 Topics', target: 3, progress: dailyTopics, unit: 'topics', completed: dailyTopics >= 3 },
      { key: 'daily-finish-1-revision', title: 'Finish 1 Revision', target: 1, progress: dailyRevisions, unit: 'revisions', completed: dailyRevisions >= 1 },
    ],
    weekly: [
      { key: 'weekly-10h', title: '10 Learning Hours', target: 600, progress: weeklyMinutes, unit: 'minutes', completed: weeklyMinutes >= 600 },
      { key: 'weekly-15-topics', title: 'Complete 15 Topics', target: 15, progress: weeklyTopics, unit: 'topics', completed: weeklyTopics >= 15 },
      { key: 'weekly-7-streak', title: 'Maintain 7 Day Streak', target: 7, progress: streak.currentStreak || 0, unit: 'days', completed: (streak.currentStreak || 0) >= 7 },
    ],
  }
}

export const getGamificationSummary = async (userId) => {
  await evaluateAchievements(userId)
  const [profile, stats, challenges, recentXp, xpGrowth] = await Promise.all([
    getOrCreateGamificationProfile(userId),
    getGamificationStats(userId),
    getChallenges(userId),
    XPHistory.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    XPHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: addDays(startOfDay(), -29) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, xp: { $sum: '$xp' } } },
      { $sort: { _id: 1 } },
    ]),
  ])
  const levelInfo = getLevelInfo(profile.totalXp)

  return {
    profile: {
      totalXp: profile.totalXp,
      level: profile.level,
      levelInfo,
      achievements: profile.achievements.slice().sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)),
      badges: profile.badges.slice().sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)),
      levelHistory: profile.levelHistory,
    },
    stats,
    challenges,
    recentXp,
    analytics: {
      xpGrowth: xpGrowth.map((row) => ({ date: row._id, xp: row.xp })),
      achievementTimeline: profile.achievements.map((achievement) => ({
        date: achievement.unlockedAt,
        title: achievement.title,
        key: achievement.key,
      })),
      levelHistory: profile.levelHistory,
    },
  }
}

export const getLeaderboard = async ({ sort = 'xp', limit = 10 } = {}) => {
  const profiles = await GamificationProfile.find({})
    .populate('userId', 'name email avatar')
    .sort(sort === 'xp' ? { totalXp: -1 } : { level: -1, totalXp: -1 })
    .limit(Math.min(Number(limit) || 10, 50))
    .lean()

  const rows = await Promise.all(profiles.map(async (profile, index) => {
    const stats = await getGamificationStats(profile.userId?._id || profile.userId)
    return {
      rank: index + 1,
      user: profile.userId,
      totalXp: profile.totalXp,
      level: profile.level,
      learningHours: stats.learningHours,
      streak: stats.streak.currentStreak || 0,
    }
  }))

  if (sort === 'hours') rows.sort((a, b) => b.learningHours - a.learningHours)
  if (sort === 'streak') rows.sort((a, b) => b.streak - a.streak)
  return rows.map((row, index) => ({ ...row, rank: index + 1 }))
}
