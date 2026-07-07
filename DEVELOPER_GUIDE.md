# Roadmap Templates - Developer Extension Guide

## Adding New Features

This guide helps developers extend the Roadmap Templates feature.

---

## 1. Adding a New Roadmap Template

### Step 1: Add to Template Data

In `server/src/data/roadmapTemplates.js`:

```javascript
{
  name: 'Mobile Developer',  // Unique identifier
  title: 'Mobile Developer Roadmap',
  description: 'Master iOS and Android development...',
  icon: '📱',
  category: 'Mobile',
  difficulty: 'Intermediate',
  estimatedHours: 220,
  prerequisites: ['JavaScript Fundamentals', 'Networking Basics'],
  keywords: ['React Native', 'Swift', 'Kotlin', 'Mobile'],
  skills: [
    {
      title: 'React Native Fundamentals',
      description: 'Cross-platform mobile development',
      level: 'Beginner',
      estimatedHours: 60,
      topics: [
        {
          title: 'React Native Setup',
          description: 'Environment and project setup',
          subtopics: [
            {
              title: 'Installation & Configuration',
              description: '...',
              resourceLinks: ['https://...']
            }
          ]
        }
        // ... more topics
      ]
    }
    // ... more skills
  ]
}
```

### Step 2: Reseed Database

```bash
npm run seed
```

The new template is now available!

---

## 2. Adding Custom Skill Fields

### Option A: Extend Skill Schema

In `server/src/models/Roadmap.js`, modify the skill schema:

```javascript
const skillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  status: { type: String, enum: ['Not Started', 'In progress', 'Completed'] },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  
  // New fields
  difficulty: { type: Number, min: 1, max: 5 },  // 1-5 difficulty rating
  resources: [{ type: String }],                  // Learning resources
  mentorNeeded: { type: Boolean, default: false }, // Requires mentoring
  tags: [{ type: String }],                       // Custom tags
  
  topics: [topicSchema],
  estimatedHours: { type: Number },
  targetDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
})
```

### Option B: Update Validators

In `server/src/validations/roadmapValidators.js`:

```javascript
export const addSkillToRoadmapValidator = [
  // ... existing validators
  body('difficulty').optional().isInt({ min: 1, max: 5 }),
  body('resources').optional().isArray(),
  body('mentorNeeded').optional().isBoolean(),
  body('tags').optional().isArray(),
]
```

### Option C: Update Controller

In `server/src/controllers/roadmapController.js`:

```javascript
export const addSkillToRoadmap = async (req, res, next) => {
  try {
    const { roadmapId } = req.params
    const { title, difficulty, resources, mentorNeeded, tags, ...rest } = req.body

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user.id })
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    roadmap.skills.push({
      title,
      difficulty,
      resources,
      mentorNeeded,
      tags,
      ...rest,
      topics: [],
    })

    await roadmap.save()
    res.status(201).json({ roadmap })
  } catch (err) {
    next(err)
  }
}
```

---

## 3. Adding Progress Notifications

### Step 1: Create Notification Model

```javascript
// server/src/models/Notification.js
import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
  type: { enum: ['milestone', 'reminder', 'achievement'] },
  title: { type: String, required: true },
  message: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
```

### Step 2: Add Notification Trigger

In `server/src/controllers/roadmapController.js`:

```javascript
import Notification from '../models/Notification.js'

export const updateRoadmapSkill = async (req, res, next) => {
  try {
    // ... existing code ...
    
    const roadmap = await Roadmap.findOneAndUpdate(...)
    
    // Trigger notification on skill completion
    if (req.body.status === 'Completed') {
      await Notification.create({
        user: req.user.id,
        roadmapId: roadmap._id,
        type: 'milestone',
        title: `Completed: ${skill.title}`,
        message: `Great job! You completed "${skill.title}"`,
      })
    }
    
    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}
```

### Step 3: Add Frontend Notification Display

```javascript
// client/src/components/Notifications.jsx
import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications)
    }
    
    fetchNotifications()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-sm">
      {notifications.map((notif) => (
        <div key={notif._id} className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold">{notif.title}</h3>
          <p className="text-sm text-gray-700">{notif.message}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 4. Adding Resource Links

### Step 1: Extend Topic Schema

In `server/src/models/Roadmap.js`:

```javascript
const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Not Started', 'Learning', 'Revision', 'Completed'] },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  
  // New resources field
  resources: [
    {
      type: { enum: ['course', 'article', 'video', 'book', 'documentation'] },
      title: { type: String, required: true },
      url: { type: String, required: true },
      platform: { type: String }, // Udemy, YouTube, etc.
      duration: { type: String }, // "4 hours", "45 minutes"
      completed: { type: Boolean, default: false },
    }
  ],
  
  subtopics: [/* ... */],
  createdAt: { type: Date, default: Date.now },
})
```

### Step 2: Frontend Resource Component

```javascript
// client/src/components/ResourceLink.jsx
export default function ResourceLink({ resource, onComplete }) {
  return (
    <div className="rounded-lg border p-3 flex items-center justify-between">
      <div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline font-medium"
        >
          {resource.title}
        </a>
        <div className="text-xs text-gray-500 mt-1">
          {resource.platform} • {resource.duration}
        </div>
      </div>
      <button
        onClick={() => onComplete(resource._id)}
        className="px-3 py-1 text-sm rounded-full border border-green-200 text-green-700 hover:bg-green-50"
      >
        {resource.completed ? '✓ Done' : 'Mark Done'}
      </button>
    </div>
  )
}
```

---

## 5. Adding Collaboration Features

### Step 1: Extend Roadmap Model

```javascript
const roadmapSchema = new mongoose.Schema({
  // ... existing fields ...
  
  collaborators: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { enum: ['viewer', 'editor', 'owner'], default: 'viewer' },
      addedAt: { type: Date, default: Date.now },
    }
  ],
  isPublic: { type: Boolean, default: false },
})
```

### Step 2: Add Sharing Controller

```javascript
// server/src/controllers/roadmapController.js

export const shareRoadmap = async (req, res, next) => {
  try {
    const { roadmapId } = req.params
    const { userId, role } = req.body

    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      user: req.user.id,
    })

    if (!roadmap) return res.status(404).json({ message: 'Not found' })

    roadmap.collaborators.push({ user: userId, role })
    await roadmap.save()

    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}
```

---

## 6. Adding Roadmap Export (PDF)

### Step 1: Install Dependencies

```bash
npm install pdfkit
```

### Step 2: Create Export Controller

```javascript
// server/src/controllers/roadmapController.js
import PDFDocument from 'pdfkit'

export const exportRoadmapPDF = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user.id,
    })

    if (!roadmap) return res.status(404).json({ message: 'Not found' })

    const doc = new PDFDocument()
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${roadmap.title}.pdf"`)
    
    doc.pipe(res)
    
    // Title
    doc.fontSize(24).font('Helvetica-Bold').text(roadmap.title)
    doc.fontSize(12).font('Helvetica').text(roadmap.description)
    
    // Skills
    roadmap.skills.forEach((skill) => {
      doc.fontSize(14).font('Helvetica-Bold').text(skill.title)
      doc.fontSize(11).text(`Progress: ${skill.progress}%`)
      
      skill.topics.forEach((topic) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`  ${topic.title}`)
      })
    })
    
    doc.end()
  } catch (err) {
    next(err)
  }
}
```

---

## 7. Adding AI Recommendations

### Step 1: Create Recommendation Service

```javascript
// server/src/services/recommendationService.js

export const getRecommendedRoadmap = async (userId) => {
  const user = await User.findById(userId)
    .populate('skills')
  
  const userSkills = new Set(user.skills.map(s => s.title))
  
  // Simple matching algorithm
  const templates = await RoadmapTemplate.find()
  
  const scored = templates.map((template) => {
    const matchedSkills = template.skills.filter(
      s => userSkills.has(s.title)
    ).length
    const totalSkills = template.skills.length
    const score = matchedSkills / totalSkills
    
    return { template, score }
  })
  
  return scored.sort((a, b) => b.score - a.score)[0]?.template
}
```

### Step 2: Add Recommendation Endpoint

```javascript
// server/src/routes/roadmapRoutes.js
router.get('/:id/recommendations', auth, async (req, res, next) => {
  try {
    const recommendation = await getRecommendedRoadmap(req.user.id)
    res.json({ recommendation })
  } catch (err) {
    next(err)
  }
})
```

---

## 8. Adding Milestone Achievements

### Create Achievement Model

```javascript
// server/src/models/Achievement.js
const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
  type: { enum: ['completed_skill', 'completed_roadmap', 'streak', 'milestone'] },
  title: String,
  icon: String,
  unlockedAt: { type: Date, default: Date.now },
})
```

---

## 9. Custom Validation Rules

In `server/src/validations/roadmapValidators.js`:

```javascript
import { body, validationResult } from 'express-validator'

// Custom validator for category with wildcards
export const createRoadmapValidator = [
  body('title')
    .trim()
    .notEmpty()
    .custom(value => {
      // Disallow duplicate titles for same user
      // This would be async validation
      if (value.length < 3) {
        throw new Error('Title must be at least 3 characters')
      }
      return true
    }),
  body('estimatedHours')
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage('Hours must be between 1 and 5000'),
]
```

---

## 10. Performance Optimization

### Add Pagination to Templates

```javascript
export const getTemplates = async (req, res, next) => {
  try {
    const page = req.query.page || 1
    const limit = 10
    const skip = (page - 1) * limit

    const templates = await RoadmapTemplate.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await RoadmapTemplate.countDocuments()

    res.json({
      templates,
      pagination: {
        page,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}
```

### Add Caching

```javascript
// server/src/services/cacheService.js
const cache = new Map()

export const getCachedTemplates = async () => {
  const cacheKey = 'all_templates'
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  const templates = await RoadmapTemplate.find()
  cache.set(cacheKey, templates)
  
  // Expire cache after 1 hour
  setTimeout(() => cache.delete(cacheKey), 3600000)
  
  return templates
}
```

---

## Testing New Features

### Example Test Case

```javascript
// server/src/__tests__/roadmap.test.js
import { jest } from '@jest/globals'
import Roadmap from '../models/Roadmap.js'

describe('Roadmap', () => {
  it('should calculate progress correctly', () => {
    const roadmap = new Roadmap({
      skills: [
        { progress: 100 },
        { progress: 50 },
        { progress: 0 },
      ]
    })

    roadmap.recalculateProgress()
    expect(roadmap.progress).toBe(50)
  })
})
```

---

## Common Extension Patterns

### Pattern 1: Add Field + Update Controller + Update Validator

1. Model: Add field to schema
2. Controller: Include in CRUD operations
3. Validator: Validate new field
4. Tests: Add test cases

### Pattern 2: Add Endpoint

1. Controller: Add method
2. Route: Add route definition
3. Validator: Validate inputs
4. Service: Add business logic (if needed)
5. Tests: Test endpoint

### Pattern 3: Add Frontend Feature

1. Create component
2. Add service method
3. Update page to use component
4. Test user interactions

---

## Debugging Tips

1. **Check server logs** for validation errors
2. **Check browser console** for API errors
3. **Use MongoDB Compass** to inspect data
4. **Use Postman** to test API endpoints
5. **Use React DevTools** to inspect state

---

## Resources

- Mongoose Docs: https://mongoosejs.com
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
