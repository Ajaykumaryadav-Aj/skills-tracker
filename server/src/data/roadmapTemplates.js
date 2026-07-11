export const roadmapTemplates = [
  {
    name: 'Frontend Developer',
    title: 'Frontend Developer Roadmap',
    description: 'Complete roadmap to become a professional frontend developer with modern web technologies.',
    icon: '🎨',
    category: 'Frontend',
    difficulty: 'Intermediate',
    estimatedHours: 200,
    prerequisites: ['Basic HTML/CSS', 'Basic JavaScript'],
    keywords: ['React', 'Vue', 'Angular', 'CSS', 'JavaScript', 'Responsive Design'],
    skills: [
      {
        title: 'HTML & CSS Mastery',
        description: 'Deep dive into HTML5 semantics and CSS3 advanced techniques',
        level: 'Beginner',
        estimatedHours: 40,
        topics: [
          {
            title: 'HTML5 Semantics',
            description: 'Learn semantic HTML5 elements and their proper usage',
            subtopics: [
              {
                title: 'Semantic Elements',
                description: 'article, section, nav, header, footer, etc.',
              },
              {
                title: 'Forms & Validation',
                description: 'HTML5 form elements and native validation',
              },
              {
                title: 'Accessibility (a11y)',
                description: 'ARIA roles and semantic HTML for accessibility',
              },
            ],
          },
          {
            title: 'CSS3 Fundamentals',
            description: 'Core CSS3 techniques and best practices',
            subtopics: [
              {
                title: 'Flexbox Layout',
                description: 'Master flexible box layout module',
              },
              {
                title: 'Grid Layout',
                description: 'Learn CSS Grid for complex layouts',
              },
              {
                title: 'Animations & Transitions',
                description: 'Create smooth animations and transitions',
              },
              {
                title: 'Responsive Design',
                description: 'Mobile-first and media queries',
              },
            ],
          },
        ],
      },
      {
        title: 'JavaScript Fundamentals',
        description: 'Master modern JavaScript (ES6+) and the DOM',
        level: 'Beginner',
        estimatedHours: 50,
        topics: [
          {
            title: 'Core JavaScript',
            description: 'Variables, functions, scope, closures, prototypes',
            subtopics: [
              {
                title: 'Variables & Types',
                description: 'let, const, var, and JavaScript data types',
              },
              {
                title: 'Functions & Scope',
                description: 'Function declarations, arrow functions, closures',
              },
              {
                title: 'Async JavaScript',
                description: 'Promises, async/await, callbacks',
              },
            ],
          },
          {
            title: 'DOM Manipulation',
            description: 'Interact with HTML and CSS from JavaScript',
            subtopics: [
              {
                title: 'DOM Selection',
                description: 'querySelector, getElementById, etc.',
              },
              {
                title: 'Event Handling',
                description: 'Event listeners and event delegation',
              },
              {
                title: 'DOM Updates',
                description: 'Modify HTML and CSS dynamically',
              },
            ],
          },
          {
            title: 'Modern JavaScript (ES6+)',
            description: 'Learn modern JavaScript features',
            subtopics: [
              {
                title: 'Arrow Functions & Classes',
                description: 'Modern function and class syntax',
              },
              {
                title: 'Destructuring & Spread',
                description: 'Destructuring assignment and spread operator',
              },
              {
                title: 'Modules',
                description: 'import/export and module system',
              },
            ],
          },
        ],
      },
      {
        title: 'React Fundamentals',
        description: 'Build interactive UIs with React',
        level: 'Intermediate',
        estimatedHours: 60,
        topics: [
          {
            title: 'React Basics',
            description: 'Components, JSX, props, and state',
            subtopics: [
              {
                title: 'Components',
                description: 'Functional and class components',
              },
              {
                title: 'JSX',
                description: 'Write HTML-like code in JavaScript',
              },
              {
                title: 'Props & State',
                description: 'Pass data and manage component state',
              },
            ],
          },
          {
            title: 'React Hooks',
            description: 'Use hooks for state and side effects',
            subtopics: [
              {
                title: 'useState & useEffect',
                description: 'State and lifecycle hooks',
              },
              {
                title: 'Custom Hooks',
                description: 'Create reusable hook logic',
              },
              {
                title: 'Context API',
                description: 'Global state management with Context',
              },
            ],
          },
          {
            title: 'Routing & Forms',
            description: 'Navigation and form handling',
            subtopics: [
              {
                title: 'React Router',
                description: 'Client-side routing with React Router',
              },
              {
                title: 'Form Handling',
                description: 'Controlled components and form validation',
              },
            ],
          },
        ],
      },
      {
        title: 'Build Tools & Deployment',
        description: 'Webpack, Vite, and deployment strategies',
        level: 'Intermediate',
        estimatedHours: 30,
        topics: [
          {
            title: 'Module Bundlers',
            description: 'Webpack, Vite, and other bundlers',
            subtopics: [
              {
                title: 'Vite Setup',
                description: 'Fast build tool for modern projects',
              },
              {
                title: 'Webpack Basics',
                description: 'Module bundling and loaders',
              },
            ],
          },
          {
            title: 'Deployment',
            description: 'Deploy applications to production',
            subtopics: [
              {
                title: 'Vercel & Netlify',
                description: 'Deploy to Vercel or Netlify',
              },
              {
                title: 'Performance Optimization',
                description: 'Code splitting and lazy loading',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Backend Developer',
    title: 'Backend Developer Roadmap',
    description: 'Complete roadmap to become a professional backend developer with server-side technologies.',
    icon: '⚙️',
    category: 'Backend',
    difficulty: 'Intermediate',
    estimatedHours: 250,
    prerequisites: ['Basic Programming', 'Understanding of APIs'],
    keywords: ['Node.js', 'Express', 'Databases', 'REST APIs', 'Authentication'],
    skills: [
      {
        title: 'Node.js & Express Fundamentals',
        description: 'Build server applications with Node.js and Express',
        level: 'Beginner',
        estimatedHours: 50,
        topics: [
          {
            title: 'Node.js Basics',
            description: 'Runtime environment and core modules',
            subtopics: [
              {
                title: 'Event Loop & Async',
                description: 'Understand Node.js event-driven architecture',
              },
              {
                title: 'File System & Streams',
                description: 'Work with files and data streams',
              },
              {
                title: 'npm & Packages',
                description: 'Manage dependencies with npm',
              },
            ],
          },
          {
            title: 'Express Framework',
            description: 'Build web servers with Express',
            subtopics: [
              {
                title: 'Routing',
                description: 'Define routes and handle requests',
              },
              {
                title: 'Middleware',
                description: 'Create and use middleware functions',
              },
              {
                title: 'Error Handling',
                description: 'Proper error handling strategies',
              },
            ],
          },
        ],
      },
      {
        title: 'Databases',
        description: 'SQL and NoSQL database design and usage',
        level: 'Intermediate',
        estimatedHours: 60,
        topics: [
          {
            title: 'SQL Databases',
            description: 'PostgreSQL, MySQL, and relational concepts',
            subtopics: [
              {
                title: 'SQL Queries',
                description: 'SELECT, INSERT, UPDATE, DELETE, JOINs',
              },
              {
                title: 'Schema Design',
                description: 'Normalization and relationships',
              },
              {
                title: 'Indexes & Performance',
                description: 'Query optimization techniques',
              },
            ],
          },
          {
            title: 'NoSQL Databases',
            description: 'MongoDB and document-based databases',
            subtopics: [
              {
                title: 'MongoDB Basics',
                description: 'Document storage and CRUD operations',
              },
              {
                title: 'Mongoose ODM',
                description: 'Object Document Mapper for MongoDB',
              },
              {
                title: 'Aggregation Pipeline',
                description: 'Complex data transformations',
              },
            ],
          },
        ],
      },
      {
        title: 'API Design & Authentication',
        description: 'RESTful APIs and authentication mechanisms',
        level: 'Intermediate',
        estimatedHours: 50,
        topics: [
          {
            title: 'REST APIs',
            description: 'Design principles and best practices',
            subtopics: [
              {
                title: 'HTTP Methods & Status Codes',
                description: 'Proper use of GET, POST, PUT, DELETE',
              },
              {
                title: 'API Versioning',
                description: 'Manage API versions effectively',
              },
              {
                title: 'Request Validation',
                description: 'Validate input data',
              },
            ],
          },
          {
            title: 'Authentication & Authorization',
            description: 'Secure your APIs',
            subtopics: [
              {
                title: 'JWT Tokens',
                description: 'JSON Web Tokens for stateless auth',
              },
              {
                title: 'Password Security',
                description: 'Hashing and salting passwords',
              },
              {
                title: 'Authorization Strategies',
                description: 'Role-based access control (RBAC)',
              },
            ],
          },
        ],
      },
      {
        title: 'Advanced Backend Topics',
        description: 'Caching, testing, and deployment',
        level: 'Advanced',
        estimatedHours: 60,
        topics: [
          {
            title: 'Caching & Performance',
            description: 'Redis and caching strategies',
            subtopics: [
              {
                title: 'Redis Basics',
                description: 'In-memory data store',
              },
              {
                title: 'Caching Strategies',
                description: 'Cache-aside, write-through, etc.',
              },
            ],
          },
          {
            title: 'Testing',
            description: 'Unit, integration, and end-to-end tests',
            subtopics: [
              {
                title: 'Unit Testing',
                description: 'Jest and Mocha frameworks',
              },
              {
                title: 'Integration Testing',
                description: 'Test API endpoints',
              },
            ],
          },
          {
            title: 'DevOps & Deployment',
            description: 'Docker, CI/CD, and cloud platforms',
            subtopics: [
              {
                title: 'Docker',
                description: 'Containerize applications',
              },
              {
                title: 'CI/CD Pipelines',
                description: 'GitHub Actions, GitLab CI',
              },
              {
                title: 'Cloud Platforms',
                description: 'AWS, Heroku, DigitalOcean',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Full Stack Developer',
    title: 'Full Stack Developer Roadmap',
    description: 'Master both frontend and backend development to build complete web applications.',
    icon: '🚀',
    category: 'Full Stack',
    difficulty: 'Advanced',
    estimatedHours: 400,
    prerequisites: ['Basic HTML/CSS', 'Basic JavaScript', 'Basic Programming'],
    keywords: ['React', 'Node.js', 'MongoDB', 'Express', 'Web Development'],
    skills: [
      {
        title: 'Frontend Essentials',
        description: 'HTML, CSS, and JavaScript fundamentals',
        level: 'Beginner',
        estimatedHours: 60,
        topics: [
          {
            title: 'Web Fundamentals',
            description: 'HTML5, CSS3, and JavaScript ES6+',
            subtopics: [
              {
                title: 'HTML & Semantic Markup',
                description: 'Proper HTML structure',
              },
              {
                title: 'CSS & Responsive Design',
                description: 'Modern CSS techniques',
              },
              {
                title: 'JavaScript Fundamentals',
                description: 'Core language concepts',
              },
            ],
          },
        ],
      },
      {
        title: 'React Development',
        description: 'Modern frontend with React',
        level: 'Intermediate',
        estimatedHours: 80,
        topics: [
          {
            title: 'React Ecosystem',
            description: 'React, hooks, and state management',
            subtopics: [
              {
                title: 'React Components',
                description: 'Functional components and hooks',
              },
              {
                title: 'State Management',
                description: 'Redux, Context API, or Zustand',
              },
              {
                title: 'Routing',
                description: 'React Router for navigation',
              },
            ],
          },
        ],
      },
      {
        title: 'Backend with Node.js',
        description: 'Server-side development with Node.js and Express',
        level: 'Intermediate',
        estimatedHours: 80,
        topics: [
          {
            title: 'Server Development',
            description: 'Express and API development',
            subtopics: [
              {
                title: 'Express Framework',
                description: 'Create APIs and handle requests',
              },
              {
                title: 'Middleware & Authentication',
                description: 'Secure your APIs',
              },
              {
                title: 'Error Handling',
                description: 'Proper error management',
              },
            ],
          },
        ],
      },
      {
        title: 'Databases & Data',
        description: 'MongoDB and data modeling',
        level: 'Intermediate',
        estimatedHours: 60,
        topics: [
          {
            title: 'Database Design',
            description: 'Schema design and relationships',
            subtopics: [
              {
                title: 'MongoDB & Mongoose',
                description: 'Document database and ODM',
              },
              {
                title: 'Data Modeling',
                description: 'Design efficient schemas',
              },
            ],
          },
        ],
      },
      {
        title: 'Tools & Deployment',
        description: 'Build tools, testing, and deployment',
        level: 'Advanced',
        estimatedHours: 80,
        topics: [
          {
            title: 'Development Tools',
            description: 'Build tools and development workflow',
            subtopics: [
              {
                title: 'Vite & Bundlers',
                description: 'Modern build tools',
              },
              {
                title: 'Testing',
                description: 'Unit and integration tests',
              },
              {
                title: 'Version Control',
                description: 'Git and GitHub',
              },
            ],
          },
          {
            title: 'Deployment & DevOps',
            description: 'Deploy applications to production',
            subtopics: [
              {
                title: 'Containerization',
                description: 'Docker for deployment',
              },
              {
                title: 'Cloud Platforms',
                description: 'Heroku, Vercel, AWS',
              },
              {
                title: 'CI/CD',
                description: 'Automated testing and deployment',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'React Developer',
    title: 'React Developer Roadmap',
    description: 'Become an expert React developer with advanced techniques and best practices.',
    icon: '⚛️',
    category: 'Frontend',
    difficulty: 'Intermediate',
    estimatedHours: 150,
    prerequisites: ['JavaScript Fundamentals', 'HTML/CSS Basics'],
    keywords: ['React', 'Hooks', 'State Management', 'Performance', 'Testing'],
    skills: [
      {
        title: 'React Foundations',
        description: 'Core React concepts and APIs',
        level: 'Beginner',
        estimatedHours: 40,
        topics: [
          {
            title: 'React Fundamentals',
            description: 'Components, JSX, props, and state',
            subtopics: [
              {
                title: 'Functional Components',
                description: 'Modern React component syntax',
              },
              {
                title: 'Props & State',
                description: 'Component data flow',
              },
              {
                title: 'Rendering Lists',
                description: 'Keys and efficient rendering',
              },
            ],
          },
        ],
      },
      {
        title: 'Hooks & State Management',
        description: 'Advanced hooks and state management patterns',
        level: 'Intermediate',
        estimatedHours: 50,
        topics: [
          {
            title: 'React Hooks',
            description: 'useState, useEffect, and custom hooks',
            subtopics: [
              {
                title: 'State Hooks',
                description: 'useState and useReducer',
              },
              {
                title: 'Effect Hooks',
                description: 'Side effects and cleanup',
              },
              {
                title: 'Custom Hooks',
                description: 'Reusable logic patterns',
              },
            ],
          },
          {
            title: 'State Management',
            description: 'Context API, Redux, or other libraries',
            subtopics: [
              {
                title: 'Context API',
                description: 'Built-in state management',
              },
              {
                title: 'Redux Basics',
                description: 'Predictable state container',
              },
            ],
          },
        ],
      },
      {
        title: 'Performance & Optimization',
        description: 'Optimize React applications',
        level: 'Advanced',
        estimatedHours: 40,
        topics: [
          {
            title: 'Performance Optimization',
            description: 'Memoization and code splitting',
            subtopics: [
              {
                title: 'Memoization',
                description: 'React.memo, useMemo, useCallback',
              },
              {
                title: 'Code Splitting',
                description: 'Lazy loading components',
              },
              {
                title: 'Profiling',
                description: 'Performance analysis tools',
              },
            ],
          },
        ],
      },
      {
        title: 'Testing & Best Practices',
        description: 'Testing React components and project setup',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'Testing',
            description: 'Jest and React Testing Library',
            subtopics: [
              {
                title: 'Unit Testing',
                description: 'Test individual components',
              },
              {
                title: 'Integration Testing',
                description: 'Test component interactions',
              },
            ],
          },
          {
            title: 'Project Setup',
            description: 'Create React App and alternatives',
            subtopics: [
              {
                title: 'Build Tools',
                description: 'Vite, Create React App',
              },
              {
                title: 'Styling',
                description: 'CSS, Tailwind, styled-components',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Node.js Developer',
    title: 'Node.js Developer Roadmap',
    description: 'Master Node.js and server-side JavaScript development.',
    icon: '🟢',
    category: 'Backend',
    difficulty: 'Intermediate',
    estimatedHours: 180,
    prerequisites: ['JavaScript Fundamentals', 'Understanding of Servers'],
    keywords: ['Node.js', 'Express', 'Async', 'Databases', 'APIs'],
    skills: [
      {
        title: 'Node.js Fundamentals',
        description: 'Core Node.js concepts and modules',
        level: 'Beginner',
        estimatedHours: 40,
        topics: [
          {
            title: 'Node.js Basics',
            description: 'Event loop, modules, and core APIs',
            subtopics: [
              {
                title: 'Event-Driven Architecture',
                description: 'Understand the event loop',
              },
              {
                title: 'Modules & npm',
                description: 'CommonJS and package management',
              },
              {
                title: 'File System & Streams',
                description: 'Read and write files efficiently',
              },
            ],
          },
        ],
      },
      {
        title: 'Express.js Framework',
        description: 'Build APIs with Express',
        level: 'Intermediate',
        estimatedHours: 50,
        topics: [
          {
            title: 'Express Fundamentals',
            description: 'Routing and middleware',
            subtopics: [
              {
                title: 'Routing',
                description: 'HTTP methods and routes',
              },
              {
                title: 'Middleware',
                description: 'Request/response processing',
              },
              {
                title: 'Error Handling',
                description: 'Error middleware and strategies',
              },
            ],
          },
        ],
      },
      {
        title: 'Asynchronous Programming',
        description: 'Promises, async/await, and callbacks',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'Async Patterns',
            description: 'Callbacks, promises, async/await',
            subtopics: [
              {
                title: 'Promises',
                description: 'Promise-based async code',
              },
              {
                title: 'Async/Await',
                description: 'Modern async syntax',
              },
              {
                title: 'Error Handling',
                description: 'Try/catch and promise rejection',
              },
            ],
          },
        ],
      },
      {
        title: 'Databases & ORMs',
        description: 'Working with databases in Node.js',
        level: 'Intermediate',
        estimatedHours: 50,
        topics: [
          {
            title: 'Database Integration',
            description: 'MongoDB, PostgreSQL, and ORMs',
            subtopics: [
              {
                title: 'MongoDB & Mongoose',
                description: 'NoSQL database and ODM',
              },
              {
                title: 'SQL Databases',
                description: 'PostgreSQL with Node.js',
              },
              {
                title: 'Database Design',
                description: 'Schema design principles',
              },
            ],
          },
        ],
      },
      {
        title: 'Deployment & DevOps',
        description: 'Deploy Node.js applications',
        level: 'Advanced',
        estimatedHours: 40,
        topics: [
          {
            title: 'Production Deployment',
            description: 'Containerization and cloud deployment',
            subtopics: [
              {
                title: 'Docker',
                description: 'Containerize Node.js apps',
              },
              {
                title: 'Cloud Platforms',
                description: 'Heroku, AWS, DigitalOcean',
              },
              {
                title: 'Monitoring & Logging',
                description: 'Production monitoring',
              },
            ],
          },
        ],
      },
    ],
  },
]
