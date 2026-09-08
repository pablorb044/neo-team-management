import { Component } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from './Button'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)

    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError() {
    return {
      hasError: true
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.hasError &&
      prevProps.locationKey !== this.props.locationKey
    ) {
      this.setState({
        hasError: false
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}

function ErrorFallback() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 text-[var(--text-primary)]">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[var(--bg-secondary)] p-8 text-center shadow-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">
          NEO
        </p>

        <p className="mt-4 text-6xl font-bold">
          Oops
        </p>

        <h1 className="mt-4 text-2xl font-semibold">
          Something went wrong
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          An unexpected error occurred. You can return to the dashboard and continue using NEO.
        </p>

        <Button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mx-auto mt-8 !w-auto px-5 py-2.5"
        >
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}

function ErrorBoundaryWithRouter({ children }) {
  const location = useLocation()

  return (
    <ErrorBoundary locationKey={location.pathname}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundaryWithRouter