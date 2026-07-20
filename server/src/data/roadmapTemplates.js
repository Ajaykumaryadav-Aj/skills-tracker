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
              { title: 'Semantic Elements', description: 'article, section, nav, header, footer, etc.' },
              { title: 'Forms & Validation', description: 'HTML5 form elements and native validation' },
              { title: 'Accessibility (a11y)', description: 'ARIA roles and semantic HTML for accessibility' }
            ]
          },
          {
            title: 'CSS3 Fundamentals',
            description: 'Core CSS3 techniques and best practices',
            subtopics: [
              { title: 'Flexbox Layout', description: 'Master flexible box layout module' },
              { title: 'Grid Layout', description: 'Learn CSS Grid for complex layouts' },
              { title: 'Responsive Design', description: 'Mobile-first and media queries' }
            ]
          }
        ]
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
              { title: 'Variables & Types', description: 'let, const, var, and JavaScript data types' },
              { title: 'Functions & Scope', description: 'Function declarations, arrow functions, closures' },
              { title: 'Async JavaScript', description: 'Promises, async/await, callbacks' }
            ]
          },
          {
            title: 'DOM Manipulation',
            description: 'Interact with HTML and CSS from JavaScript',
            subtopics: [
              { title: 'Event Handling', description: 'Event listeners and event delegation' },
              { title: 'DOM Updates', description: 'Modify HTML and CSS dynamically' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Backend Developer',
    title: 'Backend Developer Roadmap',
    description: 'Master backend technologies, servers, databases, and APIs.',
    icon: '⚙️',
    category: 'Backend',
    difficulty: 'Intermediate',
    estimatedHours: 220,
    prerequisites: ['Basic JavaScript', 'Understanding of Internet'],
    keywords: ['Node.js', 'Express', 'SQL', 'NoSQL', 'Security', 'APIs'],
    skills: [
      {
        title: 'Node.js & Express Basics',
        description: 'Server development with Node.js and the Express framework',
        level: 'Beginner',
        estimatedHours: 50,
        topics: [
          {
            title: 'Express REST APIs',
            description: 'Routing, middleware, request parsing',
            subtopics: [
              { title: 'Express Routing', description: 'Define HTTP methods and path routes' },
              { title: 'Middleware Functions', description: 'Configure custom request processing logic' }
            ]
          }
        ]
      },
      {
        title: 'Databases & Mongoose',
        description: 'Integrate relational and non-relational databases',
        level: 'Intermediate',
        estimatedHours: 60,
        topics: [
          {
            title: 'NoSQL Databases',
            description: 'Connect, query, and design schemas in MongoDB using Mongoose',
            subtopics: [
              { title: 'Schema Design', description: 'Structured Mongoose schemas and relationships' },
              { title: 'CRUD Queries', description: 'Optimize database CRUD actions and indexes' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'React Developer',
    title: 'React Developer Roadmap',
    description: 'Master building robust, high-performance web applications using React.',
    icon: '⚛️',
    category: 'Frontend',
    difficulty: 'Intermediate',
    estimatedHours: 140,
    prerequisites: ['JavaScript ES6+', 'HTML/CSS Basics'],
    keywords: ['React', 'Hooks', 'Vite', 'State Management', 'React Router'],
    skills: [
      {
        title: 'React Basics',
        description: 'JSX, components architecture, props, and standard state management',
        level: 'Beginner',
        estimatedHours: 30,
        topics: [
          {
            title: 'JSX & Rendering',
            description: 'Understand JSX syntax, elements, and conditional rendering',
            subtopics: [
              { title: 'JSX Syntax Rules', description: 'Translating HTML tags to React JSX elements' },
              { title: 'Keys and Lists', description: 'Performant list rendering using key attributes' }
            ]
          },
          {
            title: 'Components & Props',
            description: 'Reusable component structure and properties data flow',
            subtopics: [
              { title: 'Functional Components', description: 'Define presentation elements via standard functions' },
              { title: 'Props Destructuring', description: 'Accessing parent properties efficiently' }
            ]
          }
        ]
      },
      {
        title: 'State Management & Hooks',
        description: 'Configure interactive interfaces using state hooks and context APIs',
        level: 'Intermediate',
        estimatedHours: 50,
        topics: [
          {
            title: 'React Hooks API',
            description: 'Master useState, useEffect, and custom hooks',
            subtopics: [
              { title: 'useState Hooks', description: 'Manage local component states dynamically' },
              { title: 'useEffect Lifecycles', description: 'Triggering side effects and dependency changes' }
            ]
          },
          {
            title: 'Global State Management',
            description: 'Share app state across components using Context API',
            subtopics: [
              { title: 'Context Creation', description: 'Set up Provider and Consumer React contexts' }
            ]
          }
        ]
      },
      {
        title: 'Advanced React & Performance',
        description: 'Vite build tool, client-side routing, and rendering optimization',
        level: 'Advanced',
        estimatedHours: 60,
        topics: [
          {
            title: 'React Router',
            description: 'Client-side SPA route definitions and navigations',
            subtopics: [
              { title: 'Route Definitions', description: 'Setting up routing routes and URL parameter hooks' }
            ]
          },
          {
            title: 'Performance Memoization',
            description: 'Optimize renders using memoization structures',
            subtopics: [
              { title: 'React.memo', description: 'Prevent unnecessary re-renders of child props' },
              { title: 'useMemo & useCallback', description: 'Cache heavy values and functions contextually' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'MERN Stack',
    title: 'MERN Stack Developer Roadmap',
    description: 'Learn full-stack JavaScript development using MongoDB, Express, React, and Node.js.',
    icon: '🥞',
    category: 'Full Stack',
    difficulty: 'Advanced',
    estimatedHours: 180,
    prerequisites: ['Frontend Developer Roadmap', 'Backend Developer Roadmap'],
    keywords: ['MERN', 'MongoDB', 'Express', 'React', 'Node.js', 'Full Stack'],
    skills: [
      {
        title: 'MongoDB Database',
        description: 'Learn NoSQL document data modeling and queries',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'Data Modeling',
            description: 'Structuring collections and embedded documents',
            subtopics: [
              { title: 'Embedded Docs', description: 'Define child arrays vs reference IDs' }
            ]
          }
        ]
      },
      {
        title: 'Express.js Backend API',
        description: 'Build robust REST APIs with routing, validation, and error handlers',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'REST Architecture',
            description: 'Setting up semantic endpoints and HTTP request handlers',
            subtopics: [
              { title: 'Express Router', description: 'Separate resource routing modules cleanly' }
            ]
          }
        ]
      },
      {
        title: 'React.js Frontend UI',
        description: 'Build interactive SPA client consuming server endpoints',
        level: 'Intermediate',
        estimatedHours: 60,
        topics: [
          {
            title: 'HTTP Integration',
            description: 'Configure Axios clients to authenticate and fetch databases',
            subtopics: [
              { title: 'Axios Interceptors', description: 'Attach JWT credentials automatically' }
            ]
          }
        ]
      },
      {
        title: 'Node.js Core Runtime',
        description: 'Configure asynchronous JavaScript runtimes and event engines',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'Node Event Loop',
            description: 'Asynchronous task schedules and non-blocking I/O threads',
            subtopics: [
              { title: 'Task Queue', description: 'Understand microtasks and macrotasks execution' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Docker',
    title: 'Docker & Containerization Roadmap',
    description: 'Master containerization concepts, building custom images, and managing service environments.',
    icon: '🐳',
    category: 'DevOps',
    difficulty: 'Intermediate',
    estimatedHours: 110,
    prerequisites: ['Basic Linux Commands', 'Server Deployments Overview'],
    keywords: ['Docker', 'Containers', 'Docker Compose', 'Microservices', 'Dockerfiles'],
    skills: [
      {
        title: 'Containerization Basics',
        description: 'Differentiate containers from virtual machines and master Docker CLI commands',
        level: 'Beginner',
        estimatedHours: 20,
        topics: [
          {
            title: 'Docker Engine CLI',
            description: 'Run, stop, inspect, and list containers',
            subtopics: [
              { title: 'Container Lifecycle', description: 'docker run, stop, start, exec' }
            ]
          }
        ]
      },
      {
        title: 'Dockerfiles & Custom Images',
        description: 'Build reproducible developer environments using structured multi-stage Dockerfiles',
        level: 'Intermediate',
        estimatedHours: 30,
        topics: [
          {
            title: 'Dockerfile Directives',
            description: 'FROM, RUN, COPY, EXPOSE, CMD, ENTRYPOINT definitions',
            subtopics: [
              { title: 'Caching Layers', description: 'Ordering steps to leverage Docker cache layers' }
            ]
          }
        ]
      },
      {
        title: 'Multi-container with Docker Compose',
        description: 'Define and orchestrate linked microservices inside unified local environments',
        level: 'Intermediate',
        estimatedHours: 30,
        topics: [
          {
            title: 'Compose Schemas',
            description: 'Write docker-compose.yml with services, networks, and volumes',
            subtopics: [
              { title: 'Services Networking', description: 'Configure links and internal ports mappings' }
            ]
          }
        ]
      },
      {
        title: 'Production Deployments & Registries',
        description: 'Push custom images to Docker Hub and deploy to container platforms',
        level: 'Advanced',
        estimatedHours: 30,
        topics: [
          {
            title: 'Container Security',
            description: 'Best practices for running non-root users inside containers',
            subtopics: [
              { title: 'Image Scanning', description: 'Scrutinizing vulnerability layers' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'DevOps',
    title: 'DevOps & Infrastructure Roadmap',
    description: 'Learn modern DevOps pipelines, automation, orchestration, and monitoring.',
    icon: '♾️',
    category: 'DevOps',
    difficulty: 'Advanced',
    estimatedHours: 160,
    prerequisites: ['Basic Linux', 'Docker Containerization'],
    keywords: ['CI/CD', 'GitHub Actions', 'Terraform', 'Prometheus', 'Grafana', 'Ansible'],
    skills: [
      {
        title: 'Linux Administration & Scripting',
        description: 'Master Bash terminal scripting, process management, and cron jobs',
        level: 'Beginner',
        estimatedHours: 40,
        topics: [
          {
            title: 'Terminal Mastery',
            description: 'Permissions management, network diagnostic tools, process trees',
            subtopics: [
              { title: 'Bash scripting', description: 'Write automation scripts with variables and pipes' }
            ]
          }
        ]
      },
      {
        title: 'CI/CD Automation Pipelines',
        description: 'Integrate automated tests, code linters, and deploy actions in GitHub Actions',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'GitHub Workflows',
            description: 'Configure automated actions based on pull requests and branch merges',
            subtopics: [
              { title: 'Workflow Actions', description: 'Write clean workflow YAML configuration files' }
            ]
          }
        ]
      },
      {
        title: 'Infrastructure as Code (IaC)',
        description: 'Provision cloud servers declaratively using Terraform plans',
        level: 'Advanced',
        estimatedHours: 50,
        topics: [
          {
            title: 'Terraform Plans',
            description: 'Write resources definitions, state handling, and variables',
            subtopics: [
              { title: 'Terraform Providers', description: 'Integrating AWS, DigitalOcean, or Azure resources' }
            ]
          }
        ]
      },
      {
        title: 'Monitoring & Logs Metrics',
        description: 'Analyze server health indicators using Prometheus metrics and Grafana visual panels',
        level: 'Intermediate',
        estimatedHours: 30,
        topics: [
          {
            title: 'Metrics Scopes',
            description: 'Setting up exporters and graphing key system resource states',
            subtopics: [
              { title: 'Grafana Dashboards', description: 'Combine query stats into visual graphics panels' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Python',
    title: 'Python Software Engineer Roadmap',
    description: 'Complete path to master Python, object-oriented programming, and web services.',
    icon: '🐍',
    category: 'Other',
    difficulty: 'Intermediate',
    estimatedHours: 170,
    prerequisites: ['Computer Programming Basics'],
    keywords: ['Python', 'OOP', 'Django', 'Flask', 'Data Analysis', 'NumPy'],
    skills: [
      {
        title: 'Python Language Basics',
        description: 'Master syntax rules, list comprehensions, and built-in datastructures',
        level: 'Beginner',
        estimatedHours: 30,
        topics: [
          {
            title: 'Python Datatypes',
            description: 'Define lists, tuples, sets, dictionaries, and execution control',
            subtopics: [
              { title: 'Comprehensions', description: 'Expressive lists and dicts generation syntax' }
            ]
          }
        ]
      },
      {
        title: 'Object-Oriented Python',
        description: 'Implement inheritance, operator overloading, and exception controls',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'OOP Architecture',
            description: 'Classes declarations, initialization constructors, super functions',
            subtopics: [
              { title: 'Method Overriding', description: 'Polymorphic parent class updates in child classes' }
            ]
          }
        ]
      },
      {
        title: 'Python Web Frameworks',
        description: 'Deploy REST servers using Flask packages or Django ORM models',
        level: 'Intermediate',
        estimatedHours: 50,
        topics: [
          {
            title: 'Flask API endpoints',
            description: 'Route decorators, request payloads, JSON response structures',
            subtopics: [
              { title: 'Flask Server', description: 'Basic setup and hot reload configurations' }
            ]
          }
        ]
      },
      {
        title: 'Data Wrangling Tools',
        description: 'Process raw analytics data files using NumPy arrays and Pandas dataframes',
        level: 'Advanced',
        estimatedHours: 50,
        topics: [
          {
            title: 'Pandas Dataframes',
            description: 'Load CSV records, filter query rows, aggregate statistical values',
            subtopics: [
              { title: 'Data Cleaning', description: 'Impute missing metrics and clean duplicate records' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Java',
    title: 'Java Enterprise Developer Roadmap',
    description: 'Learn Java syntax, OOP design patterns, Spring Boot APIs, and Hibernate integrations.',
    icon: '☕',
    category: 'Other',
    difficulty: 'Advanced',
    estimatedHours: 180,
    prerequisites: ['Computer Programming Basics'],
    keywords: ['Java', 'Spring Boot', 'Hibernate', 'OOP', 'Maven', 'APIs'],
    skills: [
      {
        title: 'Java Basics & OOP Syntax',
        description: 'Understand compiler typing, classes definition, interfaces, and packages',
        level: 'Beginner',
        estimatedHours: 40,
        topics: [
          {
            title: 'Java Class Structures',
            description: 'Encapsulation modifiers, attributes accessors, constructors setup',
            subtopics: [
              { title: 'Interfaces', description: 'Define abstraction patterns using Java interfaces' }
            ]
          }
        ]
      },
      {
        title: 'Collections & Lambda Streams',
        description: 'Master Lists/Maps mappings and execute functional query streams',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'Streams Pipelines',
            description: 'Filter arrays, map elements, collect statistics using streams',
            subtopics: [
              { title: 'Lambda Expressions', description: 'Pass inline anonymous functions elegantly' }
            ]
          }
        ]
      },
      {
        title: 'Spring Boot REST Framework',
        description: 'Generate production backend servers using Spring RestController and Injection autowires',
        level: 'Advanced',
        estimatedHours: 60,
        topics: [
          {
            title: 'Spring Controller',
            description: 'Map URL requests parameters, serialize JSON records',
            subtopics: [
              { title: 'Dependency Injection', description: 'Autowired component instances configurations' }
            ]
          }
        ]
      },
      {
        title: 'JPA Entities & SQL DB',
        description: 'Connect databases using Hibernate JPA entity classes mappings',
        level: 'Intermediate',
        estimatedHours: 40,
        topics: [
          {
            title: 'ORM JPA Entity',
            description: 'Table annotations, primary keys generation strategies, table relationships',
            subtopics: [
              { title: 'Spring Data Repository', description: 'Extend JpaRepository interfaces' }
            ]
          }
        ]
      }
    ]
  }
];
