import LearningLog from '../models/LearningLog.js'

const toDateKey = (date) => {
  const d = new Date(date)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateKeyToTimestamp = (key) => new Date(`${key}T00:00:00.000Z`).getTime()

export const calculateStreaks = (dateValues) => {
  const keys = Array.from(
    new Set(
      dateValues
        .filter(Boolean)
        .map((value) => toDateKey(value)),
    ),
  )
    .sort()

  if (keys.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastLearningDate: null }
  }

  let longestStreak = 1
  let currentStreak = 0
  let tempStreak = 1

  for (let i = 1; i < keys.length; i += 1) {
    const previous = dateKeyToTimestamp(keys[i - 1])
    const current = dateKeyToTimestamp(keys[i])
    const diffDays = Math.round((current - previous) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      tempStreak += 1
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  const todayKey = toDateKey(new Date())
  const datesSet = new Set(keys)

  if (!datesSet.has(todayKey)) {
    currentStreak = 0
  } else {
    currentStreak = 1
    let previousKey = todayKey
    while (true) {
      const previousDate = new Date(`${previousKey}T00:00:00.000Z`)
      previousDate.setUTCDate(previousDate.getUTCDate() - 1)
      const prevKey = toDateKey(previousDate)
      if (datesSet.has(prevKey)) {
        currentStreak += 1
        previousKey = prevKey
      } else {
        break
      }
    }
  }

  return { currentStreak, longestStreak, lastLearningDate: keys[keys.length - 1] }
}

export const getUserStreakSummary = async (userId) => {
  const dates = await LearningLog.distinct('date', { user: userId })
  return calculateStreaks(dates)
}
