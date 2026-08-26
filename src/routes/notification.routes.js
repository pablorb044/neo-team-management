import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { NotificationController } from '../controllers/notification.controller.js'

export const notificationRouter = Router()

notificationRouter.get(
  '/',
  authMiddleware,
  NotificationController.getMyNotifications
)

notificationRouter.get(
  '/unread',
  authMiddleware,
  NotificationController.getMyUnreadNotifications
)

notificationRouter.get(
  '/unread/count',
  authMiddleware,
  NotificationController.getUnreadCount
)

notificationRouter.get(
  '/team',
  authMiddleware,
  NotificationController.getTeamActivity
)

notificationRouter.patch(
  '/:id/read',
  authMiddleware,
  NotificationController.markAsRead
)

notificationRouter.patch(
  '/read-all',
  authMiddleware,
  NotificationController.markAllAsRead
)