import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

function NotFound() {
  const navigate = useNavigate()

return (
  <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 text-[var(--text-primary)]">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[var(--bg-secondary)] p-8 text-center shadow-2xl">
      <p className="text-sm font-medium uppercase tracking-widest text-violet-400">
        NEO
      </p>

      <p className="mt-4 text-7xl font-bold">
        404
      </p>

      <h1 className="mt-4 text-2xl font-semibold">
        Page not found
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Button
        onClick={() => navigate('/dashboard')}
        className="mx-auto mt-8 w-auto px-5 py-2.5"
      >
        Go to dashboard
      </Button>
    </div>
  </div>
)
}

export default NotFound