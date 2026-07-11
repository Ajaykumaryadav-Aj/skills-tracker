import { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BookOpenCheck,
  BookOpenText,
  Clock3,
  ChevronDown,
  Home as HomeIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  Menu,
  RotateCcw,
  UserRound,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import AppErrorBoundary from './components/AppErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { AuthContext } from './context/authContextValue'
import ProtectedRoute from './routes/ProtectedRoute'
import { cn, ui } from './utils/tw'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const LearningLogs = lazy(() => import('./pages/LearningLogs'))
const Notes = lazy(() => import('./pages/Notes'))
const Revisions = lazy(() => import('./pages/Revisions'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'))
const Profile = lazy(() => import('./pages/Profile'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Notifications = lazy(() => import('./pages/Notifications'))
const RoadmapDetail = lazy(() => import('./pages/RoadmapDetail'))
const RoadmapForm = lazy(() => import('./pages/RoadmapForm'))
const Roadmaps = lazy(() => import('./pages/Roadmaps'))
const SkillDetails = lazy(() => import('./pages/SkillDetails'))
const SkillForm = lazy(() => import('./pages/SkillForm'))
const Skills = lazy(() => import('./pages/Skills'))
const Teams = lazy(() => import('./pages/Teams'))
const UserRoadmapDetail = lazy(() => import('./pages/UserRoadmapDetail'))

const routeMeta = [
  { match: (path) => path === '/', title: 'Skills Tracker', description: 'Track skills, topics, learning notes, resources, and progress.' },
  { match: (path) => path.startsWith('/dashboard'), title: 'Dashboard | Skills Tracker', description: 'Review your learning progress and activity.' },
  { match: (path) => path.startsWith('/skills'), title: 'Skills | Skills Tracker', description: 'Manage skills, topics, notes, and resources.' },
  { match: (path) => path.startsWith('/roadmaps'), title: 'Roadmaps | Skills Tracker', description: 'Plan and monitor structured learning roadmaps.' },
  { match: (path) => path.startsWith('/logs'), title: 'Learning Logs | Skills Tracker', description: 'Record and review learning sessions.' },
  { match: (path) => path.startsWith('/notes'), title: 'Notes | Skills Tracker', description: 'Manage topic notes, resources, and attachments.' },
  { match: (path) => path.startsWith('/revisions'), title: 'Revisions | Skills Tracker', description: 'Review topics using spaced repetition.' },
  { match: (path) => path.startsWith('/ai'), title: 'AI Assistant | Skills Tracker', description: 'Generate learning plans, quizzes, summaries, and recommendations.' },
  { match: (path) => path.startsWith('/profile'), title: 'Profile | Skills Tracker', description: 'Manage your Skills Tracker profile and account.' },
  { match: (path) => path.startsWith('/teams'), title: 'Teams | Skills Tracker', description: 'Collaborate with learning teams.' },
  { match: (path) => path.startsWith('/activity'), title: 'Activity | Skills Tracker', description: 'Review learning activity.' },
  { match: (path) => path.startsWith('/notifications'), title: 'Notifications | Skills Tracker', description: 'Manage notifications and reminders.' },
  { match: (path) => path.startsWith('/public'), title: 'Public Profile | Skills Tracker', description: 'View a public learning profile.' },
  { match: (path) => path.startsWith('/login'), title: 'Sign In | Skills Tracker', description: 'Sign in to your Skills Tracker account.' },
  { match: (path) => path.startsWith('/register'), title: 'Create Account | Skills Tracker', description: 'Create a Skills Tracker account.' },
  { match: (path) => path.startsWith('/verify-otp'), title: 'Verify Email | Skills Tracker', description: 'Verify your Skills Tracker account email.' },
]

const primaryLinks = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/skills', label: 'Skills', icon: BookOpenCheck },
  { to: '/roadmaps', label: 'Roadmaps', icon: Map },
  { to: '/logs', label: 'Learning logs', icon: Clock3 },
  { to: '/revisions', label: 'Revisions', icon: RotateCcw },
  { to: '/notes', label: 'Notes', icon: BookOpenText },
  { to: '/ai', label: 'AI', icon: Bot },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/notifications', label: 'Alerts', icon: Bell },
]

function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = routeMeta.find((item) => item.match(pathname)) || routeMeta[0]
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
  }, [pathname])

  return null
}

function Home() {
  const { user } = useContext(AuthContext)

  if (!user) {
    return (
      <section className="reveal-item mx-auto grid max-w-3xl gap-5 rounded-panel border border-line bg-white p-8 text-center shadow-card" aria-labelledby="home-title">
        <div className="mx-auto flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-card bg-emerald-brand text-white" aria-hidden="true"><BarChart3 size={27} /></span>
          <p className="text-sm font-black uppercase text-emerald-dark-brand">Skills Tracker</p>
        </div>
        <h1 id="home-title" className="text-3xl font-black text-ink sm:text-4xl">Your learning workspace</h1>
        <p className="text-sm leading-6 text-ink-soft">Sign in to continue, or create a new account.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/login" className={cn(ui.button.base, ui.button.primary)}><LogIn size={17} /> Sign in</Link>
          <Link to="/register" className={cn(ui.button.base, ui.button.secondary)}><UserPlus size={17} /> Create account</Link>
        </div>
      </section>
    )
  }

  const shortcuts = [
    { to: '/dashboard', title: 'Progress overview', detail: 'Open your latest learning metrics', icon: LayoutDashboard, tone: 'emerald' },
    { to: '/skills', title: 'Manage skills', detail: 'Continue topics, notes and resources', icon: BookOpenCheck, tone: 'coral' },
    { to: '/roadmaps', title: 'Learning roadmaps', detail: 'Review structured learning paths', icon: Map, tone: 'sun' },
    { to: '/logs', title: 'Learning history', detail: 'Record or review focused sessions', icon: Clock3, tone: 'blue' },
    { to: '/revisions', title: 'Smart revisions', detail: 'Review due topics with spaced repetition', icon: RotateCcw, tone: 'coral' },
    { to: '/notes', title: 'Knowledge hub', detail: 'Manage notes and resources', icon: BookOpenText, tone: 'emerald' },
    { to: '/ai', title: 'AI assistant', detail: 'Generate plans, quizzes and recommendations', icon: Bot, tone: 'blue' },
  ]

  return (
    <section className="grid gap-6" aria-labelledby="home-title">
      <header className="reveal-item">
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase text-emerald-dark-brand"><BarChart3 size={15} /> Personal workspace</p>
        <h1 id="home-title" className="text-3xl font-black text-ink sm:text-4xl">Welcome back, {user.name?.split(' ')[0] || 'Learner'}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">Choose where you want to continue.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map(({ to, title, detail, icon: Icon, tone }, index) => (
          <Link key={to} to={to} className={cn(ui.card, 'reveal-item grid grid-cols-[auto_1fr_auto] items-center gap-4 p-5')} style={{ '--reveal-delay': `${index * 70}ms` }}>
            <span className={cn('grid size-11 place-items-center rounded-card', tone === 'coral' ? 'bg-coral-pale text-coral-dark' : tone === 'sun' ? 'bg-sun-pale text-yellow-800' : tone === 'blue' ? 'bg-blue-pale text-blue-brand' : 'bg-emerald-pale text-emerald-dark-brand')}><Icon size={21} /></span>
            <div><h2 className="font-black text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-ink-soft">{detail}</p></div>
            <ArrowRight size={18} className="text-ink-muted" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function Navigation() {
  const { user, logout } = useContext(AuthContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const navClass = ({ isActive }) => cn(
    'inline-flex min-h-10 w-full shrink-0 items-center gap-2 rounded-card px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white xl:min-h-9 xl:w-auto xl:gap-1 xl:px-2.5 xl:text-xs',
    isActive && 'bg-emerald-brand/25 text-mint',
  )

  return (
    <>
      <a href="#main-content" className="fixed left-3 top-3 z-[300] -translate-y-24 rounded-card bg-white px-4 py-2 text-sm font-bold text-emerald-dark-brand shadow-card transition focus:translate-y-0">Skip to main content</a>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-br from-forest-deep via-forest to-forest-mid text-white shadow-lg backdrop-blur">
        <nav aria-label="Primary navigation" className="mx-auto flex min-h-[68px] w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 text-white" aria-label="Skills Tracker home">
            <span className="grid size-10 place-items-center rounded-card border border-white/20 bg-emerald-brand shadow-lg" aria-hidden="true"><BarChart3 size={21} /></span>
            <span><strong className="block text-sm font-black">Skills Tracker</strong><small className="block text-xs text-mint">Learning workspace</small></span>
          </Link>

          <button
            type="button"
            className="ml-auto inline-flex size-10 items-center justify-center rounded-card border border-white/15 bg-white/10 text-white xl:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            title={menuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <div
            id="primary-menu"
            className={cn(
              'absolute left-4 right-4 top-[76px] max-h-[calc(100vh-92px)] overflow-auto rounded-panel border border-white/10 bg-forest p-4 shadow-card xl:static xl:ml-auto xl:flex xl:max-h-none xl:flex-1 xl:items-center xl:justify-between xl:overflow-visible xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none',
              menuOpen ? 'block' : 'hidden',
            )}
            onClick={(event) => {
              if (event.target.closest('a')) setMenuOpen(false)
            }}
          >
            <div className="grid min-w-0 gap-1 sm:grid-cols-2 xl:flex xl:flex-nowrap xl:items-center">
              {primaryLinks.filter((link) => user || link.to === '/').map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} className={navClass} end={end}>
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 pt-4 xl:mt-0 xl:flex-nowrap xl:border-t-0 xl:pt-0">
              {user ? (
                <div className="relative w-full xl:w-auto" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((current) => !current)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-card border border-white/15 bg-white/10 px-3 py-2 text-left text-white transition hover:bg-white/15 xl:w-auto"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-card bg-coral text-xs font-black text-white" aria-hidden="true">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    <span className="min-w-0 flex-1">
                      <strong className="block max-w-48 truncate text-sm font-black xl:max-w-28">{user.name}</strong>
                      <small className="block max-w-56 truncate text-xs text-white/60 xl:hidden">{user.email}</small>
                    </span>
                    <ChevronDown size={16} className={cn('shrink-0 transition', accountOpen && 'rotate-180')} aria-hidden="true" />
                  </button>

                  {accountOpen && (
                    <div className="mt-2 w-full rounded-panel border border-line bg-white p-2 text-ink shadow-card-hover xl:absolute xl:right-0 xl:top-full xl:z-50 xl:w-72">
                      <div className="border-b border-line px-3 py-3">
                        <p className="truncate text-sm font-black">{user.name}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-ink-soft">{user.email}</p>
                      </div>
                      <div className="grid gap-1 py-2">
                        <Link to="/profile" onClick={() => setAccountOpen(false)} className="flex min-h-10 items-center gap-2 rounded-card px-3 text-sm font-bold text-ink transition hover:bg-emerald-pale hover:text-emerald-dark-brand">
                          <UserRound size={16} /> Profile
                        </Link>
                        <Link to="/dashboard" onClick={() => setAccountOpen(false)} className="flex min-h-10 items-center gap-2 rounded-card px-3 text-sm font-bold text-ink transition hover:bg-emerald-pale hover:text-emerald-dark-brand">
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <button type="button" onClick={() => { setAccountOpen(false); logout() }} className="flex min-h-10 items-center gap-2 rounded-card px-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-50">
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <NavLink to="/login" className={navClass}><LogIn size={16} /> Sign in</NavLink>
                  <NavLink to="/register" className="inline-flex min-h-9 items-center gap-2 rounded-card border border-sun bg-sun px-3 py-2 text-sm font-black text-yellow-950 transition hover:brightness-105"><UserPlus size={16} /> Register</NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  )
}

function RouteLoading() {
  return (
    <div className="grid min-h-64 gap-4 rounded-panel border border-line bg-white/80 p-6 shadow-card" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-bold text-ink-soft">
        <span className="block size-8 animate-spin rounded-full border-4 border-line border-t-emerald-brand" />
        Loading workspace...
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <span className="skeleton-shimmer h-24 rounded-card" />
        <span className="skeleton-shimmer h-24 rounded-card" />
        <span className="skeleton-shimmer h-24 rounded-card" />
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <section className="surface-grid mx-auto grid min-h-96 max-w-2xl place-items-center gap-4 rounded-panel border border-line bg-white/85 p-8 text-center shadow-card">
      <span className="grid size-14 place-items-center rounded-card bg-emerald-pale text-emerald-dark-brand"><HomeIcon size={25} /></span>
      <div>
        <p className="text-xs font-extrabold uppercase text-emerald-dark-brand">404</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">The page you opened does not exist in this workspace.</p>
      </div>
      <Link to="/" className={cn(ui.button.base, ui.button.primary)}><HomeIcon size={17} /> Return home</Link>
    </section>
  )
}

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function AppRoutes() {
  return (
    <>
      <RouteMeta />
      <Navigation />
      <main id="main-content" tabIndex="-1" className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 xl:py-8">
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/public/:slug" element={<PublicProfile />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/skills" element={<Protected><Skills /></Protected>} />
            <Route path="/skills/new" element={<Protected><SkillForm /></Protected>} />
            <Route path="/skills/:id/edit" element={<Protected><SkillForm /></Protected>} />
            <Route path="/skills/:id" element={<Protected><SkillDetails /></Protected>} />
            <Route path="/logs" element={<Protected><LearningLogs /></Protected>} />
            <Route path="/revisions" element={<Protected><Revisions /></Protected>} />
            <Route path="/notes" element={<Protected><Notes /></Protected>} />
            <Route path="/ai" element={<Protected><AIAssistant /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/teams" element={<Protected><Teams /></Protected>} />
            <Route path="/activity" element={<Protected><ActivityFeed /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="/roadmaps" element={<Protected><Roadmaps /></Protected>} />
            <Route path="/roadmaps/new" element={<Protected><RoadmapForm /></Protected>} />
            <Route path="/roadmaps/:id/edit" element={<Protected><RoadmapForm /></Protected>} />
            <Route path="/roadmaps/templates/:id" element={<Protected><RoadmapDetail /></Protected>} />
            <Route path="/roadmaps/:id" element={<Protected><UserRoadmapDetail /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BrowserRouter><AppRoutes /></BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  )
}
