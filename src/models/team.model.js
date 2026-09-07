import { prisma } from '../lib/prisma.js'

export class TeamModel {

  static async create({ name, organizationId, managerId }) {
    return prisma.team.create({
      data: {
        name,
        organizationId,
        managerId
      }
    })
  }

  static async getById(id) {
    return prisma.team.findUnique({
      where: {
        id
      }
    })
  }

  static async getByOrganizationId(organizationId) {
    return prisma.team.findUnique({
      where: {
        organizationId
      }
    })
  }

  static async getByManagerId(managerId) {
    return prisma.team.findUnique({
      where: {
        managerId
      }
    })
  }

  static async getWithManager(teamId) {
    return prisma.team.findUnique({
      where: {
        id: teamId
      },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      }
    })
  }

  static async getMembers(teamId) {
    return prisma.user.findMany({
      where: {
        teamId
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  static async removeMember(userId) {
    return prisma.user.update({
      where: {
        id: userId
      },
      data: {
        teamId: null,
        role: 'user'
      }
    })
  }

  static async removeMemberFromTeam(teamId, userId) {
    return prisma.user.updateMany({
      where: {
        id: userId,
        teamId
      },
      data: {
        teamId: null,
        role: 'user'
      }
    })
  }

  static async updateMemberRole(userId, role) {
    return prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role
      }
    })
  }

  static async update(id, { name }) {
    return prisma.team.update({
      where: {
        id
      },
      data: {
        name
      }
    })
  }

static async deleteTeam(teamId) {
  return prisma.$transaction(async (tx) => {
    await tx.teamJoinRequest.deleteMany({
      where: {
        teamId
      }
    })

    await tx.notification.deleteMany({
      where: {
        task: {
          teamId
        }
      }
    })

    await tx.notification.deleteMany({
      where: {
        task: {
          teamId
        }
      }
    })

    await tx.task.deleteMany({
      where: {
        teamId
      }
    })

    const users = await tx.user.findMany({
      where: {
        teamId
      },
      select: {
        id: true,
        role: true
      }
    })

    await tx.user.updateMany({
      where: {
        teamId
      },
      data: {
        teamId: null,
        role: 'user'
      }
    })

    const manager = users.find(user => user.role === 'manager')

    if (manager) {
      await tx.user.update({
        where: {
          id: manager.id
        },
        data: {
          role: 'user'
        }
      })
    }

    return tx.team.delete({
      where: {
        id: teamId
      }
    })
  })
}

}