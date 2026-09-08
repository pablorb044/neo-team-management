import { prisma } from '../lib/prisma.js'

export class TaskModel {

  static async create({
    title,
    description,
    teamId,
    assignedToId
  }) {
    return prisma.task.create({
      data: {
        title,
        description,
        teamId,
        assignedToId
      }
    })
  }

  static async getById(id) {
    return prisma.task.findUnique({
      where: {
        id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            managerId: true
          }
        }
      }
    })
  }

  static async getByTeam(teamId) {
    return prisma.task.findMany({
      where: {
        teamId
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getByAssignee(assignedToId) {
    return prisma.task.findMany({
      where: {
        assignedToId
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async update(id, { title, description, assignedToId }) {
    return prisma.task.update({
      where: {
        id
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assignedToId !== undefined && { assignedToId })
      }
    })
  }

  static async updateStatus(id, status) {
    return prisma.task.update({
      where: {
        id
      },
      data: {
        status
      }
    })
  }

  static async delete(id) {
    return prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({
        where: {
          taskId: id
        }
      })

      return tx.task.delete({
        where: {
          id
        }
      })
    })
  }

}