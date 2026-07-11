import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { cn, ui } from '../utils/tw'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
          <div className="surface-grid grid max-w-md justify-items-center gap-4 rounded-panel border border-line bg-white/90 p-8 text-center shadow-card backdrop-blur">
            <span className="grid size-12 place-items-center rounded-card bg-coral-pale text-coral-dark"><TriangleAlert size={25} /></span>
            <h1 className="text-2xl font-black text-ink">Something went wrong</h1>
            <p className="text-sm leading-6 text-ink-soft">Refresh the page to try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={cn(ui.button.base, ui.button.primary)}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
