import {
  detectWeakTopics,
  generateInterviewQuestions,
  generateQuiz,
  generateRecommendations,
  generateRoadmap,
  generateStudyPlanner,
  getAIHistory,
  summarizeNotes,
} from '../services/aiAssistant.service.js'

const respond = (res, result) => res.json(result)

export const createAIRoadmap = async (req, res, next) => {
  try {
    respond(res, await generateRoadmap(req.user.id, req.body))
  } catch (err) {
    next(err)
  }
}

export const createAIPlanner = async (req, res, next) => {
  try {
    respond(res, await generateStudyPlanner(req.user.id, req.body))
  } catch (err) {
    next(err)
  }
}

export const createAINotesSummary = async (req, res, next) => {
  try {
    respond(res, await summarizeNotes(req.user.id, req.body))
  } catch (err) {
    next(err)
  }
}

export const createAIQuiz = async (req, res, next) => {
  try {
    respond(res, await generateQuiz(req.user.id, req.body))
  } catch (err) {
    next(err)
  }
}

export const createAIInterview = async (req, res, next) => {
  try {
    respond(res, await generateInterviewQuestions(req.user.id, req.body))
  } catch (err) {
    next(err)
  }
}

export const getAIWeakTopics = async (req, res, next) => {
  try {
    respond(res, await detectWeakTopics(req.user.id))
  } catch (err) {
    next(err)
  }
}

export const getAIRecommendations = async (req, res, next) => {
  try {
    respond(res, await generateRecommendations(req.user.id))
  } catch (err) {
    next(err)
  }
}

export const getAIHistoryList = async (req, res, next) => {
  try {
    res.json(await getAIHistory(req.user.id, req.query))
  } catch (err) {
    next(err)
  }
}
