import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import {
  createOrganization,
  getOrganizationMembers
} from '../services/organization.api'

function Organization() {
  const { user, updateUser } = useAuth()

  const {
    organization,
    team,
    loading,
    error
  } = useDashboard()

  const [organizationName, setOrganizationName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [creatingOrganization, setCreatingOrganization] = useState(false)
  const [organizationSuccess, setOrganizationSuccess] = useState('')
  const [organizationError, setOrganizationError] = useState('')

  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')
  const [copiedTeamId, setCopiedTeamId] = useState(false)

  useEffect(() => {
    if (!organization?.id) {
      return
    }

    const loadMembers = async () => {
      try {
        setMembersLoading(true)
        setMembersError('')

        const data = await getOrganizationMembers(organization.id)

        setMembers(data)
      } catch (error) {
        setMembersError(
          error.response?.data?.error ||
          'Error loading organization members'
        )
      } finally {
        setMembersLoading(false)
      }
    }

    loadMembers()
  }, [organization?.id])

  const handleCreateOrganization = async (event) => {
    event.preventDefault()

    if (
      creatingOrganization ||
      !organizationName.trim() ||
      !teamName.trim()
    ) {
      return
    }

    try {
      setCreatingOrganization(true)
      setOrganizationSuccess('')
      setOrganizationError('')

      const result = await createOrganization({
        organizationName: organizationName.trim(),
        teamName: teamName.trim()
      })

      updateUser({
        ...user,
        role: result.manager.role,
        teamId: result.team.id
      })

      setOrganizationName('')
      setTeamName('')

      setOrganizationSuccess(
        'Organization and Team created successfully.'
      )
    } catch (error) {
      setOrganizationError(
        error.response?.data?.error ||
        'Error creating the organization'
      )
    } finally {
      setCreatingOrganization(false)
    }
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
            Loading organization...
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">

        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Organization
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            {organization?.name || 'No organization'}
          </h1>
        </div>

        {error && (
          <Card>
            <p className="text-sm text-red-400">
              {error}
            </p>
          </Card>
        )}

        {organization ? (
          <>
            <Card>
              <div className="space-y-6">

                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Organization
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    {organization.name}
                  </h2>

                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Your organization workspace
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Team
                    </p>

                    <p className="mt-1 text-lg font-medium">
                      {team?.name || organization.team?.name || 'No Team'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Manager
                    </p>

                    <p className="mt-1 text-lg font-medium">
                      {team?.manager?.username ||
                        organization.team?.manager?.username ||
                        'Unknown'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Members
                    </p>

                    <p className="mt-1 text-lg font-medium">
                      {membersLoading
                        ? 'Loading...'
                        : members.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Your role
                    </p>

                    <p className="mt-1 text-lg font-medium">
                      {user?.role}
                    </p>
                  </div>

                </div>

                {membersError && (
                  <p className="text-sm text-red-400">
                    {membersError}
                  </p>
                )}

              </div>
            </Card>

            {team && (
              <Card>
                <div className="space-y-5">

                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Team access
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {team.name}
                    </h2>

                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Share this Team ID with people you want to invite.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
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
              </Card>
            )}
          </>
        ) : (
          <Card>
            <form
              onSubmit={handleCreateOrganization}
              className="space-y-5"
            >
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  New workspace
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Create Organization
                </h2>

                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Create a new organization and Team. You will
                  automatically become the Team manager.
                </p>
              </div>

              {organizationError && (
                <p className="text-sm text-red-400">
                  {organizationError}
                </p>
              )}

              {organizationSuccess && (
                <p className="text-sm text-green-400">
                  {organizationSuccess}
                </p>
              )}

              <div className="space-y-3">

                <div>
                  <label className="mb-2 block text-sm">
                    Organization name
                  </label>

                  <input
                    type="text"
                    value={organizationName}
                    onChange={(event) => {
                      setOrganizationName(event.target.value)
                      setOrganizationError('')
                      setOrganizationSuccess('')
                    }}
                    placeholder="Organization name"
                    minLength={2}
                    required
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      px-4
                      py-3
                      text-sm
                      text-[var(--text-primary)]
                      outline-none
                      transition
                      focus:border-violet-500/50
                      focus:bg-white/10
                    "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Team name
                  </label>

                  <input
                    type="text"
                    value={teamName}
                    onChange={(event) => {
                      setTeamName(event.target.value)
                      setOrganizationError('')
                      setOrganizationSuccess('')
                    }}
                    placeholder="Team name"
                    minLength={2}
                    required
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      px-4
                      py-3
                      text-sm
                      text-[var(--text-primary)]
                      outline-none
                      transition
                      focus:border-violet-500/50
                      focus:bg-white/10
                    "
                  />
                </div>

              </div>

              <Button
                type="submit"
                disabled={
                  creatingOrganization ||
                  !organizationName.trim() ||
                  !teamName.trim()
                }
                className="w-auto"
              >
                {creatingOrganization
                  ? 'Creating...'
                  : 'Create Organization'}
              </Button>
            </form>
          </Card>
        )}

      </div>
    </AppLayout>
  )
}

export default Organization