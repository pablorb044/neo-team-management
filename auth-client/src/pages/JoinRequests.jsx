import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useDashboard } from '../hooks/useDashboard'
import {
  getPendingTeamJoinRequests,
  approveTeamJoinRequest,
  rejectTeamJoinRequest
} from '../services/team-join-request.api'

function JoinRequests() {
  const { user, team, loading: dashboardLoading, error: dashboardError } =
    useDashboard()

  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!team?.id || user?.role !== 'manager') {
      return
    }

    const loadRequests = async () => {
      try {
        setLoadingRequests(true)
        setError('')

        const data = await getPendingTeamJoinRequests()
        setRequests(data)
      } catch (error) {
        setError(
          error.response?.data?.error ||
          'Error loading join requests'
        )
      } finally {
        setLoadingRequests(false)
      }
    }

    loadRequests()
  }, [team?.id, user?.role])

  const handleApprove = async (requestId) => {
    if (processingId) {
      return
    }

    try {
      setProcessingId(requestId)
      setError('')
      setSuccessMessage('')

      await approveTeamJoinRequest(requestId)

      setRequests((current) =>
        current.filter((request) => request.id !== requestId)
      )
      setSuccessMessage(
        'Join request approved successfully.'
      )
    } catch (error) {
      setError(
        error.response?.data?.error ||
        'Error approving join request'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    if (processingId) {
      return
    }

    try {
      setProcessingId(requestId)
      setError('')
      setSuccessMessage('')
      await rejectTeamJoinRequest(requestId)

      setRequests((current) =>
        current.filter((request) => request.id !== requestId)
      )
      setSuccessMessage(
        'Join request rejected successfully.'
      )
    } catch (error) {
      setError(
        error.response?.data?.error ||
        'Error rejecting join request'
      )
    } finally {
      setProcessingId(null)
    }
  }

  if (dashboardLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Loading join requests...
          </p>
        </div>
      </AppLayout>
    )
  }

  if (!user || user.role !== 'manager') {
    return (
      <AppLayout>
        <Card>
          <p className="text-[var(--text-secondary)]">
            You do not have permission to view join requests.
          </p>
        </Card>
      </AppLayout>
    )
  }

  const errorMessage = dashboardError || error

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Team
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Join Requests
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {team?.name || 'No Team'}
          </p>
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
            <p className="text-[var(--text-secondary)]">
              You are not currently managing a Team.
            </p>
          </Card>
        ) : requests.length === 0 && !loadingRequests ? (
          <Card>
            <p className="text-[var(--text-secondary)]">
              There are no pending join requests.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Pending requests
                </h2>

                <p className="text-sm text-[var(--text-secondary)]">
                  {loadingRequests
                    ? 'Loading requests...'
                    : `${requests.length} request${requests.length === 1 ? '' : 's'}`
                  }
                </p>
              </div>

              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      px-4
                      py-3
                    "
                  >
                    <div>
                      <p className="font-medium">
                        {request.user?.username || 'Unknown user'}
                      </p>

                      <p className="text-sm text-[var(--text-secondary)]">
                        {request.user?.email || 'Unknown email'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId !== null}
                        className="w-auto px-3 py-2 text-xs"
                      >
                        {processingId === request.id
                          ? 'Processing...'
                          : 'Approve'}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId !== null}
                        className="
                          w-auto
                          bg-red-500/80
                          px-3
                          py-2
                          text-xs
                          hover:bg-red-500
                        "
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

export default JoinRequests