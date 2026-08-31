import { useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import { useDashboard } from '../hooks/useDashboard'
import { Link } from 'react-router-dom'

function Dashboard() {
  const {
    user,
    team,
    organization,
    tasks,
    loading,
    error
  } = useDashboard()

  const [copiedTeamId, setCopiedTeamId] = useState(false)

  const taskCounts = {
    SENT: tasks.filter((task) => task.status === 'SENT').length,
    WORKING: tasks.filter((task) => task.status === 'WORKING').length,
    SUBMITTED: tasks.filter((task) => task.status === 'SUBMITTED').length,
    DONE: tasks.filter((task) => task.status === 'DONE').length
  }

  const handleCopyTeamId = async () => {
  if (!team?.id) {
    return
  }

  try {
    await navigator.clipboard.writeText(team.id)

    setCopiedTeamId(true)

    setTimeout(() => {
      setCopiedTeamId(false)
    }, 2000)
  } catch (error) {
    console.error('Failed to copy Team ID', error)
  }
}

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Loading dashboard...
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">

        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            {user?.username}
          </h1>
        </div>

        {error && (
          <Card>
            <p className="text-sm text-red-400">
              {error}
            </p>
          </Card>
        )}

        {!team && (
          <Card>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Get started
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  No Team yet
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                  Create your own organization or join an existing team
                  to start receiving tasks.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/organization"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-500
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-violet-400
                  "
                >
                  Create Organization
                </Link>

                <Link
                  to="/team"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-[var(--text-primary)]
                    transition
                    hover:bg-white/10
                  "
                >
                  Join a Team
                </Link>
              </div>
            </div>
          </Card>
        )}

        <section>
          <div className="mb-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {user?.role === 'manager'
                ? 'Team Overview'
                : 'Task Overview'}
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {user?.role === 'manager'
                ? 'Team Tasks'
                : 'Your Tasks'}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Card>
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Sent
                </p>

                <p className="text-4xl font-semibold">
                  {taskCounts.SENT}
                </p>

                <p className="text-xs text-[var(--text-secondary)]">
                  Waiting to start
                </p>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Working
                </p>

                <p className="text-4xl font-semibold">
                  {taskCounts.WORKING}
                </p>

                <p className="text-xs text-[var(--text-secondary)]">
                  Currently in progress
                </p>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Submitted
                </p>

                <p className="text-4xl font-semibold">
                  {taskCounts.SUBMITTED}
                </p>

                <p className="text-xs text-[var(--text-secondary)]">
                  Waiting for review
                </p>
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Done
                </p>

                <p className="text-4xl font-semibold">
                  {taskCounts.DONE}
                </p>

                <p className="text-xs text-[var(--text-secondary)]">
                  Completed tasks
                </p>
              </div>
            </Card>

          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Account
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Your Profile
                </h2>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-[var(--text-secondary)]">
                    Username:
                  </span>{' '}
                  {user?.username}
                </p>

                <p>
                  <span className="text-[var(--text-secondary)]">
                    Email:
                  </span>{' '}
                  {user?.email}
                </p>

                <p>
                  <span className="text-[var(--text-secondary)]">
                    Role:
                  </span>{' '}
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Organization
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {organization?.name || 'No organization'}
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                {organization
                  ? 'You are currently part of this organization.'
                  : 'You are not currently part of an organization.'
                }
              </p>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Team
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {team?.name || 'No Team'}
                </h2>
              </div>

              {team ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-[var(--text-secondary)]">
                      Manager:
                    </span>{' '}
                    {team.manager?.username || 'Unknown'}
                  </p>

                    <div>
                      <p className="text-[var(--text-secondary)]">
                        Team ID:
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <code className="break-all text-xs text-[var(--text-primary)]">
                          {team.id}
                        </code>

                        <button
                          type="button"
                          onClick={handleCopyTeamId}
                          className="
                            shrink-0
                            rounded-lg
                            border
                            border-white/10
                            bg-white/5
                            px-2
                            py-1
                            text-xs
                            text-[var(--text-secondary)]
                            transition
                            hover:bg-white/10
                            hover:text-[var(--text-primary)]
                          "
                          title="Copy Team ID"
                        >
                          {copiedTeamId ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  You are not currently a member of a Team.
                </p>
              )}
            </div>
          </Card>

        </div>

      </div>
    </AppLayout>
  )
}

export default Dashboard