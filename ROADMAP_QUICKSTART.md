# Roadmap Templates - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Seed the Templates (One-time)

```bash
# In the server directory
cd server
npm run seed
```

Expected output:
```
Connected to MongoDB
Cleared existing templates
Created 5 roadmap templates
Created templates: Frontend Developer, Backend Developer, Full Stack Developer, React Developer, Node.js Developer
Disconnected from MongoDB
```

### Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Step 3: Use the Feature

1. Navigate to **Roadmaps** in the main navigation
2. You'll see two tabs:
   - **My Roadmaps** - Your custom and imported roadmaps
   - **Templates** - Browse 5 pre-built templates

## 📚 Available Templates

| Template | Duration | Level | Icon |
|----------|----------|-------|------|
| Frontend Developer | 200 hours | Intermediate | 🎨 |
| Backend Developer | 250 hours | Intermediate | ⚙️ |
| Full Stack Developer | 400 hours | Advanced | 🚀 |
| React Developer | 150 hours | Intermediate | ⚛️ |
| Node.js Developer | 180 hours | Intermediate | 🟢 |

## 🎯 Main Actions

### Import a Template
1. Go to **Roadmaps** → **Templates** tab
2. Click any template card
3. Optionally customize the title
4. Click **"Import Roadmap"**
5. You're redirected to your new roadmap

### Create Custom Roadmap
1. Click **"Create Roadmap"** button
2. Fill in title, description, category, target date
3. Click **"Create Roadmap"**
4. Add skills after creation

### Track Progress
1. Click on any roadmap in **My Roadmaps**
2. For each skill:
   - Change status (Not Started / In progress / Completed)
   - Drag slider to set progress percentage
3. Overall progress updates automatically

### Manage Skills
1. In your roadmap detail page:
   - Click **"+ Add Skill"** to add new skills
   - Expand skills to see topics
   - Edit or delete skills as needed

## 🔗 URLs

Once running, access:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000 (or your configured port)
- **Roadmaps Page**: http://localhost:5173/roadmaps

## 📊 What's Inside Each Template?

Each template includes:
- **Multiple skills** organized by difficulty level
- **Topics** for each skill (what to learn)
- **Subtopics** for each topic (detailed breakdown)
- **Estimated hours** for completion
- **Prerequisites** to get started
- **Keywords** for quick reference

Example structure for Frontend Developer:
```
Frontend Developer (200 hours)
├── HTML & CSS Mastery (40 hours)
│   ├── HTML5 Semantics
│   │   ├── Semantic Elements
│   │   ├── Forms & Validation
│   │   └── Accessibility (a11y)
│   └── CSS3 Fundamentals
│       ├── Flexbox Layout
│       ├── Grid Layout
│       ├── Animations & Transitions
│       └── Responsive Design
├── JavaScript Fundamentals (50 hours)
│   ├── Core JavaScript
│   ├── DOM Manipulation
│   └── Modern JavaScript (ES6+)
├── React Fundamentals (60 hours)
│   ├── React Basics
│   ├── React Hooks
│   └── Routing & Forms
└── Build Tools & Deployment (30 hours)
    ├── Module Bundlers
    └── Deployment
```

## 🐛 Troubleshooting

**Q: Templates not showing?**
A: Run `npm run seed` in the server directory

**Q: "Failed to load data" error?**
A: Check if backend is running (`npm run dev` in server folder)

**Q: Progress not saving?**
A: Check browser console and server logs for errors

**Q: MongoDB connection error?**
A: Ensure MongoDB is running on your machine

## 💡 Pro Tips

1. **Import then Customize** - Import a template and modify skills to match your needs
2. **Use Target Dates** - Set realistic target dates for motivation
3. **Track Regularly** - Update progress as you learn
4. **View Statistics** - Check your overall progress in the Dashboard

## 📈 Next Features

Coming soon:
- Skill scheduling and milestones
- Resource links (courses, tutorials, docs)
- Team collaboration on roadmaps
- Export to PDF
- Progress notifications
- Community-created templates

## 🆘 Need Help?

Check the full documentation at: `ROADMAP_SETUP.md` in the project root
