import { api } from './auth.api'

export const getNotifications = async () => {
  const response = await api.get('/notifications')
  return response.data
}

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread/count')
  return response.data
}

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`
  )

  return response.data
}

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(
    '/notifications/read-all'
  )

  return response.data
}

export const getTeamActivity = async () => {
  const response = await api.get('/notifications/team')
  return response.data
}