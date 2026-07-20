import api from '../api/axios'

// Get all templates
export const getAllTemplates = () => api.get('/roadmaps/templates')

// Get single template
export const getTemplate = (id) => api.get(`/roadmaps/templates/${id}`)

// Get template by name
export const getTemplateByName = (name) => api.get(`/roadmaps/templates/name/${name}`)

// Get all user roadmaps
export const getAllRoadmaps = () => api.get('/roadmaps')

// Get single roadmap
export const getRoadmap = (id) => api.get(`/roadmaps/${id}`)

// Create new roadmap
export const createRoadmap = (data) => api.post('/roadmaps', data)

// Update roadmap
export const updateRoadmap = (id, data) => api.put(`/roadmaps/${id}`, data)

// Delete roadmap
export const deleteRoadmap = (id) => api.delete(`/roadmaps/${id}`)

// Import template as roadmap
export const importTemplate = (templateId, data) => api.post(`/roadmaps/${templateId}/import`, data)

// Add skill to roadmap
export const addSkillToRoadmap = (roadmapId, data) => api.post(`/roadmaps/${roadmapId}/skills`, data)

// Update skill in roadmap
export const updateRoadmapSkill = (roadmapId, skillId, data) => api.put(`/roadmaps/${roadmapId}/skills/${skillId}`, data)

// Delete skill from roadmap
export const deleteRoadmapSkill = (roadmapId, skillId) => api.delete(`/roadmaps/${roadmapId}/skills/${skillId}`)

// Add topic to skill in roadmap
export const addTopicToSkill = (roadmapId, skillId, data) => api.post(`/roadmaps/${roadmapId}/skills/${skillId}/topics`, data)

// Get roadmap stats
export const getRoadmapStats = () => api.get('/roadmaps/stats')

// Reorder skills in a roadmap
export const reorderRoadmapSkills = (roadmapId, skillIds) => api.put(`/roadmaps/${roadmapId}/skills/reorder`, { skillIds })

// Generate a full structured roadmap via AI
// Uses a 3-minute timeout because Gemini needs time to produce a detailed multi-phase roadmap
export const generateStructuredRoadmap = (goal, signal) =>
  api.post('/ai/generate-roadmap', { goal }, { timeout: 180000, signal })
