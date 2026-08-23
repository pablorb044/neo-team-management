import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login as loginRequest, getProfile } from '../services/auth.api'
import { saveToken } from '../utils/token'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import AuthForm from '../components/ui/AuthForm'
import AuthLayout from '../components/layout/AuthLayout'

function Login() {
  const navigate = useNavigate()

  const location = useLocation()

  const [email, setEmail] = useState(
    location.state?.email || ''
  )

  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    if (!email || !password) {
      setError('Email y password son obligatorios')
      return
    }

    try {
      setError('')
      setLoading(true)

      const data = await loginRequest({
        email,
        password
      })

      saveToken(data.token)

      const user = await getProfile()

      await login(user, data.token)

    navigate('/dashboard')
    } catch (error) {
      setError(
        error.response?.data?.error ||
        'Error al iniciar sesión'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthForm
        title="Login"
        error={error}
        onSubmit={handleSubmit}
      >
        <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-medium text-violet-300 transition hover:text-violet-200"
          >
            Create one
          </button>
        </div>
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Login'}
        </Button>
      </AuthForm>
    </AuthLayout>
  )
}

export default Login