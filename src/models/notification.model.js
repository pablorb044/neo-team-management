import { prisma } from '../lib/prisma.js'

export class NotificationModel {

  static async create({
    userId,
    type,
    message,
    taskId
  }) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        message,
        taskId
      }
    })
  }

  static async getByUser(userId) {
    return prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 8
    })
  }

  static async getUnreadByUser(userId) {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async countUnreadByUser(userId) {
    return prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })
  }

  static async getTeamActivity(teamId) {
    return prisma.notification.findMany({
      where: {
        type: {
          in: [
            'TASK_ASSIGNED',
            'TASK_SUBMITTED',
            'TASK_COMPLETED'
          ]
        },
        task: {
          teamId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            assignedTo: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 4
    })
  }

  static async markAsRead(id, userId) {
    return prisma.notification.updateMany({
      where: {
        id,
        userId
      },
      data: {
        read: true
      }
    })
  }

  static async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    })
  }

}