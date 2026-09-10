import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

describe('Team Join Requests', () => {

beforeEach(async () => {
  await prisma.notification.deleteMany()
  await prisma.task.deleteMany()
  await prisma.teamJoinRequest.deleteMany()
  await prisma.team.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()
})


it('should create a team join request', async () => {

  // Crear manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Crear organización + team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Crear usuario que quiere entrar
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Solicitar entrada
  const response = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  expect(response.status).toBe(201)
  expect(response.body.userId).toBeDefined()
  expect(response.body.teamId).toBe(teamId)
  expect(response.body.status).toBe('pending')
})

it('should allow a user to request the same team again after leaving', async () => {
  // Crear manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Crear organización + team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Crear usuario
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Primera solicitud
  const firstRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  expect(firstRequest.status).toBe(201)
  expect(firstRequest.body.status).toBe('pending')

  // Manager aprueba
  const approveResponse = await request(app)
    .patch(`/team-join-requests/${firstRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(approveResponse.status).toBe(200)
  expect(approveResponse.body.status).toBe('approved')

  // Usuario abandona el Team
  const leaveResponse = await request(app)
    .delete(`/teams/${teamId}/members/me`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(leaveResponse.status).toBe(200)

  // Usuario vuelve a solicitar entrar
  const secondRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  expect(secondRequest.status).toBe(201)
  expect(secondRequest.body.id).toBe(firstRequest.body.id)
  expect(secondRequest.body.status).toBe('pending')
})

it('should reject duplicate pending team join request', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Usuario
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Primera solicitud
  await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  // Segunda solicitud
  const response = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  expect(response.status).toBe(400)
  expect(response.body.error).toBe('Join request already pending')
})

it('should reject join request for nonexistent team', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const token = loginResponse.body.token

  const response = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${token}`)
    .send({
      teamId: '00000000-0000-0000-0000-000000000000'
    })

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Team not found')
})

it('should reject join request when user already belongs to team', async () => {

  // Crear manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // El manager ya pertenece al team como manager
  const response = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      teamId
    })

  expect(response.status).toBe(400)
  expect(response.body.error).toBe('User already belongs to this team')
})

it('should reject team join request without authentication', async () => {

  const response = await request(app)
    .post('/team-join-requests')
    .send({
      teamId: '00000000-0000-0000-0000-000000000000'
    })

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('No token provided')
})

it('should return pending team join requests for manager', async () => {

  // Crear manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Crear organization + team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Crear usuario
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Crear join request
  await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  // Manager consulta solicitudes
  const response = await request(app)
    .get('/team-join-requests')
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(200)
  expect(response.body).toHaveLength(1)
  expect(response.body[0].teamId).toBe(teamId)
  expect(response.body[0].userId).toBeDefined()
  expect(response.body[0].status).toBe('pending')
})

it('should reject viewing team join requests for non-manager', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const token = loginResponse.body.token

  const response = await request(app)
    .get('/team-join-requests')
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('Only team managers can view join requests')
})

it('should approve a team join request', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Request
  const joinRequestResponse = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  const requestId = joinRequestResponse.body.id

  // Approve
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(200)
  expect(response.body.status).toBe('approved')

  // Comprobar membership
  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  expect(user.teamId).toBe(teamId)
  expect(user.role).toBe('user')
})

it('should reject approving a join request for non-manager', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Join request
  const joinRequestResponse = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  const requestId = joinRequestResponse.body.id

  // Employee intenta aprobar
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/approve`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('Only the team manager can approve this request')
})

it('should reject approving a join request that is no longer pending', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Join request
  const joinRequestResponse = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  const requestId = joinRequestResponse.body.id

  // First approval
  await request(app)
    .patch(`/team-join-requests/${requestId}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  // Second approval
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(400)
  expect(response.body.error)
    .toBe('Join request is not pending')
})

it('should reject manager from another team approving a join request', async () => {

  // Manager 1
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager1',
      email: 'manager1@test.com',
      password: '123456'
    })

  const manager1Login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager1@test.com',
      password: '123456'
    })

  const manager1Token = manager1Login.body.token

  // Team 1
  const organization1Response = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager1Token}`)
    .send({
      organizationName: 'Acme 1',
      teamName: 'Engineering'
    })

  const team1Id = organization1Response.body.team.id

  // Manager 2
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager2',
      email: 'manager2@test.com',
      password: '123456'
    })

  const manager2Login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager2@test.com',
      password: '123456'
    })

  const manager2Token = manager2Login.body.token

  // Team 2
  await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      organizationName: 'Acme 2',
      teamName: 'Marketing'
    })

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Request para Team 1
  const joinRequestResponse = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId: team1Id
    })

  const requestId = joinRequestResponse.body.id

  // Manager 2 intenta aprobar una request de Team 1
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/approve`)
    .set('Authorization', `Bearer ${manager2Token}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('Only the team manager can approve this request')
})


it('should reject a team join request', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Request
  const joinRequestResponse = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  const requestId = joinRequestResponse.body.id

  // Reject
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/reject`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(200)
  expect(response.body.status).toBe('rejected')
})

it('should reject rejecting a join request for non-manager', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  const joinRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ teamId })

  const requestId = joinRequest.body.id

  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/reject`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('Only the team manager can reject this request')
})

it('should reject rejecting a join request that is no longer pending', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Join request
  const joinRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  const requestId = joinRequest.body.id

  // First reject
  await request(app)
    .patch(`/team-join-requests/${requestId}/reject`)
    .set('Authorization', `Bearer ${managerToken}`)

  // Second reject
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/reject`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(400)
  expect(response.body.error)
    .toBe('Join request is not pending')
})

it('should reject manager from another team rejecting a join request', async () => {

  // Manager 1
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager1',
      email: 'manager1@test.com',
      password: '123456'
    })

  const manager1Login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager1@test.com',
      password: '123456'
    })

  const manager1Token = manager1Login.body.token

  // Team 1
  const organization1Response = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager1Token}`)
    .send({
      organizationName: 'Acme 1',
      teamName: 'Engineering'
    })

  const team1Id = organization1Response.body.team.id

  // Manager 2
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager2',
      email: 'manager2@test.com',
      password: '123456'
    })

  const manager2Login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager2@test.com',
      password: '123456'
    })

  const manager2Token = manager2Login.body.token

  // Team 2
  await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      organizationName: 'Acme 2',
      teamName: 'Marketing'
    })

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const userToken = userLogin.body.token

  // Request para Team 1
  const joinRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId: team1Id
    })

  const requestId = joinRequest.body.id

  // Manager 2 intenta rechazar una request de Team 1
  const response = await request(app)
    .patch(`/team-join-requests/${requestId}/reject`)
    .set('Authorization', `Bearer ${manager2Token}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('Only the team manager can reject this request')
})

  afterAll(async () => {
    await prisma.$disconnect()
  })

})

