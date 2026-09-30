import { Component } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

/**
 * Keeps a single page failure from white-screening the whole app during a live
 * presentation. Shows what broke and offers a way straight back into the demo.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[lawlink] render error:', error, info?.componentStack)
    // A crash is the one thing that MUST interrupt a screen reader — a silent
    // failure leaves a non-sighted user staring at a frozen page with no idea
    // anything went wrong.
    const live = document.querySelector('[role="alert"]')
    if (live) live.textContent = `This screen failed to load. ${String(error?.message || error)}`
  }

  /** After a redeploy the old hashed chunk is gone: retrying in place can never work, so reload. */
  retry = () => {
    const msg = String(this.state.error?.message || this.state.error)
    if (/dynamically imported module|Loading chunk|Failed to fetch dynamically/i.test(msg)) window.location.reload()
    else this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        {/* `overlay-panel`, not `glass-strong` — the v1 glass class was retired
            when the design system moved to tonal sheets, so this rendered with
            no background at all. */}
        <div className="overlay-panel w-full max-w-md rounded-2xl p-7 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-danger/[0.12] ring-1 ring-inset ring-danger/25">
            <AlertTriangle size={22} className="text-danger" strokeWidth={2.2} />
          </div>
          <h1 className="text-lg font-extrabold">This screen hit a snag</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            Something in this page failed to render. The rest of LawLink is still fine — your
            progress is saved.
          </p>
          <p role="alert" className="mt-4 rounded-xl bg-white/[0.04] px-3 py-2 text-left text-caption text-fg-dim">
            {String(error?.message || error)}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button onClick={this.retry} className="btn btn-primary flex-1">
              <RotateCcw size={15} />
              Try again
            </button>
            <a href="/dashboard" className="btn btn-ghost flex-1">
              <Home size={15} />
              Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
