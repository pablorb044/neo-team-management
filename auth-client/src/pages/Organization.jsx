import { useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { createOrganization } from '../services/organization.api'
import { createTeamJoinRequest } from '../services/team-join-request.api'

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

  const [teamId, setTeamId] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState('')
  const [requestError, setRequestError] = useState('')

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

  const handleJoinRequest = async (event) => {
    event.preventDefault()

    if (requesting || !teamId.trim()) {
      return
    }

    try {
      setRequesting(true)
      setRequestSuccess('')
      setRequestError('')

      await createTeamJoinRequest(teamId.trim())

      setTeamId('')
      setRequestSuccess(
        'Join request sent successfully. Wait for the team manager to approve it.'
      )
    } catch (error) {
      setRequestError(
        error.response?.data?.error ||
        'Error sending join request'
      )
    } finally {
      setRequesting(false)
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
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Organization
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {organization.name}
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                You are currently part of this organization.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">

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

            <Card>
              <div className="space-y-5">

                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Existing Team
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Join a Team
                  </h2>

                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Enter the Team ID provided by the team manager to
                    request access.
                  </p>
                </div>

                <form
                  onSubmit={handleJoinRequest}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={teamId}
                    onChange={(event) => {
                      setTeamId(event.target.value)
                      setRequestError('')
                      setRequestSuccess('')
                    }}
                    placeholder="Enter Team ID"
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

                  <Button
                    type="submit"
                    disabled={requesting || !teamId.trim()}
                    className="w-auto"
                  >
                    {requesting
                      ? 'Sending request...'
                      : 'Request to join'}
                  </Button>
                </form>

                {requestSuccess && (
                  <p className="text-sm text-green-400">
                    {requestSuccess}
                  </p>
                )}

                {requestError && (
                  <p className="text-sm text-red-400">
                    {requestError}
                  </p>
                )}

              </div>
            </Card>

          </div>
        )}

        {team && (
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Current Team
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {team.name}
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                You are currently a member of this Team.
              </p>
            </div>
          </Card>
        )}

      </div>
    </AppLayout>
  )
}

export default Organization