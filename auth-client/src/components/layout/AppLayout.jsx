import { useEffect, useRef, useState } from 'react'
import {
  User,
  Sun,
  Moon,
  LogOut,
  Bell,
  Mail,
  CheckSquare,
  Menu,
  X
} from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { useTheme } from '../../hooks/useTheme'

function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications()

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notificationsRef = useRef(null)

  const displayName = user?.username || 'User'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  const recentNotifications = notifications.slice(0, 5)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNavigation = (path) => {
    setMobileMenuOpen(false)
    setNotificationsOpen(false)
    navigate(path)
  }

  const isActiveRoute = (path) => location.pathname === path

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    setNotificationsOpen(false)

    const destination =
      notification.type === 'TEAM_JOIN_REQUEST'
        ? '/join-requests'
        : [
            'TEAM_JOIN_APPROVED',
            'TEAM_JOIN_REJECTED'
          ].includes(notification.type)
          ? '/team'
          : '/tasks'

    navigate(destination)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleLogout = () => {
    setMobileMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Desktop sidebar */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-64
          flex-col
          border-r
          border-white/10
          bg-[var(--bg-secondary)]
          md:flex
        "
      >

        <div className="p-6">
          <h1 className="text-xl font-semibold">
            NEO
          </h1>
        </div>

        <nav className="flex-1 px-4">

          <button
            onClick={() => handleNavigation('/dashboard')}
            className={`
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              font-medium
              transition
              ${
                isActiveRoute('/dashboard')
                  ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }
            `}
          >
            <User size={18} />
            Dashboard
          </button>

          <button
            onClick={() => handleNavigation('/profile')}
            className={`
              mt-2
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              transition
              ${
                isActiveRoute('/profile')
                  ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }
            `}
          >
            <User size={18} />
            Profile
          </button>

          <button
            onClick={() => handleNavigation('/tasks')}
            className={`
              mt-2
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              transition
              ${
                isActiveRoute('/tasks')
                  ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }
            `}
          >
            <CheckSquare size={18} />
            Tasks
          </button>

          <button
            onClick={() => handleNavigation('/team')}
            className={`
              mt-2
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              transition
              ${
                isActiveRoute('/team')
                  ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }
            `}
          >
            <User size={18} />
            Team
          </button>

          {user?.role === 'manager' && (
            <button
              onClick={() => handleNavigation('/join-requests')}
              className={`
                mt-2
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                text-sm
                transition
                ${
                  isActiveRoute('/join-requests')
                    ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                }
              `}
            >
              <Mail size={18} />
              Join Requests
            </button>
          )}

          <button
            onClick={() => handleNavigation('/organization')}
            className={`
              mt-2
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              transition
              ${
                isActiveRoute('/organization')
                  ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }
            `}
          >
            <User size={18} />
            Organization
          </button>

        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">

          <button
            type="button"
            onClick={toggleTheme}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              text-[var(--text-secondary)]
              transition
              hover:bg-white/5
              hover:text-[var(--text-primary)]
            "
          >
            {theme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            {theme === 'dark'
              ? 'Light mode'
              : 'Dark mode'}
          </button>

          <button
            onClick={handleLogout}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-sm
              text-[var(--text-secondary)]
              transition
              hover:bg-white/5
              hover:text-[var(--text-primary)]
            "
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* Mobile menu overlay */}

      {mobileMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-[60]
            bg-black/60
            backdrop-blur-sm
            md:hidden
          "
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="
              flex
              h-full
              w-[min(20rem,85vw)]
              flex-col
              border-r
              border-white/10
              bg-[var(--bg-secondary)]
              shadow-2xl
            "
            onClick={(event) => event.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h1 className="text-xl font-semibold">
                NEO
              </h1>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="
                  rounded-lg
                  p-2
                  text-[var(--text-secondary)]
                  transition
                  hover:bg-white/5
                  hover:text-[var(--text-primary)]
                "
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-5">

              <button
                onClick={() => handleNavigation('/dashboard')}
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition
                  ${
                    isActiveRoute('/dashboard')
                      ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <User size={18} />
                Dashboard
              </button>

              <button
                onClick={() => handleNavigation('/profile')}
                className={`
                  mt-2
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition
                  ${
                    isActiveRoute('/profile')
                      ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <User size={18} />
                Profile
              </button>

              <button
                onClick={() => handleNavigation('/tasks')}
                className={`
                  mt-2
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition
                  ${
                    isActiveRoute('/tasks')
                      ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <CheckSquare size={18} />
                Tasks
              </button>

              <button
                onClick={() => handleNavigation('/team')}
                className={`
                  mt-2
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition
                  ${
                    isActiveRoute('/team')
                      ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <User size={18} />
                Team
              </button>

              {user?.role === 'manager' && (
                <button
                  onClick={() => handleNavigation('/join-requests')}
                  className={`
                    mt-2
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    transition
                    ${
                      isActiveRoute('/join-requests')
                        ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                        : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Mail size={18} />
                  Join Requests
                </button>
              )}

              <button
                onClick={() => handleNavigation('/organization')}
                className={`
                  mt-2
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition
                  ${
                    isActiveRoute('/organization')
                      ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 font-medium text-[var(--text-primary)] shadow-lg shadow-violet-900/20'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <User size={18} />
                Organization
              </button>
            </nav>

            <div className="space-y-2 border-t border-white/10 p-4">

              <button
                type="button"
                onClick={toggleTheme}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  text-[var(--text-secondary)]
                  transition
                  hover:bg-white/5
                  hover:text-[var(--text-primary)]
                "
              >
                {theme === 'dark' ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}

                {theme === 'dark'
                  ? 'Light mode'
                  : 'Dark mode'}
              </button>

              <button
                onClick={handleLogout}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  text-[var(--text-secondary)]
                  transition
                  hover:bg-white/5
                  hover:text-[var(--text-primary)]
                "
              >
                <LogOut size={18} />
                Logout
              </button>

            </div>

          </aside>
        </div>
      )}

      {/* Main area */}

      <div className="min-h-screen md:pl-64">

        {/* Header */}

        <header
          className="
            relative
            z-50
            flex
            h-16
            items-center
            justify-between
            border-b
            border-white/10
            bg-[var(--bg-primary)]
            px-4
            backdrop-blur-xl
            sm:px-6
            md:px-8
          "
        >

          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="
                rounded-lg
                p-2
                text-[var(--text-secondary)]
                transition
                hover:bg-white/5
                hover:text-[var(--text-primary)]
                md:hidden
              "
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div
              className="
                flex
                items-center
                md:hidden
              "
            >
              <p className="text-sm font-medium tracking-wide text-[var(--text-primary)]">
                NEO
                <span className="mx-2 text-[var(--text-secondary)]">·</span>
                <span className="font-normal text-[var(--text-secondary)]">
                  Team & Task Management
                </span>
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2sm:gap-4">

            {/* Notifications */}

            <div
              ref={notificationsRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(
                    current => !current
                  )
                }
                className={`
                  relative
                  rounded-lg
                  p-2
                  transition
                  hover:bg-white/5
                  ${
                    unreadCount > 0
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      min-h-4
                      min-w-4
                      items-center
                      justify-center
                      rounded-full
                      bg-red-500/90
                      px-1
                      text-[9px]
                      font-semibold
                      text-white
                    "
                  >
                    {unreadCount > 9
                      ? '9+'
                      : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="
                    fixed
                    left-2
                    right-2
                    top-20
                    z-50
                    max-h-[calc(100vh-6rem)]
                    overflow-hidden
                    rounded-xl
                    border
                    border-white/10
                    bg-[var(--bg-secondary)]
                    shadow-2xl
                    sm:absolute
                    sm:left-auto
                    sm:right-0
                    sm:top-12
                    sm:w-96
                    sm:max-h-none
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      border-b
                      border-white/10
                      px-4
                      py-3
                    "
                  >
                    <div>
                      <h2 className="text-sm font-semibold">
                        Notifications
                      </h2>

                      {unreadCount > 0 && (
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {unreadCount} unread
                        </p>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="
                          shrink-0
                          text-xs
                          text-violet-300
                          transition
                          hover:text-violet-200
                        "
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">

                    {recentNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-[var(--text-secondary)]">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      recentNotifications.map(notification => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={`
                            flex
                            w-full
                            gap-3
                            border-b
                            border-white/5
                            px-4
                            py-3
                            text-left
                            transition
                            hover:bg-white/5
                            ${
                              notification.read
                                ? 'bg-transparent'
                                : 'bg-white/[0.03]'
                            }
                          `}
                        >

                          <div className="pt-1">
                            <span
                              className={`
                                block
                                h-2
                                w-2
                                rounded-full
                                ${
                                  notification.read
                                    ? 'bg-white/10'
                                    : 'bg-violet-400'
                                }
                              `}
                            />
                          </div>

                          <div className="min-w-0 flex-1">

                            <p
                              className={`
                                break-words
                                text-sm
                                ${
                                  notification.read
                                    ? 'text-[var(--text-secondary)]'
                                    : 'text-[var(--text-primary)]'
                                }
                              `}
                            >
                              {notification.message}
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-secondary)]">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>

                          </div>

                        </button>
                      ))
                    )}

                  </div>

                </div>
              )}
            </div>

            {/* User */}

            <button
              type="button"
              onClick={() => handleNavigation('/dashboard')}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-2
                py-2
                transition
                hover:bg-white/10
                sm:gap-3
                sm:px-3
              "
              aria-label="Go to dashboard"
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-violet-500
                  to-blue-500
                  text-xs
                  font-semibold
                "
              >
                {avatarLetter}
              </div>

              <span className="hidden max-w-32 truncate text-sm text-[var(--text-secondary)] sm:block">
                {displayName}
              </span>
            </button>

          </div>

        </header>

        {/* Page content */}

        <main className="p-4 sm:p-6 md:p-8">
          {children}
        </main>

      </div>

    </div>
  )
}

export default AppLayout