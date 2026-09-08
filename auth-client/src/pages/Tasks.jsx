import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { getTeamMembers } from '../services/team.api'

function Tasks() {
  const { user } = useAuth()

  const {
    tasks,
    loading,
    error,
    createNewTask,
    changeTaskStatus,
    removeTask
  } = useTasks()

  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedToId, setAssignedToId] = useState('')

  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const [completedVisible, setCompletedVisible] = useState(5)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  const [deletingTaskId, setDeletingTaskId] = useState(null)

  useEffect(() => {
    const loadMembers = async () => {
      if (user?.role !== 'manager' || !user?.teamId) {
        return
      }

      try {
        setMembersLoading(true)

        const data = await getTeamMembers(user.teamId)

        setMembers(
          data.filter(member => member.role === 'MEMBER')
        )
      } catch {
        setFormError('Error al cargar los miembros del equipo')
      } finally {
        setMembersLoading(false)
      }
    }

    loadMembers()
  }, [user])

  const handleCreateTask = async (event) => {
    event.preventDefault()

    if (!title.trim() || !assignedToId) {
      setFormError('Title and assignee are required')
      return
    }

    try {
      setCreating(true)
      setFormError('')

      await createNewTask({
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId
      })

      setTitle('')
      setDescription('')
      setAssignedToId('')
    } catch (error) {
      setFormError(
        error.response?.data?.error ||
        'Error al crear la tarea'
      )
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (taskId, status) => {
    if (updatingTaskId) {
      return
    }

    try {
      setUpdatingTaskId(taskId)
      await changeTaskStatus(taskId, status)
    } catch {
      // Error is already handled by useTasks.
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleDeleteTask = async (taskId, title) => {
    if (deletingTaskId) {
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingTaskId(taskId)
      await removeTask(taskId)
    } catch {
      // Error is already handled by useTasks.
    } finally {
      setDeletingTaskId(null)
    }
  }

  const getNextAction = (task) => {
    if (user?.role === 'MEMBER') {
      if (task.status === 'SENT') {
        return {
          label: 'Start task',
          status: 'WORKING'
        }
      }

      if (task.status === 'WORKING') {
        return {
          label: 'Submit task',
          status: 'SUBMITTED'
        }
      }
    }

    if (
      user?.role === 'manager' &&
      task.status === 'SUBMITTED'
    ) {
      return {
        label: 'Complete task',
        status: 'DONE'
      }
    }

    return null
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'SENT':
        return {
          label: 'Sent',
          className:
            'border-violet-400/20 bg-violet-500/10 text-violet-300'
        }

      case 'WORKING':
        return {
          label: 'Working',
          className:
            'border-blue-400/20 bg-blue-500/10 text-blue-300'
        }

      case 'SUBMITTED':
        return {
          label: 'Ready for review',
          className:
            'border-yellow-400/20 bg-yellow-500/10 text-yellow-300'
        }

      case 'DONE':
        return {
          label: 'Done',
          className:
            'border-green-400/20 bg-green-500/10 text-green-300'
        }

      default:
        return {
          label: status,
          className:
            'border-white/10 bg-white/5 text-[var(--text-secondary)]'
        }
    }
  }

  const activeTasks = tasks.filter(
    task => task.status !== 'DONE'
  )

  const completedTasks = tasks.filter(
    task => task.status === 'DONE'
  )

  const visibleCompletedTasks = completedTasks.slice(
    0,
    completedVisible
  )

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">

        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Tasks
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            {user?.role === 'manager'
              ? 'Team Tasks'
              : 'My Tasks'}
          </h1>
        </div>

        {user?.role === 'manager' && (
          <Card>
            <form
              onSubmit={handleCreateTask}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  Create task
                </h2>

                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Assign a new task to a team member.
                </p>
              </div>

              {formError && (
                <p className="text-sm text-red-400">
                  {formError}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm">
                    Title
                  </label>

                  <input
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="Task title"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-white/10
                      bg-white/5
                      px-3
                      py-2
                      text-sm
                      outline-none
                      focus:border-white/20
                    "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Assign to
                  </label>

                  <select
                    value={assignedToId}
                    onChange={(event) =>
                      setAssignedToId(event.target.value)
                    }
                    disabled={membersLoading}
                    className="
                      w-full
                      rounded-lg
                      border
                      border-white/10
                      bg-[var(--bg-secondary)]
                      px-3
                      py-2
                      text-sm
                      outline-none
                      focus:border-white/20
                    "
                  >
                    <option value="">
                      {membersLoading
                        ? 'Loading members...'
                        : 'Select a member'}
                    </option>

                    {members.map(member => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.username}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Task description"
                  rows={4}
                  className="
                    w-full
                    rounded-lg
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    py-2
                    text-sm
                    outline-none
                    focus:border-white/20
                  "
                />
              </div>

              <button
                type="submit"
                disabled={creating || membersLoading}
                className="
                  rounded-lg
                  bg-gradient-to-r
                  from-violet-600/80
                  to-purple-600/80
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[var(--text-primary)]
                  shadow-lg
                  shadow-violet-900/20
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {creating ? 'Creating...' : 'Create task'}
              </button>
            </form>
          </Card>
        )}

        {error && (
          <Card>
            <p className="text-sm text-red-400">
              {error}
            </p>
          </Card>
        )}

        {loading ? (
  <div className="flex min-h-[300px] items-center justify-center">
    <p className="text-sm text-[var(--text-secondary)]">
      Loading tasks...
    </p>
  </div>
) : tasks.length === 0 ? (
  <Card>
    <p className="text-sm text-[var(--text-secondary)]">
      No tasks found.
    </p>
  </Card>
) : (
  <div className="space-y-8">

    {activeTasks.length > 0 && (
      <section className="space-y-4">

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Current work
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Active Tasks
            </h2>
          </div>

          <span className="text-sm text-[var(--text-secondary)]">
            {activeTasks.length}
          </span>
        </div>

        <div className="space-y-4">
          {activeTasks.map(task => {
            const nextAction = getNextAction(task)
            const statusStyle = getStatusStyle(task.status)

            return (
              <Card key={task.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="space-y-3">

                    <div>
                      <h2 className="text-lg font-semibold">
                        {task.title}
                      </h2>

                      {task.description && (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">

                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)]">
                          Status:
                        </span>

                        <span
                          className={`
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            ${statusStyle.className}
                          `}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      {user?.role === 'manager' && (
                        <p>
                          <span className="text-[var(--text-secondary)]">
                            Assigned to:
                          </span>{' '}
                          {task.assignedTo?.username || 'Unknown'}
                        </p>
                      )}

                      {task.team && (
                        <p>
                          <span className="text-[var(--text-secondary)]">
                            Team:
                          </span>{' '}
                          {task.team.name}
                        </p>
                      )}

                    </div>

                    {task.status === 'SUBMITTED' && (
                      <p className="text-xs font-medium text-yellow-300">
                        {user?.role === 'manager'
                          ? 'Ready for manager review.'
                          : 'Waiting for manager review.'}
                      </p>
                    )}

                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                  {nextAction && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          task.id,
                          nextAction.status
                        )
                      }
                      disabled={
                        updatingTaskId !== null ||
                        deletingTaskId !== null
                      }
                      className="
                        rounded-lg
                        bg-gradient-to-r
                        from-violet-600/80
                        to-purple-600/80
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-[var(--text-primary)]
                        shadow-lg
                        shadow-violet-900/20
                        transition
                        hover:opacity-90
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {updatingTaskId === task.id
                        ? 'Updating...'
                        : nextAction.label}
                    </button>
                  )}

                  {user?.role === 'manager' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteTask(task.id, task.title)
                      }
                      disabled={
                        updatingTaskId !== null ||
                        deletingTaskId !== null
                      }
                      className="
                        rounded-lg
                        border
                        border-red-400/20
                        bg-red-500/10
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-red-300
                        transition
                        hover:bg-red-500/20
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {deletingTaskId === task.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  )}
                </div>

                </div>
              </Card>
            )
          })}
        </div>

      </section>
    )}

    {completedTasks.length > 0 && (
      <section className="space-y-4">

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Finished work
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Completed
            </h2>
          </div>

          <span className="text-sm text-[var(--text-secondary)]">
            {completedTasks.length}
          </span>
        </div>

        <div className="space-y-4">
          {visibleCompletedTasks.map(task => {
            const statusStyle = getStatusStyle(task.status)

            return (
              <Card key={task.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                  <div className="space-y-2">

                    <h2 className="text-lg font-semibold">
                      {task.title}
                    </h2>

                    {task.description && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">

                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)]">
                          Status:
                        </span>

                        <span
                          className={`
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            ${statusStyle.className}
                          `}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      {user?.role === 'manager' && (
                        <p>
                          <span className="text-[var(--text-secondary)]">
                            Assigned to:
                          </span>{' '}
                          {task.assignedTo?.username || 'Unknown'}
                        </p>
                      )}

                      {task.team && (
                        <p>
                          <span className="text-[var(--text-secondary)]">
                            Team:
                          </span>{' '}
                          {task.team.name}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              </Card>
            )
          })}
        </div>

        {completedVisible < completedTasks.length && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() =>
                setCompletedVisible(
                  current => current + 5
                )
              }
              className="
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-4
                py-2
                text-sm
                font-medium
                text-[var(--text-secondary)]
                transition
                hover:bg-white/10
                hover:text-[var(--text-primary)]
              "
            >
              Show more
            </button>
          </div>
        )}

      </section>
    )}

    {activeTasks.length === 0 && completedTasks.length === 0 && (
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          No tasks found.
        </p>
      </Card>
    )}

  </div>
)}

      </div>
    </AppLayout>
  )
}

export default Tasks