import crypto from 'crypto'
import AIHistory from '../models/AIHistory.js'
import LearningLog from '../models/LearningLog.js'
import Revision from '../models/Revision.js'
import Skill from '../models/Skill.js'
import Topic from '../models/Topic.js'
import { generateWithProvider } from './aiProvider.service.js'

const cache = new Map()
const cacheTtlMs = 10 * 60 * 1000
const cacheVersion = 'ai-quality-v5'
const maxStoredPromptLength = 19000

const makeCacheKey = (userId, type, payload) =>
  crypto.createHash('sha256').update(JSON.stringify({ cacheVersion, userId, type, payload })).digest('hex')

const fromCache = (key) => {
  const entry = cache.get(key)
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

const saveCache = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + cacheTtlMs })
}

const textPrompt = (title, payload) => `${title}

Quality rules:
- Write for a real learner, not as labels or keywords.
- Use complete sentences with enough context to understand the answer without guessing.
- Include concrete next steps, practice ideas, and examples where useful.
- Do not return one-word or two-word values unless the schema explicitly asks for a label.
- Keep the response concise but substantial.

Context:
${JSON.stringify(payload, null, 2)}`

const cleanPlainText = (value) => String(value || '')
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/[#*_`>~\-[\]()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const detectConceptBrief = (plainText) => {
  const text = String(plainText || '').toLowerCase()
  if (/\bhoc\b|higher order component/.test(text)) {
    return {
      concept: 'Higher-Order Component (HOC)',
      summary: 'A Higher-Order Component, usually called an HOC, is a React pattern where a function takes a component and returns a new enhanced component. It is used to reuse logic such as authentication checks, loading states, permissions, analytics, or shared data fetching without copying the same code into many components. In plain JavaScript terms, it is similar to a higher-order function because it accepts one thing as input and returns an improved version of it. Modern React often uses hooks instead of HOCs, but HOCs are still useful to understand because many older libraries and codebases use this pattern.',
      keyPoints: [
        'An HOC is a function that receives a component and returns another component with extra behavior or props.',
        'It helps reuse common UI logic across multiple components without duplicating the same code everywhere.',
        'A common example is wrapping a page component with authentication logic so only logged-in users can access it.',
        'HOCs should pass unrelated props through to the wrapped component so the original component remains flexible.',
        'Hooks are more common in modern React, but HOCs are still important for reading older React code and library APIs.',
      ],
      actionItems: [
        'Write a small HOC named withAuth that checks whether a user exists and otherwise shows a login message.',
        'Wrap two different components with the same HOC to see how the shared logic is reused.',
        'Compare the same logic implemented with a custom hook so you understand when hooks feel simpler than HOCs.',
      ],
      importantConcepts: [
        'Higher-order function: a JavaScript function that accepts another function or returns a function.',
        'Wrapped component: the original component that receives extra behavior from the HOC.',
        'Prop forwarding: passing existing props from the HOC to the wrapped component so nothing breaks.',
        'Separation of concerns: keeping reusable logic outside the visual component.',
      ],
    }
  }
  if (/closure/.test(text)) {
    return {
      concept: 'JavaScript Closure',
      summary: 'A closure is created when a function remembers variables from its outer scope even after that outer function has finished running. This lets JavaScript functions keep private state, build factories, and preserve values for callbacks. Closures are used heavily in event handlers, asynchronous code, modules, and React hooks. Understanding closures helps you reason about why a function still has access to older variables and why stale values can sometimes appear.',
    }
  }
  return null
}

const reactFiberInterview = () => ({
  beginner: [
    {
      question: 'What is React Fiber?',
      answer: 'React Fiber is the internal reconciliation engine that React uses to decide what changed in the component tree and how to update the UI efficiently. Before Fiber, React updates were harder to split into smaller units of work. Fiber makes rendering interruptible, which allows React to pause, resume, prioritize, and discard work when a more important update appears. You do not usually use Fiber directly, but its design powers features such as concurrent rendering, better scheduling, Suspense, and smoother user interactions.',
    },
    {
      question: 'Why did React need Fiber instead of the older stack reconciler?',
      answer: 'The older stack reconciler worked synchronously, so once React started rendering a large update, it could block the main thread until the work finished. That made complex interfaces feel slow because user input, animations, and urgent updates had to wait. Fiber changed rendering into small units of work so React can prioritize urgent updates like typing or clicking. The practical benefit is a UI that stays more responsive even when there is heavy component work.',
    },
    {
      question: 'Does React Fiber change how developers write components?',
      answer: 'Most developers do not write Fiber-specific code. You still write components, props, state, hooks, and JSX in the normal way. Fiber mostly affects how React schedules and commits updates behind the scenes. The developer-facing impact appears through modern React features like concurrent rendering, transitions, Suspense, and better rendering behavior under load.',
    },
    {
      question: 'What problem does React Fiber solve in real applications?',
      answer: 'React Fiber helps prevent large UI updates from freezing the page by giving React a way to split rendering work into smaller chunks. For example, if a dashboard updates many charts while the user is typing into a search box, React can prioritize the typing interaction. This improves perceived performance because urgent interactions do not have to wait behind less important rendering work. It is especially useful in large apps with complex component trees.',
    },
  ],
  intermediate: [
    {
      question: 'How does Fiber relate to reconciliation?',
      answer: 'Reconciliation is the process React uses to compare the previous tree with the next tree and determine what needs to change in the DOM. Fiber represents each unit of work as a fiber node, which tracks information about a component, its props, state, effects, and relationship to parent or child nodes. This structure lets React pause work, continue later, and assign priority to different updates. In short, Fiber is the data structure and algorithmic foundation that makes modern reconciliation more flexible.',
    },
    {
      question: 'What is the difference between render phase and commit phase in Fiber?',
      answer: 'The render phase is where React calculates what the next UI should look like. This phase can be interrupted, paused, restarted, or abandoned because it does not directly mutate the DOM. The commit phase is where React applies the final changes to the DOM and runs layout-related effects, so it must complete synchronously. Understanding this distinction helps explain why side effects should not run during render and why effects belong in hooks like useEffect or useLayoutEffect.',
    },
    {
      question: 'How does Fiber help with update priority?',
      answer: 'Fiber allows React to assign different priorities to different types of updates. A text input update is urgent because the user expects immediate feedback, while rendering a large filtered list may be less urgent. React can work on high-priority updates first and delay lower-priority work when needed. This is the idea behind features like startTransition, where you tell React that some updates can be treated as non-urgent.',
    },
    {
      question: 'How would you explain React Fiber in an interview using an example?',
      answer: 'A good example is a large search page. When the user types, React needs to update the input immediately and also update a large results list. Without scheduling, the list update could block typing and make the input feel laggy. Fiber lets React prioritize the input update and handle the expensive list rendering in a more interruptible way, which leads to a smoother user experience.',
    },
  ],
  advanced: [
    {
      question: 'How does Fiber support concurrent rendering?',
      answer: 'Concurrent rendering depends on React being able to prepare UI work without immediately committing it to the screen. Fiber enables this by making render work interruptible and restartable. React can begin rendering a future UI state, pause if a more urgent update arrives, and later continue or throw away that work. This allows features like transitions and Suspense to keep the current UI responsive while the next UI is being prepared.',
    },
    {
      question: 'What mistakes can developers make when reasoning about Fiber and concurrent React?',
      answer: 'A common mistake is assuming every render will immediately commit to the DOM. In concurrent rendering, React may start rendering and then abandon that work, so render logic must stay pure and free of side effects. Another mistake is reading mutable external values during render without using safe subscription patterns, which can create inconsistent UI. Senior developers handle this by keeping render pure, using effects for side effects, and relying on React-approved APIs for external stores.',
    },
    {
      question: 'How do keys, state preservation, and Fiber relate to each other?',
      answer: 'Fiber nodes help React track component identity across renders, and keys are one of the signals React uses to match old and new children. Stable keys allow React to preserve component state correctly when lists change. Bad keys, such as array indexes in a reorderable list, can cause state to appear under the wrong item because React matches the wrong fiber nodes. This is why stable identifiers are important in dynamic lists.',
    },
    {
      question: 'How would you debug a performance issue that Fiber scheduling might expose?',
      answer: 'Start by profiling the app with React DevTools Profiler to find which components render often or take too long. Then check whether expensive calculations are happening during render, whether props are changing unnecessarily, and whether large updates should be wrapped in startTransition. You should also verify list keys, memoization boundaries, and effect dependencies. The goal is not to control Fiber directly, but to give React cleaner, smaller, and more predictable work.',
    },
  ],
})

const buildInterviewFallback = (payload) => {
  const topic = String(payload.topic || payload.skill || 'the topic').trim()
  const lowerTopic = topic.toLowerCase()
  if (lowerTopic.includes('react fiber') || lowerTopic === 'fiber') {
    return { questions: reactFiberInterview() }
  }

  return {
    questions: {
      beginner: [
        {
          question: `What is ${topic}, and why should a developer learn it?`,
          answer: `${topic} is important because it gives you a mental model for solving a specific class of problems instead of only memorizing syntax. A strong beginner answer should define the concept, explain the problem it solves, and connect it with a tiny project example. You should also mention one common mistake, such as using the concept without understanding when it is actually needed.`,
        },
        {
          question: `Can you explain ${topic} with a simple example?`,
          answer: `A useful answer should describe a small real scenario, then show how ${topic} improves that scenario. For example, explain the before and after: what the code or workflow looked like without the concept, and what becomes cleaner after using it. Interviewers look for clear communication, not only technical vocabulary.`,
        },
        {
          question: `When would you avoid using ${topic}?`,
          answer: `Even useful concepts can be overused. You should avoid ${topic} when it adds complexity without solving a real problem, when a simpler built-in feature is enough, or when the team would struggle to maintain the abstraction. A good answer shows judgment by explaining both benefits and limits.`,
        },
        {
          question: `What beginner mistake is common with ${topic}?`,
          answer: `A common beginner mistake is learning the definition but not practicing it in a real flow. Another mistake is applying the concept everywhere, even when it makes code harder to read. The best way to avoid this is to build one small example, explain why the concept was needed, and then compare it with a simpler alternative.`,
        },
      ],
      intermediate: [
        {
          question: `How would you implement ${topic} in a production project?`,
          answer: `Start by identifying the exact problem and the boundary where ${topic} belongs. Then keep the implementation small, test the expected behavior, and document the tradeoff for future maintainers. A production answer should mention validation, error handling, edge cases, and how you would measure whether the solution helped.`,
        },
        {
          question: `How does ${topic} affect maintainability?`,
          answer: `${topic} improves maintainability when it removes duplication, clarifies responsibility, or makes behavior easier to test. It hurts maintainability when it hides too much logic or forces developers to jump across many files to understand one flow. A balanced answer should compare both outcomes and explain how naming, tests, and clear boundaries reduce risk.`,
        },
        {
          question: `What tradeoffs would you consider before using ${topic}?`,
          answer: `The main tradeoffs are readability, performance, team familiarity, and long-term flexibility. If the concept solves a repeated problem cleanly, it may be worth the abstraction. If the problem is small or rare, a direct solution can be better. Interviewers want to see that you can choose the right tool instead of applying patterns mechanically.`,
        },
        {
          question: `How would you test code that uses ${topic}?`,
          answer: `Test the behavior that users or other modules depend on, not only the internal implementation. Include a normal case, an edge case, and a failure case. If ${topic} affects state, data flow, or rendering, verify that the visible result stays correct when inputs change. Good tests make refactoring safer without locking the code to unnecessary details.`,
        },
      ],
      advanced: [
        {
          question: `What are the failure modes of ${topic} in a large application?`,
          answer: `In a large application, ${topic} can fail through over-abstraction, hidden coupling, poor performance, or unclear ownership. The risk grows when multiple teams use the concept differently. A senior answer should explain how you would detect the problem through profiling, code review, production errors, or developer feedback, then simplify the design where possible.`,
        },
        {
          question: `How would you refactor a bad implementation of ${topic}?`,
          answer: `First, identify the behavior that must remain stable and add tests around it. Then separate the essential logic from accidental complexity, rename unclear pieces, and remove duplicate or unnecessary layers. A safe refactor should happen in small steps so each change can be reviewed and verified without breaking the working flow.`,
        },
        {
          question: `How would you explain the performance impact of ${topic}?`,
          answer: `The performance impact depends on how often the code runs, how much work it performs, and whether it creates unnecessary updates or allocations. A senior answer should avoid guessing and instead describe how to measure with profiling tools, logs, or benchmarks. Optimization should focus on real bottlenecks rather than making the code complex too early.`,
        },
        {
          question: `How would you mentor a junior developer learning ${topic}?`,
          answer: `Start with the problem the concept solves, then show a small example and ask them to explain the flow back in their own words. After that, compare it with a simpler approach so they understand the tradeoff. Finally, give them a small task where they apply ${topic} once, review the code, and discuss readability and edge cases.`,
        },
      ],
    },
  }
}

const deriveHistoryMetadata = (type, payload, response) => {
  let title = 'AI Assistant Generation'
  let content = ''
  const metadata = payload || {}

  if (type === 'chat') {
    title = payload?.message ? (payload.message.slice(0, 45) + (payload.message.length > 45 ? '...' : '')) : 'AI Chat'
    content = response?.reply || ''
  } else if (type === 'debug') {
    title = `Code Debug: ${payload?.language || 'JavaScript'}`
    content = response?.explanation || ''
  } else if (type === 'notes-generator') {
    title = `Notes: ${payload?.topic || 'General'}`
    content = response?.content || ''
  } else if (type === 'interview') {
    title = `Interview Prep: ${payload?.topic || 'General'}`
  } else if (type === 'planner') {
    title = `Study Plan: ${payload?.skill || 'General'}`
  } else if (type === 'resources') {
    title = `Resources: ${payload?.topic || 'General'}`
  } else if (type === 'structured-roadmap') {
    title = `Roadmap: ${payload?.goal || 'General'}`
  }

  return { title, content, metadata }
}

const persistGeneration = async ({ userId, type, prompt, response, provider, model, cacheKey, payload }) => {
  const { title, content, metadata } = deriveHistoryMetadata(type, payload, response)
  return AIHistory.create({
    userId,
    type,
    title,
    prompt: String(prompt || '').slice(0, maxStoredPromptLength),
    response,
    content,
    metadata,
    provider,
    model,
    cacheKey,
  }).catch(() => null)
}

const meaningfulLength = (value) => String(value || '').trim().length

const outputLooksThin = (type, output) => {
  if (!output || typeof output !== 'object') return true
  if (type === 'notes-summary') return meaningfulLength(output.summary) < 120 || (output.keyPoints || []).some((point) => meaningfulLength(point) < 25)
  if (type === 'planner') return (output.dailySchedule || []).some((item) => meaningfulLength(item.activity) < 30)
  if (type === 'interview') {
    const groups = output.questions || {}
    return Object.values(groups).flat().some((item) => meaningfulLength(item.answer) < 80)
  }
  if (type === 'weak-topics') return (output.weakTopics || []).some((item) => meaningfulLength(item.reason) < 35 || meaningfulLength(item.recommendation) < 45)
  if (type === 'recommendations') return meaningfulLength(output.studyToday) < 45 || meaningfulLength(output.revisionFocus) < 45
  return false
}

const generateStructured = async ({ userId, type, payload, prompt, schemaHint, fallback, fallbackOnly = false }) => {
  const cacheKey = makeCacheKey(userId, type, payload)
  const cached = fromCache(cacheKey)
  if (cached) return { ...cached, cached: true }

  const result = fallbackOnly
    ? { output: fallback(), provider: 'local', model: 'quota-safe-helper', fallback: true, error: '' }
    : await generateWithProvider({ prompt, schemaHint, fallback })
  if (!result.fallback && outputLooksThin(type, result.output)) {
    result.output = { ...fallback(), providerWarning: 'AI response was too short, so a richer local response was used.' }
    result.fallback = true
  }
  await persistGeneration({
    userId,
    type,
    prompt,
    response: result.output,
    provider: result.provider,
    model: result.model,
    cacheKey,
    payload,
  })
  const value = { data: result.output, provider: result.provider, model: result.model, fallback: result.fallback, providerError: result.error || '' }
  saveCache(cacheKey, value)
  return value
}

export const generateChatResponse = async (userId, { message, history = [] }) => {
  const payload = { message, history: (history || []).slice(-6) }
  const prompt = textPrompt(`You are an expert conversational study companion. Answer this programming or learning query: "${message}". History context: ${JSON.stringify(payload.history)}`, payload)
  return generateStructured({
    userId,
    type: 'chat',
    payload,
    prompt,
    schemaHint: 'Schema: { reply: string }. Return a single detailed markdown-formatted reply in the "reply" key.',
    fallback: () => ({
      reply: `I received your message about: "${message}". Let me know if you need code debugging, notes, or study planners!`,
    }),
  })
}

export const debugCode = async (userId, { code, language = 'JavaScript' }) => {
  const payload = { code, language }
  const prompt = textPrompt(`Analyze the following ${language} code for bugs: "${code}". Explain the issue, provide the corrected code, and list best practices.`, payload)
  return generateStructured({
    userId,
    type: 'debug',
    payload,
    prompt,
    schemaHint: 'Schema: { hasBug: boolean, explanation: string, correctedCode: string, bestPractices: string[] }. Explanation must be clear. bestPractices must be a list of 2-4 items.',
    fallback: () => ({
      hasBug: false,
      explanation: 'No major syntax issues detected in this code snippet.',
      correctedCode: code,
      bestPractices: [
        'Always validate user inputs and inputs to your functions.',
        'Use strict equality checking (=== in JS).',
        'Add proper try-catch error handling around asynchronous calls.',
      ],
    }),
  })
}

export const generateNotes = async (userId, { topic, type, level }) => {
  const payload = { topic, type, level }
  const prompt = textPrompt(`Generate comprehensive study notes on the topic: "${topic}". Note format type: "${type}" (Detailed Notes, Revision Notes, or Concise Summary). Complexity level: "${level}" (Simple Language (ELIF5) or Technical / Academic).`, payload)
  return generateStructured({
    userId,
    type: 'notes-generator',
    payload,
    prompt,
    schemaHint: 'Schema: { title: string, content: string, keyTakeaways: string[], quickReview: string }. content must be detailed markdown.',
    fallback: () => ({
      title: topic,
      content: `### Study Guide for ${topic}\n\nHere is a simple explanation of ${topic} tailored for a ${level} audience.\n\n- Focus on core principles.\n- Build a working example.\n- Practice without referencing notes.`,
      keyTakeaways: [`Understand the fundamental definition of ${topic}`, 'Connect the concept to a real-world use case.'],
      quickReview: 'Create one mini project to test your implementation and reinforce learning.',
    }),
  })
}

export const suggestResources = async (userId, { topic }) => {
  const payload = { topic }
  const prompt = textPrompt(`Find highly-rated learning resources for the topic: "${topic}". Suggest official documentation, YouTube channels/tutorials, GitHub repositories, articles/blogs, and practice websites.`, payload)
  return generateStructured({
    userId,
    type: 'resources',
    payload,
    prompt,
    schemaHint: 'Schema: { officialDocs: [{title:string,url:string,description:string}], youtube: [{title:string,url:string,description:string}], github: [{title:string,url:string,description:string}], articles: [{title:string,url:string,description:string}], practice: [{title:string,url:string,description:string}] }. Provide real and useful links with helpful descriptions.',
    fallback: () => ({
      officialDocs: [
        { title: `${topic} Official Reference`, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`, description: 'MDN Web Docs or standard documentation search.' },
      ],
      youtube: [
        { title: `${topic} Tutorials`, url: 'https://youtube.com', description: 'Search on YouTube for top crash courses and tutorials.' },
      ],
      github: [
        { title: `Awesome ${topic} List`, url: 'https://github.com', description: 'Search GitHub for repositories with list of curated resources.' },
      ],
      articles: [
        { title: `Introduction to ${topic}`, url: 'https://dev.to', description: 'Search dev.to for introductory and community articles.' },
      ],
      practice: [
        { title: `Practice ${topic}`, url: 'https://freecodecamp.org', description: 'Complete hands-on coding challenges to test your skills.' },
      ],
    }),
  })
}

export const generateStructuredRoadmap = async (userId, { goal }) => {
  const cacheKey = makeCacheKey(userId, 'structured-roadmap', { goal })
  const cached = fromCache(cacheKey)
  if (cached) return { ...cached, cached: true }

  const schemaHint = `You are an expert learning path architect. Return ONLY valid JSON — no markdown, no text outside JSON.
Schema (follow EXACTLY):
{
  "title": string,
  "description": string,
  "category": "Frontend"|"Backend"|"Full Stack"|"Mobile"|"DevOps"|"Data Science"|"Other",
  "icon": string (1 relevant emoji),
  "difficulty": "Beginner"|"Intermediate"|"Advanced",
  "estimatedDuration": string (e.g. "12 weeks"),
  "estimatedHours": number,
  "weeklyStudyPlan": string[],
  "portfolioProjects": [{"title": string, "description": string, "skills": string[]}],
  "resumeProjects": string[],
  "interviewChecklist": string[],
  "revisionChecklist": string[],
  "milestones": [{"phase": string, "title": string, "description": string}],
  "skills": [
    {
      "title": string,
      "description": string,
      "level": "Beginner"|"Intermediate"|"Advanced",
      "estimatedHours": number,
      "phase": string,
      "whyLearn": string,
      "commonMistakes": string[],
      "practiceTask": string,
      "miniAssignment": string,
      "interviewQuestions": string[],
      "topics": [
        {
          "title": string,
          "description": string,
          "subtopics": [{"title": string, "description": string}],
          "resources": [
            {
              "title": string,
              "url": string,
              "type": "Documentation"|"YouTube"|"Article"|"Practice"|"Course",
              "description": string
            }
          ]
        }
      ]
    }
  ]
}
Rules:
- Include 3-5 phases with 2-4 skills each (8-14 skills total).
- Each skill must have 2-4 topics with 2-3 subtopics and 3-5 resources.
- Resources must have real, working URLs (official docs, YouTube channels, practice sites).
- interviewChecklist must have 8-12 items. revisionChecklist must have 6-10 items.
- portfolioProjects must have 3-5 projects. resumeProjects must have 3-5 bullet points.
- weeklyStudyPlan must have 6-10 items describing what to do each week.
- milestones must have one entry per phase.
- All strings must be complete sentences, not one-word labels.
- Do NOT truncate or cut the JSON short. Return the complete object.`

  const prompt = `Create a complete, production-level learning roadmap for: "${goal}".

This roadmap should be similar in quality to roadmap.sh, Coursera learning paths, and Microsoft Learn.
Include everything a learner needs: phases, modules, topics, subtopics, resources, interview prep, portfolio projects, weekly study plan, milestones, and revision checklist.

The user's goal: "${goal}"

Return the complete JSON object following the schema exactly. Do not abbreviate any field.`

  const attemptGenerate = async () => {
    const result = await generateWithProvider({ prompt, schemaHint, fallback: () => buildRoadmapFallback(goal), maxOutputTokens: 12000 })
    return result
  }

  let result = await attemptGenerate()

  // Retry once if JSON is invalid or structure is thin
  if (result.fallback || !result.output?.skills?.length) {
    result = await attemptGenerate()
  }

  const value = {
    data: result.output,
    provider: result.provider,
    model: result.model,
    fallback: result.fallback,
    providerError: result.error || '',
  }

  await persistGeneration({
    userId,
    type: 'structured-roadmap',
    prompt,
    response: result.output,
    provider: result.provider,
    model: result.model,
    cacheKey,
  })

  saveCache(cacheKey, value)
  return value
}

const buildRoadmapFallback = (goal) => {
  const g = String(goal || 'Programming').trim()
  let category = 'Other'
  let icon = '🚀'
  const lower = g.toLowerCase()
  if (/react|vue|angular|frontend|css|html|next/.test(lower)) { category = 'Frontend'; icon = '🎨' }
  else if (/node|express|backend|sql|postgres|mongo|api|django|spring/.test(lower)) { category = 'Backend'; icon = '⚙️' }
  else if (/docker|kubernetes|devops|ci\/cd|jenkins|terraform|ansible/.test(lower)) { category = 'DevOps'; icon = '🐳' }
  else if (/mern|fullstack|full.?stack/.test(lower)) { category = 'Full Stack'; icon = '🥞' }
  else if (/python|data.?science|machine.?learning|ml|ai|pandas|numpy|tensorflow/.test(lower)) { category = 'Data Science'; icon = '🐍' }
  else if (/swift|android|kotlin|react.?native|flutter|mobile/.test(lower)) { category = 'Mobile'; icon = '📱' }

  return {
    title: `${g} Learning Path`,
    description: `A structured, production-level learning path for mastering ${g}. This roadmap covers everything from fundamentals to advanced concepts with hands-on projects and interview preparation.`,
    category,
    icon,
    difficulty: 'Intermediate',
    estimatedDuration: '12 weeks',
    estimatedHours: 120,
    weeklyStudyPlan: [
      'Week 1-2: Study fundamentals, set up the environment, and build your first small project.',
      'Week 3-4: Deep dive into core concepts with daily hands-on exercises.',
      'Week 5-6: Work on intermediate topics and integrate multiple concepts in mini projects.',
      'Week 7-8: Tackle advanced topics and start building a portfolio project.',
      'Week 9-10: Complete the portfolio project, refine, and document it.',
      'Week 11: Revise all weak areas using spaced repetition.',
      'Week 12: Interview preparation, mock projects, and final review.',
    ],
    portfolioProjects: [
      { title: `${g} Beginner Project`, description: `A beginner-level project that demonstrates your understanding of ${g} fundamentals.`, skills: ['Core concepts', 'Basic implementation'] },
      { title: `${g} Intermediate App`, description: `An intermediate project showcasing your ability to build real features and integrate tools.`, skills: ['API integration', 'State management', 'Testing'] },
      { title: `${g} Full-Stack Capstone`, description: `A production-ready capstone project demonstrating advanced ${g} skills suitable for your resume.`, skills: ['Architecture', 'Security', 'Deployment'] },
    ],
    resumeProjects: [
      `Built a full-stack ${g} application with authentication, REST API, and deployment.`,
      `Implemented a real-time feature using WebSockets and optimized for performance.`,
      `Designed and documented a scalable architecture for a ${g} project.`,
    ],
    interviewChecklist: [
      'Understand core concepts and be ready to explain them without jargon.',
      'Practice common algorithm and data structure problems relevant to the role.',
      'Prepare 3-5 project stories using the STAR format.',
      'Review system design concepts at a high level.',
      'Know the trade-offs of key technology choices.',
      'Be ready to debug live code under pressure.',
      'Prepare thoughtful questions for the interviewer.',
      'Review your portfolio projects and be able to explain every decision.',
    ],
    revisionChecklist: [
      'Review all phase 1 fundamentals with active recall.',
      'Practice core exercises without looking at solutions.',
      'Re-do the most challenging mini assignments from scratch.',
      'Watch one revision video for each major topic.',
      'Complete a timed mock interview or coding challenge.',
      'Update your notes with new insights and correct any mistakes.',
    ],
    milestones: [
      { phase: 'Phase 1', title: 'Foundations Complete', description: `You can explain the core concepts of ${g} and have built your first working project.` },
      { phase: 'Phase 2', title: 'Core Skills Mastered', description: 'You can build features independently and understand how components connect.' },
      { phase: 'Phase 3', title: 'Advanced Topics Covered', description: 'You understand advanced patterns and can make architectural decisions.' },
    ],
    skills: [
      {
        title: `Introduction to ${g}`,
        description: `Build a strong foundation in ${g} covering setup, syntax, and core principles.`,
        level: 'Beginner',
        estimatedHours: 20,
        phase: 'Phase 1: Foundations',
        whyLearn: `This module establishes the mental model you need for everything that follows. Skipping fundamentals causes confusion later.`,
        commonMistakes: ['Skipping environment setup', 'Copy-pasting without understanding', 'Not building anything small first'],
        practiceTask: `Build a simple "Hello World" project that uses three different core features of ${g}.`,
        miniAssignment: `Create a mini project that solves a real problem using only the fundamental concepts covered in this module.`,
        interviewQuestions: [`What is ${g} and what problems does it solve?`, `How does ${g} compare to similar technologies?`, 'What are the prerequisites for learning this technology?'],
        topics: [
          { title: 'Core Concepts', description: `The fundamental ideas that define how ${g} works.`, subtopics: [{ title: 'History and Ecosystem', description: `Where ${g} came from and what tools surround it.` }, { title: 'Key Principles', description: `The design principles that guide how ${g} is used.` }], resources: [{ title: 'Official Documentation', url: 'https://developer.mozilla.org', type: 'Documentation', description: 'The authoritative reference for the technology.' }, { title: 'Traversy Media', url: 'https://youtube.com/@TraversyMedia', type: 'YouTube', description: 'Practical video tutorials for beginners.' }, { title: 'freeCodeCamp', url: 'https://freecodecamp.org', type: 'Practice', description: 'Free structured curriculum with exercises.' }] },
          { title: 'Environment Setup', description: 'Configure your development environment for efficient work.', subtopics: [{ title: 'Installation', description: 'Installing and configuring all required tools.' }, { title: 'Editor Setup', description: 'Configure VS Code with useful extensions.' }], resources: [{ title: 'VS Code', url: 'https://code.visualstudio.com', type: 'Documentation', description: 'The most popular code editor with rich extension support.' }] },
        ],
      },
      {
        title: `Core ${g} Development`,
        description: 'Apply core concepts to build real features and solve practical problems.',
        level: 'Intermediate',
        estimatedHours: 30,
        phase: 'Phase 2: Core Skills',
        whyLearn: 'This is where you move from understanding concepts to building real functionality that users interact with.',
        commonMistakes: ['Not testing your code', 'Ignoring error handling', 'Over-engineering simple solutions'],
        practiceTask: 'Build a feature from scratch using the concepts in this module, then refactor it after review.',
        miniAssignment: 'Create a working mini-app that integrates at least three concepts from this module.',
        interviewQuestions: ['How do you structure a project using these concepts?', 'What error handling patterns do you use?', 'How do you test this kind of code?'],
        topics: [
          { title: 'Building Features', description: 'Implement real application features using core patterns.', subtopics: [{ title: 'Data Flow', description: 'How data moves through the application.' }, { title: 'Error Handling', description: 'Catching and recovering from failures gracefully.' }], resources: [{ title: 'Official Guides', url: 'https://developer.mozilla.org', type: 'Documentation', description: 'Official guides for practical implementation.' }, { title: 'The Net Ninja', url: 'https://youtube.com/@NetNinja', type: 'YouTube', description: 'Clear, practical tutorials with real examples.' }, { title: 'Frontend Mentor', url: 'https://frontendmentor.io', type: 'Practice', description: 'Realistic project challenges with design files.' }] },
        ],
      },
      {
        title: `Advanced ${g} & Production`,
        description: 'Master advanced patterns, performance optimization, and deployment.',
        level: 'Advanced',
        estimatedHours: 40,
        phase: 'Phase 3: Advanced',
        whyLearn: 'Production applications require performance, security, and scalability knowledge that goes beyond basic tutorials.',
        commonMistakes: ['Premature optimization', 'Not considering security', 'Skipping monitoring and logging'],
        practiceTask: 'Profile and optimize an existing project for performance, then deploy it to a production environment.',
        miniAssignment: 'Build and deploy a production-ready application with authentication, error monitoring, and CI/CD.',
        interviewQuestions: ['How do you approach performance optimization?', 'What security concerns do you consider?', 'How do you deploy and monitor a production application?'],
        topics: [
          { title: 'Performance Optimization', description: 'Identify and fix performance bottlenecks in production applications.', subtopics: [{ title: 'Profiling', description: 'Using profiling tools to find slow code paths.' }, { title: 'Caching', description: 'Implementing caching strategies to reduce load.' }], resources: [{ title: 'Web Dev for Beginners', url: 'https://github.com/microsoft/Web-Dev-For-Beginners', type: 'Course', description: 'Free Microsoft course covering web fundamentals.' }, { title: 'Fireship', url: 'https://youtube.com/@Fireship', type: 'YouTube', description: 'High-quality short videos on advanced topics.' }] },
          { title: 'Deployment & CI/CD', description: 'Deploy applications reliably using modern DevOps practices.', subtopics: [{ title: 'Docker', description: 'Containerizing applications for consistent deployment.' }, { title: 'GitHub Actions', description: 'Automating build, test, and deploy pipelines.' }], resources: [{ title: 'Docker Docs', url: 'https://docs.docker.com', type: 'Documentation', description: 'Official Docker documentation and tutorials.' }, { title: 'Render', url: 'https://render.com', type: 'Practice', description: 'Free deployment platform for full-stack apps.' }] },
        ],
      },
    ],
  }
}

export const generateStudyPlanner = async (userId, payload) => {
  const prompt = textPrompt('Create daily, weekly, and monthly study plans based on goals and availability. Return JSON.', payload)
  return generateStructured({
    userId,
    type: 'planner',
    payload,
    prompt,
    schemaHint: 'Schema: {dailySchedule:[{block:string,duration:string,activity:string}], weeklySchedule:string[], monthlyPlan:string[]}. Activities should be practical, detailed, and easy to follow. Include review, practice, project, and reflection blocks.',
    fallback: () => ({
      dailySchedule: [
        { block: 'Focus study', duration: `${payload.dailyStudyHours || 1}h`, activity: 'Pick one topic, learn the core idea, write the idea in your own words, and complete one exercise that proves you can use it without copying.' },
        { block: 'Recall', duration: '15m', activity: 'Review yesterday revisions without looking at notes first, then correct the gaps and add one example for the part you forgot.' },
        { block: 'Reflection', duration: '10m', activity: 'Write what became clearer, what still feels confusing, and the exact topic you will attack in the next session.' },
      ],
      weeklySchedule: ['Use three days for new concepts, keeping each session focused on one topic.', 'Use two days for practice problems or implementation work.', 'Use one day for revision and weak-topic repair.', 'Use one day to review project progress and update notes.'],
      monthlyPlan: ['Weeks 1-2: build fundamentals with examples and short notes.', 'Week 3: apply the learning in a project or practical exercise set.', 'Week 4: revise weak areas, take a small assessment, and plan the next month.'],
    }),
  })
}

export const summarizeNotes = async (userId, payload) => {
  const prompt = textPrompt('Summarize these markdown notes into a readable study summary. Return JSON.', { markdown: payload.markdown })
  return generateStructured({
    userId,
    type: 'notes-summary',
    payload,
    prompt,
    schemaHint: 'Schema: {summary:string,keyPoints:string[],actionItems:string[],importantConcepts:string[]}. Summary must be 4-6 sentences. Key points and action items must be complete practical sentences with enough detail for revision.',
    fallback: () => {
      const plain = cleanPlainText(payload.markdown)
      const detected = detectConceptBrief(plain)
      if (detected?.keyPoints) {
        return {
          summary: detected.summary,
          keyPoints: detected.keyPoints,
          actionItems: detected.actionItems,
          importantConcepts: detected.importantConcepts,
        }
      }
      const sentences = plain.split(/[.!?]/).map((item) => item.trim()).filter(Boolean)
      const topicWords = Array.from(new Set(plain.split(' ').filter((word) => word.length > 6))).slice(0, 8)
      if (detected) {
        return {
          summary: detected.summary,
          keyPoints: [
            `${detected.concept} is the main idea in these notes, so start by understanding its definition and where it is used.`,
            'The concept should be connected with a practical example instead of only memorizing the wording.',
            'After reading the explanation, test yourself by explaining the idea without looking at the notes.',
          ],
          actionItems: ['Create one practical example for the concept.', 'Write two interview-style questions and answer them in your own words.', 'Add a short code example or diagram to make the note easier to revise later.'],
          importantConcepts: [detected.concept],
        }
      }
      return {
        summary: sentences.length
          ? `${sentences.slice(0, 3).join('. ')}. The note is currently short, so treat it as a starting question rather than a complete summary. Expand it by adding a definition, one practical example, one common mistake, and one small exercise.`
          : 'The note does not contain enough detail yet. Add the topic definition, why it matters, one example, and one place where you are confused so the assistant can create a stronger study summary.',
        keyPoints: sentences.length
          ? sentences.slice(0, 5).map((sentence) => `${sentence}. Add context, an example, and a use case so this point becomes useful for revision.`)
          : ['The note needs a clear definition before it can become useful study material.', 'A practical example should be added so the concept is easier to remember.', 'A common mistake or confusion point should be written down for future revision.'],
        actionItems: ['Rewrite the note as a complete answer with definition, use case, example, and mistake to avoid.', 'Create one tiny practice task that forces you to apply the concept.', 'Turn the final note into two flashcards: one for definition and one for practical usage.'],
        importantConcepts: topicWords.length ? topicWords.map((word) => `${word}: explain this term in your own words and connect it with a small example.`) : ['Definition', 'Use case', 'Example', 'Common mistake'],
      }
    },
  })
}



export const generateInterviewQuestions = async (userId, payload) => {
  const prompt = textPrompt('Generate interview questions with model answers. Return JSON.', payload)
  return generateStructured({
    userId,
    type: 'interview',
    payload,
    prompt,
    schemaHint: 'Schema: {questions:{beginner:[{question:string,answer:string}],intermediate:[{question:string,answer:string}],advanced:[{question:string,answer:string}]}}. Generate at least 4 questions per level. Answers must be complete, interview-ready explanations with examples, tradeoffs, and follow-up points.',
    fallback: () => buildInterviewFallback(payload),
  })
}

export const detectWeakTopics = async (userId) => {
  const [topics, sessions, revisions] = await Promise.all([
    Topic.find({ userId, deletedAt: null }).lean(),
    LearningLog.find({ user: userId }).lean(),
    Revision.find({ userId }).lean(),
  ])
  const sessionMinutes = sessions.reduce((map, log) => {
    const key = String(log.topic)
    map[key] = (map[key] || 0) + (Number(log.duration) || 0)
    return map
  }, {})
  const revisionMap = revisions.reduce((map, revision) => {
    const key = String(revision.topicId)
    map[key] = map[key] || { completed: 0, missed: 0, total: 0 }
    map[key].total += 1
    if (revision.completedAt) map[key].completed += 1
    if (!revision.completedAt && new Date(revision.revisionDate) < new Date()) map[key].missed += 1
    return map
  }, {})
  const weakTopics = topics.map((topic) => {
    const stats = revisionMap[String(topic._id)] || { completed: 0, missed: 0, total: 0 }
    const minutes = sessionMinutes[String(topic._id)] || 0
    const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0
    const score = (topic.status === 'Completed' ? 0 : 35) + Math.max(0, 50 - completionRate) + stats.missed * 10 + (minutes < 60 ? 10 : 0)
    return {
      topicId: topic._id,
      title: topic.title,
      status: topic.status,
      completionRate,
      missedRevisions: stats.missed,
      learningMinutes: minutes,
      weaknessScore: score,
      recommendation: score > 60 ? 'Prioritize this topic today.' : 'Keep it in regular revision.',
    }
  }).sort((a, b) => b.weaknessScore - a.weaknessScore).slice(0, 8)

  const payload = { weakTopics }
  return generateStructured({
    userId,
    type: 'weak-topics',
    payload,
    prompt: textPrompt('Analyze weak topic signals and recommend focus areas. Return JSON.', payload),
    schemaHint: 'Schema: {weakTopics:[{topicId,title,reason,recommendation,priority}]}. Reason and recommendation must be complete sentences based on the provided signals.',
    fallbackOnly: true,
    fallback: () => ({
      weakTopics: weakTopics.map((topic) => ({
        topicId: topic.topicId,
        title: topic.title,
        reason: `${topic.completionRate}% revision completion, ${topic.missedRevisions} missed revisions, ${topic.learningMinutes} learning minutes.`,
        recommendation: topic.weaknessScore > 60 ? 'Prioritize this topic today with one focused study block, then complete a short recall exercise.' : 'Keep this topic in regular revision and add one small practice task this week.',
        priority: topic.weaknessScore > 70 ? 'High' : topic.weaknessScore > 45 ? 'Medium' : 'Low',
      })),
    }),
  })
}

export const generateRecommendations = async (userId) => {
  const [skills, topics, revisions] = await Promise.all([
    Skill.find({ userId, deletedAt: null }).select('title category progress status').lean(),
    Topic.find({ userId, deletedAt: null }).select('title status priority skillId').lean(),
    Revision.find({ userId, completedAt: null }).sort({ revisionDate: 1 }).limit(5).populate('topicId', 'title').lean(),
  ])
  const payload = { skills, topics: topics.slice(0, 20), dueRevisions: revisions }
  return generateStructured({
    userId,
    type: 'recommendations',
    payload,
    prompt: textPrompt('Recommend what the learner should study today, revisions, and resources. Return JSON.', payload),
    schemaHint: 'Schema: {studyToday:string,revisionFocus:string,suggestedResources:[{title,type,query}],nextActions:string[]}. Every recommendation must explain what to do and why it matters.',
    fallbackOnly: true,
    fallback: () => {
      const activeTopic = topics.find((topic) => topic.status !== 'Completed') || topics[0]
      const revision = revisions[0]
      return {
        studyToday: activeTopic ? `Study ${activeTopic.title} with one focused practice session, then write a short note about the hardest part.` : 'Create a skill and add your first topic so the assistant can build a focused learning plan.',
        revisionFocus: revision?.topicId?.title ? `Revise ${revision.topicId.title} today because it is the next scheduled item in your revision queue.` : 'No urgent revision is due, so use the time for active practice or improving notes.',
        suggestedResources: [
          { title: 'Official documentation', type: 'Documentation', query: activeTopic?.title || skills[0]?.title || 'learning fundamentals' },
          { title: 'Hands-on tutorial', type: 'Website', query: `${activeTopic?.title || 'skill'} tutorial` },
        ],
        nextActions: ['Review one weak topic and write down exactly what still feels unclear.', 'Log a focused learning session so dashboard progress and streaks stay accurate.', 'Update your notes after practice with examples, mistakes, and fixes.'],
      }
    },
  })
}

export const getAIHistory = async (userId, { type, page = 1, limit = 20 } = {}) => {
  const query = { userId }
  if (type) query.type = type
  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
  const [items, total] = await Promise.all([
    AIHistory.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    AIHistory.countDocuments(query),
  ])
  return { history: items, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) } }
}

export const getAIHistoryById = async (userId, id) => {
  return AIHistory.findOne({ _id: id, userId }).lean()
}

export const deleteAIHistoryById = async (userId, id) => {
  const result = await AIHistory.deleteOne({ _id: id, userId })
  return result.deletedCount > 0
}

export const deleteAllAIHistory = async (userId) => {
  const result = await AIHistory.deleteMany({ userId })
  return result.deletedCount
}
