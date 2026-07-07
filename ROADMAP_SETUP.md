# Roadmap Templates Feature - Setup Guide

## Overview

The Roadmap Templates feature allows users to:
- **Browse pre-built learning roadmaps** (5 templates: Frontend Developer, Backend Developer, Full Stack Developer, React Developer, Node.js Developer)
- **Import templates** into their learning tracker
- **Create custom roadmaps** from scratch
- **Track progress** on roadmap skills and topics
- **Manage roadmap content** (add/edit/delete skills and topics)

## Architecture

### Backend Structure

#### Models
- **RoadmapTemplate.js** - Pre-built template definitions
- **Roadmap.js** - User's roadmaps (imported or custom)

#### Controllers
- **roadmapController.js** - All CRUD operations and business logic

#### Routes
- **roadmapRoutes.js** - All roadmap endpoints

#### Validators
- **roadmapValidators.js** - Express-validator schemas

#### Data
- **roadmapTemplates.js** - Template definitions (5 templates)

#### Scripts
- **seedRoadmaps.js** - Seed script to populate templates

### Frontend Structure

#### Pages
- **Roadmaps.jsx** - Main listing with tabs (My Roadmaps / Templates)
- **RoadmapDetail.jsx** - Template preview and import
- **RoadmapForm.jsx** - Create/edit custom roadmaps
- **UserRoadmapDetail.jsx** - Progress tracking and management

#### Services
- **roadmapService.js** - API client for all roadmap endpoints

## Setup Instructions

### 1. Backend Setup

#### Start the Server

```bash
cd server
npm install  # if not already done
npm run dev
```

#### Seed the Templates

In a new terminal:

```bash
cd server
npm run seed
```

This will:
- Connect to MongoDB
- Clear existing templates
- Insert 5 new roadmap templates
- Display confirmation messages

**Templates Created:**
1. Frontend Developer (🎨) - 200 hours
2. Backend Developer (⚙️) - 250 hours
3. Full Stack Developer (🚀) - 400 hours
4. React Developer (⚛️) - 150 hours
5. Node.js Developer (🟢) - 180 hours

### 2. Frontend Setup

```bash
cd client
npm install  # if not already done
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Template Endpoints (Public)

```
GET /api/roadmaps/templates
  - Get all available templates

GET /api/roadmaps/templates/:id
  - Get specific template by ID

GET /api/roadmaps/templates/name/:name
  - Get template by name (e.g., "Frontend Developer")
```

### User Roadmap Endpoints (Protected)

```
POST /api/roadmaps
  - Create new custom roadmap
  - Body: { title, description, category, skills, targetDate }

GET /api/roadmaps
  - Get all user's roadmaps

GET /api/roadmaps/:id
  - Get specific roadmap

PUT /api/roadmaps/:id
  - Update roadmap
  - Body: { title, description, category, status, progress, targetDate }

DELETE /api/roadmaps/:id
  - Delete roadmap

POST /api/roadmaps/:templateId/import
  - Import template as roadmap
  - Body: { title? }

GET /api/roadmaps/stats
  - Get roadmap statistics
```

### Skill Management Endpoints

```
POST /api/roadmaps/:roadmapId/skills
  - Add skill to roadmap
  - Body: { title, description, level, estimatedHours }

PUT /api/roadmaps/:roadmapId/skills/:skillId
  - Update skill
  - Body: { title?, description?, progress?, status?, level?, estimatedHours? }

DELETE /api/roadmaps/:roadmapId/skills/:skillId
  - Delete skill

POST /api/roadmaps/:roadmapId/skills/:skillId/topics
  - Add topic to skill
  - Body: { title, description }
```

## User Features

### 1. Browse Templates
- Navigate to **Roadmaps** > **Templates** tab
- View all 5 pre-built templates
- See difficulty level and estimated hours
- Click any template to view details

### 2. Template Details
- View complete skill breakdown
- See all topics and subtopics
- Review prerequisites and keywords
- Optionally customize the title before importing

### 3. Import Template
- Click "Import Roadmap" on template detail page
- Optionally customize the title
- Roadmap appears in "My Roadmaps"

### 4. Create Custom Roadmap
- Click "Create Roadmap" button
- Fill in title, description, category, target date
- Roadmap created with empty skill list
- Add skills and topics after creation

### 5. Track Progress
- Each skill has a status selector (Not Started / In progress / Completed)
- Progress bar (0-100%)
- Drag slider to update progress
- Overall roadmap progress calculated automatically

### 6. Manage Content
- Add skills to roadmap
- Edit skill details
- Delete skills
- Add topics to skills
- View hierarchical structure (Roadmap > Skills > Topics > Subtopics)

## Data Model

### RoadmapTemplate
```javascript
{
  name: "Frontend Developer",        // Unique identifier
  title: "Frontend Developer Roadmap",
  description: "...",
  icon: "🎨",
  category: "Frontend",
  difficulty: "Intermediate",
  estimatedHours: 200,
  skills: [
    {
      title: "HTML & CSS Mastery",
      description: "...",
      level: "Beginner",
      estimatedHours: 40,
      topics: [
        {
          title: "HTML5 Semantics",
          description: "...",
          subtopics: [
            {
              title: "Semantic Elements",
              description: "...",
              resourceLinks: ["..."]
            }
          ]
        }
      ]
    }
  ],
  prerequisites: ["Basic HTML/CSS", "Basic JavaScript"],
  keywords: ["React", "Vue", "Angular", ...]
}
```

### Roadmap (User)
```javascript
{
  user: ObjectId,                      // Reference to User
  title: "My Frontend Learning Path",
  description: "...",
  icon: "🎨",
  category: "Frontend",
  skills: [
    {
      title: "HTML & CSS Mastery",
      description: "...",
      level: "Beginner",
      status: "In progress",
      progress: 45,
      estimatedHours: 40,
      topics: [
        {
          title: "HTML5 Semantics",
          description: "...",
          status: "Learning",
          progress: 60,
          subtopics: [
            {
              title: "Semantic Elements",
              description: "...",
              status: "Completed",
              resourceLinks: ["..."],
              notes: "..."
            }
          ]
        }
      ]
    }
  ],
  status: "In Progress",                // Not Started / In Progress / Completed
  progress: 45,                         // Calculated from skills
  sourceTemplate: "Frontend Developer", // If imported
  templateId: ObjectId,                 // If imported
  startDate: Date,
  targetDate: Date,
  estimatedHours: 200,
  completedHours: 90,
  createdAt: Date,
  updatedAt: Date
}
```

## Progress Calculation

- **Roadmap Progress**: Average of all skill progress
- **Skill Progress**: Set manually (0-100%) or calculated from topics
- **Status Sync**: Automatically updates based on skills
  - All Completed → Roadmap Completed
  - Any In Progress → Roadmap In Progress
  - None started → Roadmap Not Started

## Advanced Features

### Progress Tracking
- Real-time progress updates
- Visual progress bars
- Skill status management
- Overall roadmap completion percentage

### Template Customization
- Import with custom title
- Add new skills after import
- Modify existing skills
- Delete unwanted skills

### Statistics
- Total roadmaps (all statuses)
- Completed/In Progress counts
- Total skills across all roadmaps
- Average completion percentage

## Future Enhancements

1. **Collaborative Roadmaps** - Share roadmaps with team members
2. **Roadmap Scheduling** - Auto-schedule skills based on timeframe
3. **Recommendations** - AI-suggested roadmaps based on user skills
4. **Milestones** - Mark important checkpoints
5. **Resource Integration** - Link to courses, tutorials, books
6. **Export** - Export roadmap as PDF or markdown
7. **Community Templates** - User-created and rated templates
8. **Notifications** - Reminders for roadmap milestones

## Troubleshooting

### Templates Not Showing
1. Ensure you've run `npm run seed` in the server directory
2. Check MongoDB is running
3. Check server logs for errors
4. Verify RoadmapTemplate collection exists in MongoDB

### Import Failing
1. Ensure user is authenticated
2. Check template ID exists
3. Verify MongoDB connection
4. Check server logs for validation errors

### Progress Not Updating
1. Check network requests in browser DevTools
2. Verify user is authenticated
3. Check MongoDB for data persistence
4. Restart frontend if needed

## Support

For issues or questions about the Roadmap Templates feature, check:
- Browser console for client errors
- Server terminal for backend errors
- MongoDB logs for data issues
