import {
  debugCode,
  detectWeakTopics,
  generateChatResponse,
  generateInterviewQuestions,
  generateNotes,
  generateRecommendations,
  generateStructuredRoadmap,
  generateStudyPlanner,
  getAIHistory,
  getAIHistoryById,
  deleteAIHistoryById,
  deleteAllAIHistory,
  suggestResources,
  summarizeNotes,
} from '../services/aiAssistant.service.js'
import { logAuditEvent } from '../utils/auditLogger.js'
import { logToFile } from '../utils/fileLogger.js'

const respond = (res, result) => res.json(result)

export const createAIChat = async (req, res, next) => {
  try {
    const result = await generateChatResponse(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-chat', { message: req.body.message })
    logToFile('ai', 'info', `AI Chat response generated for user ${req.user.id}`, { message: req.body.message })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIDebug = async (req, res, next) => {
  try {
    const result = await debugCode(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-debug', { language: req.body.language })
    logToFile('ai', 'info', `AI Code Debug generated for user ${req.user.id}`, { language: req.body.language })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAINotes = async (req, res, next) => {
  try {
    const result = await generateNotes(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-notes-generator', { topic: req.body.topic, type: req.body.type })
    logToFile('ai', 'info', `AI Notes generated for user ${req.user.id}`, { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIResources = async (req, res, next) => {
  try {
    const result = await suggestResources(req.user.id, req.body)
    await logAuditEvent(req, req.user.id, 'ai-resources', { topic: req.body.topic })
    logToFile('ai', 'info', `AI Resources suggested for user ${req.user.id}`, { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIStructuredRoadmap = async (req, res, next) => {
  try {
    const { goal } = req.body
    if (!goal || !String(goal).trim()) {
      return res.status(400).json({ message: 'Goal is required' })
    }
    const result = await generateStructuredRoadmap(req.user.id, { goal: String(goal).trim() })
    await logAuditEvent(req, req.user.id, 'ai-structured-roadmap', { goal })
    logToFile('ai', 'info', `AI Structured Roadmap generated for user ${req.user.id}`, { goal })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAIPlanner = async (req, res, next) => {
  try {
    const result = await generateStudyPlanner(req.user.id, req.body)

    await logAuditEvent(req, req.user.id, 'ai-planner', { topic: req.body.topic })
    logToFile('ai', 'info', `AI Study Planner generated for user ${req.user.id}`, { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const createAINotesSummary = async (req, res, next) => {
  try {
    const result = await summarizeNotes(req.user.id, req.body)

    await logAuditEvent(req, req.user.id, 'ai-notes-summary', { topicId: req.body.topicId })
    logToFile('ai', 'info', `AI Notes Summary generated for topic ${req.body.topicId}`, { topicId: req.body.topicId })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}



export const createAIInterview = async (req, res, next) => {
  try {
    const result = await generateInterviewQuestions(req.user.id, req.body)

    await logAuditEvent(req, req.user.id, 'ai-interview', { topic: req.body.topic })
    logToFile('ai', 'info', `AI Interview generated for topic ${req.body.topic}`, { topic: req.body.topic })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const getAIWeakTopics = async (req, res, next) => {
  try {
    const result = await detectWeakTopics(req.user.id)
    await logAuditEvent(req, req.user.id, 'ai-weak-topics')
    logToFile('ai', 'info', `AI Weak Topics analyzed for user ${req.user.id}`, { count: result?.weakTopics?.length })
    respond(res, result)
  } catch (err) {
    next(err)
  }
}

export const getAIRecommendations = async (req, res, next) => {
  try {
    const result = await generateRecommendations(req.user.id)
    await logAuditEvent(req, req.user.id, 'ai-recommendations')
    logToFile('ai', 'info', `AI Recommendations retrieved for user ${req.user.id}`)
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

export const getAIHistoryDetail = async (req, res, next) => {
  try {
    const record = await getAIHistoryById(req.user.id, req.params.id)
    if (!record) {
      return res.status(404).json({ message: 'History not found or has been deleted.' })
    }
    res.json(record)
  } catch (err) {
    next(err)
  }
}

export const deleteAIHistory = async (req, res, next) => {
  try {
    const success = await deleteAIHistoryById(req.user.id, req.params.id)
    if (!success) {
      return res.status(404).json({ message: 'History not found or has been deleted.' })
    }
    res.json({ message: 'History deleted successfully.' })
  } catch (err) {
    next(err)
  }
}

export const deleteAllHistoryForUser = async (req, res, next) => {
  try {
    const count = await deleteAllAIHistory(req.user.id)
    res.json({ message: `All history deleted successfully. ${count} record(s) removed.`, count })
  } catch (err) {
    next(err)
  }
}
