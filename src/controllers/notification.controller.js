import { NotificationModel } from '../models/notification.model.js'
import { UserModel } from '../models/user.model.js'

export class NotificationController {

  static async getMyNotifications(req, res) {
    try {
      const notifications =
        await NotificationModel.getByUser(req.user.id)

      return res.status(200).json(notifications)

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async getMyUnreadNotifications(req, res) {
    try {
      const notifications =
        await NotificationModel.getUnreadByUser(req.user.id)

      return res.status(200).json(notifications)

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const count =
        await NotificationModel.countUnreadByUser(req.user.id)

      return res.status(200).json({
        count
      })

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async getTeamActivity(req, res) {
    try {
      const user = await UserModel.getById(req.user.id)

      if (!user?.teamId) {
        return res.status(200).json([])
      }

      const activity =
        await NotificationModel.getTeamActivity(
          user.teamId
        )

      return res.status(200).json(activity)

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params

      const result =
        await NotificationModel.markAsRead(
          id,
          req.user.id
        )

      if (result.count === 0) {
        return res.status(404).json({
          error: 'Notification not found'
        })
      }

      return res.status(200).json({
        success: true
      })

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async markAllAsRead(req, res) {
    try {
      await NotificationModel.markAllAsRead(
        req.user.id
      )

      return res.status(200).json({
        success: true
      })

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

}