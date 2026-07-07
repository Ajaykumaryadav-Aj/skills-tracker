import { lazy, Suspense, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock3,
  Home as HomeIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  Menu,
  UserRound,
  UserPlus,
  X,
} from 'lucide-react'
import AppErrorBoundary from './components/AppErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { AuthContext } from './context/authContextValue'
import ProtectedRoute from './routes/ProtectedRoute'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const LearningLogs = lazy(() => import('./pages/LearningLogs'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'))
const Profile = lazy(() => import('./pages/Profile'))
const RoadmapDetail = lazy(() => import('./pages/RoadmapDetail'))
const RoadmapForm = lazy(() => import('./pages/RoadmapForm'))
const Roadmaps = lazy(() => import('./pages/Roadmaps'))
const SkillDetails = lazy(() => import('./pages/SkillDetails'))
const SkillForm = lazy(() => import('./pages/SkillForm'))
const Skills = lazy(() => import('./pages/Skills'))
const UserRoadmapDetail = lazy(() => import('./pages/UserRoadmapDetail'))

const routeMeta = [
  { match: (path) => path === '/', title: 'Skills Tracker', description: 'Track skills, topics, learning notes, resources, and progress.' },
  { match: (path) => path.startsWith('/dashboard'), title: 'Dashboard | Skills Tracker', description: 'Review your learning progress and activity.' },
  { match: (path) => path.startsWith('/skills'), title: 'Skills | Skills Tracker', description: 'Manage skills, topics, notes, and resources.' },
  { match: (path) => path.startsWith('/roadmaps'), title: 'Roadmaps | Skills Tracker', description: 'Plan and monitor structured learning roadmaps.' },
  { match: (path) => path.startsWith('/logs'), title: 'Learning Logs | Skills Tracker', description: 'Record and review learning sessions.' },
  { match: (path) => path.startsWith('/profile'), title: 'Profile | Skills Tracker', description: 'Manage your Skills Tracker profile and account.' },
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
  { to: '/profile', label: 'Profile', icon: UserRound },
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
      <section className="guest-entry reveal-item" aria-labelledby="home-title">
        <div className="guest-entry__brand">
          <span aria-hidden="true"><BarChart3 size={27} /></span>
          <p>Skills Tracker</p>
        </div>
        <h1 id="home-title">Your learning workspace</h1>
        <p>Sign in to continue, or create a new account.</p>
        <div className="guest-entry__actions">
          <Link to="/login" className="button button--primary"><LogIn size={17} /> Sign in</Link>
          <Link to="/register" className="button button--secondary"><UserPlus size={17} /> Create account</Link>
        </div>
      </section>
    )
  }

  const shortcuts = [
    { to: '/dashboard', title: 'Progress overview', detail: 'Open your latest learning metrics', icon: LayoutDashboard, tone: 'emerald' },
    { to: '/skills', title: 'Manage skills', detail: 'Continue topics, notes and resources', icon: BookOpenCheck, tone: 'coral' },
    { to: '/roadmaps', title: 'Learning roadmaps', detail: 'Review structured learning paths', icon: Map, tone: 'sun' },
    { to: '/logs', title: 'Learning history', detail: 'Record or review focused sessions', icon: Clock3, tone: 'blue' },
  ]

  return (
    <section className="home-workspace" aria-labelledby="home-title">
      <header className="home-welcome reveal-item">
        <p className="eyebrow"><BarChart3 size={15} /> Personal workspace</p>
        <h1 id="home-title">Welcome back, {user.name?.split(' ')[0] || 'Learner'}</h1>
        <p>Choose where you want to continue.</p>
      </header>
      <div className="shortcut-grid">
        {shortcuts.map(({ to, title, detail, icon: Icon, tone }, index) => (
          <Link key={to} to={to} className={`shortcut-card shortcut-card--${tone} reveal-item`} style={{ '--reveal-delay': `${index * 70}ms` }}>
            <span className="shortcut-card__icon"><Icon size={21} /></span>
            <div><h2>{title}</h2><p>{detail}</p></div>
            <ArrowRight size={18} className="shortcut-card__arrow" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function Navigation() {
  const { user, logout } = useContext(AuthContext)
  const [menuOpen, setMenuOpen] = useState(false)

  const navClass = ({ isActive }) => `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header">
        <nav aria-label="Primary navigation" className="app-header__inner">
          <Link to="/" className="app-brand" aria-label="Skills Tracker home">
            <span className="app-brand__mark" aria-hidden="true"><BarChart3 size={21} /></span>
            <span><strong>Skills Tracker</strong><small>Learning workspace</small></span>
          </Link>

          <button
            type="button"
            className="menu-toggle"
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
            className={`app-nav ${menuOpen ? 'app-nav--open' : ''}`}
            onClick={(event) => {
              if (event.target.closest('a')) setMenuOpen(false)
            }}
          >
            <div className="app-nav__links">
              {primaryLinks.filter((link) => user || link.to === '/').map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} className={navClass} end={end}>
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            <div className="app-account">
              {user ? (
                <>
                  <div className="app-account__identity">
                    <span aria-hidden="true">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    <div><strong>{user.name}</strong><small>{user.email}</small></div>
                  </div>
                  <button type="button" onClick={logout} className="header-action" aria-label="Sign out" title="Sign out">
                    <LogOut size={17} aria-hidden="true" /><span>Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navClass}><LogIn size={16} /> Sign in</NavLink>
                  <NavLink to="/register" className="header-register"><UserPlus size={16} /> Register</NavLink>
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
  return <div className="app-loader" role="status" aria-live="polite"><span />Loading page...</div>
}

function NotFound() {
  return (
    <section className="empty-page">
      <h1>Page not found</h1>
      <Link to="/" className="button button--primary"><HomeIcon size={17} /> Return home</Link>
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
      <main id="main-content" tabIndex="-1" className="app-main">
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/skills" element={<Protected><Skills /></Protected>} />
            <Route path="/skills/new" element={<Protected><SkillForm /></Protected>} />
            <Route path="/skills/:id/edit" element={<Protected><SkillForm /></Protected>} />
            <Route path="/skills/:id" element={<Protected><SkillDetails /></Protected>} />
            <Route path="/logs" element={<Protected><LearningLogs /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
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
