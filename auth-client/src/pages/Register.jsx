import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../services/auth.api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import AuthForm from '../components/ui/AuthForm'
import PublicLayout from '../components/layout/PublicLayout'

function Register() {

  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e) => {
  e.preventDefault()

  if (loading) return

  if (!username || !email || !password) {
    setError('Todos los campos son obligatorios')
    return
  }

  if (username.length < 3) {
    setError('Username must be at least 3 characters')
    return
  }

  if (!email.includes('@')) {
    setError('Invalid email')
    return
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters')
    return
  }

  try {
    setError('')
    setLoading(true)

    await register({
      username,
      email,
      password
    })

  navigate('/login', {
    state: {
      email
    }
  })
  } catch (error) {
    const backendError =
      error.response?.data?.error

    const validationError =
      error.response?.data?.errors?.[0]?.message

    setError(
      backendError ||
      validationError ||
      'Error al registrar usuario'
    )
  } finally {
    setLoading(false)
  }
}


  return (
    <PublicLayout>
      <AuthForm
        title="Register"
        error={error}
        onSubmit={handleSubmit}
      >
          <Input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />


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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />


          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-violet-300 transition hover:text-violet-200"
            >
              Log in
            </button>
          </p>

      </AuthForm>
    </PublicLayout>
  )
}


export default Register