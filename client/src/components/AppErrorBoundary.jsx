import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

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
        <main className="error-page">
          <div className="error-page__content">
            <span><TriangleAlert size={25} /></span>
            <h1>Something went wrong</h1>
            <p>Refresh the page to try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="button button--primary"
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
