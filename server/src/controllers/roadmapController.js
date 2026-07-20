import Roadmap from '../models/Roadmap.js'
import RoadmapTemplate from '../models/RoadmapTemplate.js'

// Create a new roadmap
export const createRoadmap = async (req, res, next) => {
  try {
    const { title, description, category, skills, targetDate, startDate } = req.body

    const roadmap = await Roadmap.create({
      user: req.user.id,
      title,
      description,
      category: category || 'Other',
      skills: skills || [],
      targetDate: targetDate ? new Date(targetDate) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
    })

    res.status(201).json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Get all roadmaps for user
export const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()
    res.json({ roadmaps })
  } catch (err) {
    next(err)
  }
}

// Get single roadmap with details
export const getRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id }).lean()
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }
    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Update roadmap
export const updateRoadmap = async (req, res, next) => {
  try {
    const { title, description, category, status, progress, targetDate } = req.body

    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (status !== undefined) updates.status = status
    if (progress !== undefined) updates.progress = progress
    if (targetDate !== undefined) updates.targetDate = targetDate ? new Date(targetDate) : null

    const roadmap = await Roadmap.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, updates, {
      new: true,
      runValidators: true,
    })

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Delete roadmap
export const deleteRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }
    res.json({ message: 'Roadmap deleted' })
  } catch (err) {
    next(err)
  }
}

// Get all available templates
export const getTemplates = async (req, res, next) => {
  try {
    const templates = await RoadmapTemplate.find().sort({ createdAt: -1 }).lean()
    res.json({ templates })
  } catch (err) {
    next(err)
  }
}

// Get single template
export const getTemplate = async (req, res, next) => {
  try {
    const template = await RoadmapTemplate.findById(req.params.id).lean()
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }
    res.json({ template })
  } catch (err) {
    next(err)
  }
}

// Get template by name
export const getTemplateByName = async (req, res, next) => {
  try {
    const template = await RoadmapTemplate.findOne({ name: req.params.name }).lean()
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }
    res.json({ template })
  } catch (err) {
    next(err)
  }
}

// Import roadmap from template
export const importTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params
    const { title } = req.body

    const template = await RoadmapTemplate.findById(templateId)
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    // Create new roadmap from template
    const roadmap = await Roadmap.create({
      user: req.user.id,
      title: title || template.title,
      description: template.description,
      icon: template.icon,
      category: template.category,
      skills: template.skills.map((skill) => ({
        title: skill.title,
        description: skill.description,
        level: skill.level,
        topics: skill.topics.map((topic) => ({
          title: topic.title,
          description: topic.description,
          subtopics: topic.subtopics || [],
        })),
        estimatedHours: skill.estimatedHours,
      })),
      sourceTemplate: template.name,
      templateId: template._id,
      startDate: new Date(),
      estimatedHours: template.estimatedHours,
    })

    res.status(201).json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Add skill to roadmap
export const addSkillToRoadmap = async (req, res, next) => {
  try {
    const { roadmapId } = req.params
    const { title, description, level, estimatedHours } = req.body

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    roadmap.skills.push({
      title,
      description,
      level: level || 'Beginner',
      estimatedHours,
      topics: [],
    })

    roadmap.recalculateProgress()
    await roadmap.save()

    res.status(201).json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Update skill in roadmap
export const updateRoadmapSkill = async (req, res, next) => {
  try {
    const { roadmapId, skillId } = req.params
    const { title, description, progress, status, level, estimatedHours } = req.body

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    const skill = roadmap.skills.id(skillId)
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found in roadmap' })
    }

    if (title !== undefined) skill.title = title
    if (description !== undefined) skill.description = description
    if (progress !== undefined) skill.progress = progress
    if (status !== undefined) skill.status = status
    if (level !== undefined) skill.level = level
    if (estimatedHours !== undefined) skill.estimatedHours = estimatedHours

    roadmap.recalculateProgress()
    roadmap.recalculateStatus()
    await roadmap.save()

    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Add topic to skill in roadmap
export const addTopicToSkill = async (req, res, next) => {
  try {
    const { roadmapId, skillId } = req.params
    const { title, description } = req.body

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    const skill = roadmap.skills.id(skillId)
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found in roadmap' })
    }

    skill.topics.push({
      title,
      description,
      subtopics: [],
    })

    await roadmap.save()
    res.status(201).json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Delete skill from roadmap
export const deleteRoadmapSkill = async (req, res, next) => {
  try {
    const { roadmapId, skillId } = req.params

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    const skill = roadmap.skills.id(skillId)
    if (!skill) return res.status(404).json({ message: 'Skill not found in roadmap' })
    skill.deleteOne()
    roadmap.recalculateProgress()
    roadmap.recalculateStatus()
    await roadmap.save()

    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}

// Get roadmap stats
export const getRoadmapStats = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user.id })
      .select('status progress skills.status')
      .lean()

    const stats = {
      totalRoadmaps: roadmaps.length,
      completedRoadmaps: roadmaps.filter((r) => r.status === 'Completed').length,
      inProgressRoadmaps: roadmaps.filter((r) => r.status === 'In Progress').length,
      totalSkills: roadmaps.reduce((sum, r) => sum + (r.skills?.length || 0), 0),
      completedSkills: roadmaps.reduce(
        (sum, r) => sum + (r.skills?.filter((s) => s.status === 'Completed').length || 0),
        0,
      ),
      averageProgress: Math.round(roadmaps.reduce((sum, r) => sum + r.progress, 0) / (roadmaps.length || 1)),
    }

    res.json(stats)
  } catch (err) {
    next(err)
  }
}

// Reorder skills in roadmap
export const reorderRoadmapSkills = async (req, res, next) => {
  try {
    const { roadmapId } = req.params
    const { skillIds } = req.body

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    if (!Array.isArray(skillIds)) {
      return res.status(400).json({ message: 'skillIds must be an array' })
    }

    // Reorder based on skillIds
    const skillMap = new Map(roadmap.skills.map((s) => [s._id.toString(), s]))
    const newSkills = []

    for (const id of skillIds) {
      const skill = skillMap.get(id)
      if (skill) {
        newSkills.push(skill)
        skillMap.delete(id)
      }
    }

    // Add remaining skills
    for (const skill of skillMap.values()) {
      newSkills.push(skill)
    }

    roadmap.skills = newSkills
    await roadmap.save()

    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}

