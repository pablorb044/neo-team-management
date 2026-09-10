import { prisma } from '../lib/prisma.js'

export class TeamJoinRequestModel {

  static async create({ userId, teamId }) {
    const existingRequest = await prisma.teamJoinRequest.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    })

    if (existingRequest) {
      if (
        existingRequest.status === 'approved' ||
        existingRequest.status === 'rejected'
      ) {
        return prisma.teamJoinRequest.update({
          where: {
            id: existingRequest.id
          },
          data: {
            status: 'pending'
          }
        })
      }

      return existingRequest
    }

    return prisma.teamJoinRequest.create({
      data: {
        userId,
        teamId
      }
    })
  }

  static async getById(id) {
    return prisma.teamJoinRequest.findUnique({
      where: {
        id
      }
    })
  }

  static async getByUserAndTeam(userId, teamId) {
    return prisma.teamJoinRequest.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    })
  }

  static async getPendingByUserAndTeam(userId, teamId) {
    return prisma.teamJoinRequest.findFirst({
      where: {
        userId,
        teamId,
        status: 'pending'
      }
    })
  }

  static async getPendingByTeam(teamId) {
    return prisma.teamJoinRequest.findMany({
      where: {
        teamId,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  static async approve(id, userId, teamId) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.teamJoinRequest.update({
        where: {
          id
        },
        data: {
          status: 'approved'
        }
      })

    await tx.user.update({
      where: {
        id: userId
      },
      data: {
        teamId
      }
    })

      return request
    })
  }

  static async reject(id) {
    return prisma.teamJoinRequest.update({
      where: {
        id
      },
      data: {
        status: 'rejected'
      }
    })
  }

}