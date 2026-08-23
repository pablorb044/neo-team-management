import { useNavigate } from 'react-router-dom'

function PublicLayout({ children }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#080316] text-white">

      <header
        className="
          border-b
          border-white/10
          bg-[#080316]/80
          backdrop-blur-xl
        "
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">

          <button
            type="button"
            onClick={() => navigate('/')}
            className="
              text-lg
              font-semibold
              tracking-tight
              text-white
              transition
              hover:text-violet-300
            "
          >
            NEO
          </button>

          <nav className="flex items-center gap-5 text-sm">

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="
                text-white/60
                transition
                hover:text-white
              "
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="
                rounded-lg
                border
                border-white/10
                bg-white/5
                px-3
                py-2
                text-white/80
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              Register
            </button>

          </nav>

        </div>
      </header>

      <main>
        {children}
      </main>

    </div>
  )
}

export default PublicLayout