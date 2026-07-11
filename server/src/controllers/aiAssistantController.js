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
import { logAuditEvent } from '../utils/auditLogger.js'

const respond = (res, result) => res.json(result)

export const createAIRoadmap = async (req, res, next) => {
  try {
    const result = await generateRoadmap(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-roadmap', { prompt: req.body.prompt || req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIPlanner = async (req, res, next) => {
  try {
    const result = await generateStudyPlanner(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-planner', { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAINotesSummary = async (req, res, next) => {
  try {
    const result = await summarizeNotes(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-notes-summary', { topicId: req.body.topicId })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIQuiz = async (req, res, next) => {
  try {
    const result = await generateQuiz(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-quiz', { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIInterview = async (req, res, next) => {
  try {
    const result = await generateInterviewQuestions(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-interview', { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const getAIWeakTopics = async (req, res, next) => {
  try {
    const result = await detectWeakTopics(req.user.id)
    await logAuditEvent(req, req.user.id, 'ai-weak-topics')
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const getAIRecommendations = async (req, res, next) => {
  try {
    const result = await generateRecommendations(req.user.id)
    await logAuditEvent(req, req.user.id, 'ai-recommendations')
    respond(res, result)
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
