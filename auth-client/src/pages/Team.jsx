import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import { useDashboard } from '../hooks/useDashboard'
import {
  deleteTeam,
  getTeamMembers,
  leaveTeam,
  removeTeamMember,
  updateTeam,
  updateTeamMemberRole
} from '../services/team.api'
import { useEffect, useState } from 'react'
import { createTeamJoinRequest } from '../services/team-join-request.api'
import Button from '../components/ui/Button'

function Team() {
  const {
    user,
    team,
    loading: dashboardLoading,
    error: dashboardError,
    refreshDashboard
  } = useDashboard()

  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [updatingRole, setUpdatingRole] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [membersRefreshKey, setMembersRefreshKey] = useState(0)
  const [removingMember, setRemovingMember] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [deletingTeam, setDeletingTeam] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [teamId, setTeamId] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState('')
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    if (!team?.id) {
      return
    }

    const loadMembers = async () => {
      try {
        setLoadingMembers(true)
        setError('')

        const data = await getTeamMembers(team.id)
        setMembers(data)
      } catch (error) {
        setError(
          error.response?.data?.error ||
          'Error al cargar los miembros del Team'
        )
      } finally {
        setLoadingMembers(false)
      }
    }

    loadMembers()
  }, [team?.id, membersRefreshKey])

  const errorMessage = dashboardError || error

  if (dashboardLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Loading team...
          </p>
        </div>
      </AppLayout>
    )
  }

  const handleLeaveTeam = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to leave this Team?'
    )

    if (!confirmed || leaving) {
      return
    }

    try {
      setLeaving(true)
      setLeaveError('')

      await leaveTeam(team.id)

      window.location.reload()
    } catch (error) {
      setLeaveError(
        error.response?.data?.error ||
        'Error leaving the Team'
      )
    } finally {
      setLeaving(false)
    }
  }

  const handleUpdateTeam = async (e) => {
    e.preventDefault()

    if (savingName || !teamName.trim()) {
      return
    }

    try {
      setSavingName(true)
      setNameError('')
      setSuccessMessage('')

      await updateTeam(team.id, {
        name: teamName.trim()
      })

      setEditingName(false)
      refreshDashboard()
      setSuccessMessage('Team name updated successfully.')
    } catch (error) {
      setNameError(
        error.response?.data?.error ||
        'Error updating the Team'
      )
    } finally {
      setSavingName(false)
    }
  }

  const handleMakeMember = async (memberId) => {
    if (updatingRole) {
      return
    }

    try {
      setUpdatingRole(true)
      setRoleError('')
      setSuccessMessage('')

      await updateTeamMemberRole(
        team.id,
        memberId,
        'MEMBER'
      )

      await refreshDashboard()
      setMembersRefreshKey((current) => current + 1)
      setSuccessMessage('Member role updated successfully.')
    } catch (error) {
      setRoleError(
        error.response?.data?.error ||
        'Error updating member role'
      )
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleRemoveMember = async (memberId, username) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${username} from this Team?`
    )

    if (!confirmed || removingMember) {
      return
    }

    try {
      setRemovingMember(true)
      setRemoveError('')
      setSuccessMessage('')

      await removeTeamMember(team.id, memberId)

      setMembersRefreshKey((current) => current + 1)
      setSuccessMessage('Member removed successfully.')
    } catch (error) {
      setRemoveError(
        error.response?.data?.error ||
        'Error removing member'
      )
    } finally {
      setRemovingMember(false)
    }
  }

  const handleDeleteTeam = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the Team "${team.name}"? This action cannot be undone.`
    )

    if (!confirmed || deletingTeam) {
      return
    }

    try {
      setDeletingTeam(true)
      setDeleteError('')

      await deleteTeam(team.id)

      window.location.href = '/dashboard'
    } catch (error) {
      setDeleteError(
        error.response?.data?.error ||
        'Error deleting the Team'
      )
    } finally {
      setDeletingTeam(false)
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

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">

        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Team
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            {team?.name || 'No Team'}
          </h1>
        </div>

        {errorMessage && (
          <Card>
            <p className="text-sm text-red-400">
              {errorMessage}
            </p>
          </Card>
        )}

        {successMessage && (
          <Card>
            <p className="text-sm text-green-400">
              {successMessage}
            </p>
          </Card>
        )}

        {!team ? (
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
                  Enter the Team ID provided by the team manager to request access.
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
                  {requesting ? 'Sending request...' : 'Request to join'}
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
        ) : (
          <>

            {user?.role === 'manager' && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Team name
                  </p>

                  {editingName ? (
                    <form
                      onSubmit={handleUpdateTeam}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        minLength={2}
                        required
                        className="
                          rounded-xl
                          border
                          border-white/10
                          bg-white/5
                          px-3
                          py-2
                          text-[var(--text-primary)]
                          outline-none
                        "
                      />

                      <Button
                        type="submit"
                        disabled={savingName}
                        className="w-auto"
                      >
                        {savingName ? 'Saving...' : 'Save'}
                      </Button>

                      <Button
                        type="button"
                        disabled={savingName}
                        onClick={() => {
                          setEditingName(false)
                          setTeamName(team.name)
                          setNameError('')
                        }}
                        className="w-auto bg-white/10 hover:bg-white/20"
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-1 flex items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        {team.name}
                      </h2>

                      <Button
                        type="button"
                        onClick={() => {
                          setTeamName(team.name)
                          setEditingName(true)
                          setNameError('')
                        }}
                        className="w-auto px-3 py-2 text-sm"
                      >
                        Edit
                      </Button>
                    </div>
                  )}

                  {nameError && (
                    <p className="mt-2 text-sm text-red-400">
                      {nameError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {user?.role === 'manager' && (
              <div className="pt-6">
                <Button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={deletingTeam}
                  className="
                    bg-red-600/80
                    hover:bg-red-600
                  "
                >
                  {deletingTeam ? 'Deleting Team...' : 'Delete Team'}
                </Button>

                {deleteError && (
                  <p className="mt-2 text-sm text-red-400">
                    {deleteError}
                  </p>
                )}
              </div>
            )}

            <Card>
              <div className="space-y-2">

                <p>
                  <span className="text-[var(--text-secondary)]">
                    Manager:
                  </span>{' '}
                  {team.manager?.username || 'Unknown'}
                </p>

                <p>
                  <span className="text-[var(--text-secondary)]">
                    Your role:
                  </span>{' '}
                  {user?.role}
                </p>

                {user?.role === 'user' && (
                  <div className="pt-4">
                    <Button
                      onClick={handleLeaveTeam}
                      disabled={leaving}
                      className="
                        bg-red-500/80
                        hover:bg-red-500
                      "
                    >
                      {leaving ? 'Leaving...' : 'Leave Team'}
                    </Button>
                  </div>
                )}

                {leaveError && (
                  <p className="mt-3 text-sm text-red-400">
                    {leaveError}
                  </p>
                )}

              </div>
            </Card>

            <Card>
              <div className="space-y-4">

                <div>
                  <h2 className="text-xl font-semibold">
                    Members
                  </h2>

                  <p className="text-sm text-[var(--text-secondary)]">
                    {loadingMembers
                      ? 'Loading members...'
                      : `${members.length} member${members.length === 1 ? '' : 's'}`
                    }
                  </p>

                  {roleError && (
                    <p className="mt-2 text-sm text-red-400">
                      {roleError}
                    </p>
                  )}

                  {removeError && (
                    <p className="mt-2 text-sm text-red-400">
                      {removeError}
                    </p>
                  )}
                </div>

                <div className="space-y-3">

                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="
                        flex
                        flex-col
                        gap-3
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        px-4
                        py-3
                        transition
                        hover:bg-white/10
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >

                      <div className="min-w-0 flex items-center gap-3">

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-gradient-to-br
                            from-violet-500
                            to-blue-500
                            text-sm
                            font-semibold
                            text-white
                          "
                        >
                          {member.username?.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-primary)]">
                            {member.username}
                          </p>

                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {member.email}
                          </p>
                        </div>

                      </div>

                      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">

                        <span
                          className="
                            shrink-0
                            rounded-full
                            border
                            border-white/10
                            bg-white/5
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-[var(--text-secondary)]
                          "
                        >
                          {member.role}
                        </span>

                        {user?.role === 'manager' &&
                          member.role === 'user' &&
                          member.id !== user.id && (
                            <Button
                              type="button"
                              onClick={() => handleMakeMember(member.id)}
                              disabled={updatingRole}
                              className="w-auto px-3 py-1.5 text-xs"
                            >
                              {updatingRole ? 'Updating...' : 'Make Member'}
                            </Button>
                          )}

                        {user?.role === 'manager' &&
                          member.id !== user.id && (
                            <Button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(
                                  member.id,
                                  member.username
                                )
                              }
                              disabled={removingMember}
                              className="
                                w-auto
                                bg-red-500/80
                                px-3
                                py-1.5
                                text-xs
                                hover:bg-red-500
                              "
                            >
                              {removingMember ? 'Removing...' : 'Remove'}
                            </Button>
                          )}

                      </div>

                    </div>
                  ))}

                </div>
              </div>
            </Card>

          </>
        )}

      </div>
    </AppLayout>
  )
}

export default Team