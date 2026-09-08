import { api } from './auth.api'

export const getMyTasks = async () => {
  const response = await api.get('/tasks/me')
  return response.data
}

export const getTeamTasks = async (teamId) => {
  const response = await api.get(`/teams/${teamId}/tasks`)
  return response.data
}

export const createTask = async (teamId, data) => {
  const response = await api.post(
    `/teams/${teamId}/tasks`,
    data
  )

  return response.data
}

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(
    `/tasks/${taskId}/status`,
    { status }
  )

  return response.data
}

export const deleteTask = async (taskId) => {
  await api.delete(`/tasks/${taskId}`)
}