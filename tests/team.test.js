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

it('should return team for a team member', async () => {

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

  const response = await request(app)
    .get(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(200)
  expect(response.body.id).toBe(teamId)
  expect(response.body.name).toBe('Engineering')
  expect(response.body.manager.username).toBe('Manager')
})

it('should reject getting a nonexistent team', async () => {

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
    .get('/teams/00000000-0000-0000-0000-000000000000')
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Team not found')
})

it('should reject getting a team for a user from another team', async () => {

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

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager1Token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Usuario externo
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

  const response = await request(app)
    .get(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error).toBe('You do not belong to this team')
})

it('should reject getting a team without authentication', async () => {

  const response = await request(app)
    .get('/teams/00000000-0000-0000-0000-000000000000')

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('No token provided')
})

it('should return team members', async () => {

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

  // Employee solicita entrar
  const joinRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ teamId })

  // Manager aprueba
  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  const response = await request(app)
    .get(`/teams/${teamId}/members`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(200)
  expect(response.body).toHaveLength(2)

  expect(response.body.map(member => member.username))
    .toContain('Manager')

  expect(response.body.map(member => member.username))
    .toContain('Pablo')
})

it('should reject getting members from a nonexistent team', async () => {

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
    .get('/teams/00000000-0000-0000-0000-000000000000/members')
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Team not found')
})

it('should reject getting members for a user from another team', async () => {

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

  // Usuario externo
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

  const response = await request(app)
    .get(`/teams/${teamId}/members`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error).toBe('You do not belong to this team')
})

it('should reject getting team members without authentication', async () => {

  const response = await request(app)
    .get('/teams/00000000-0000-0000-0000-000000000000/members')

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('No token provided')
})

it('should allow a team member to leave the team', async () => {

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
    .send({ teamId })

  // Approve
  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  // Leave
  const response = await request(app)
    .delete(`/teams/${teamId}/members/me`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(200)
  expect(response.body.message).toBe('Left team successfully')

  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  expect(user.teamId).toBeNull()
  expect(user.role).toBe('user')
})

it('should reject leaving a team that the user does not belong to', async () => {

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

  // Usuario externo
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

  const response = await request(app)
    .delete(`/teams/${teamId}/members/me`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error).toBe('You do not belong to this team')
})

it('should reject manager from leaving their own team', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .delete(`/teams/${teamId}/members/me`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(400)
  expect(response.body.error).toBe('Team manager cannot leave the team')
})

it('should allow manager to remove a team member', async () => {

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

  // Member
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

  // Join
  const joinRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ teamId })

  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  // Remove
  const response = await request(app)
    .delete(`/teams/${teamId}/members/${user.id}`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(200)
  expect(response.body.message).toBe('Member removed successfully')

  const updatedUser = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  })

  expect(updatedUser.teamId).toBeNull()
  expect(updatedUser.role).toBe('user')
})

it('should reject removing a member for non-manager', async () => {

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

  // Second user
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

  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  const response = await request(app)
    .delete(`/teams/${teamId}/members/${user.id}`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('Only the team manager can remove members')
})

it('should reject removing a nonexistent team member', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .delete(`/teams/${teamId}/members/00000000-0000-0000-0000-000000000000`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(404)
  expect(response.body.error)
    .toBe('User is not a member of this team')
})

it('should reject manager from removing themselves', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const manager = await prisma.user.findUnique({
    where: {
      email: 'manager@test.com'
    }
  })

  const response = await request(app)
    .delete(`/teams/${teamId}/members/${manager.id}`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(400)
  expect(response.body.error)
    .toBe('Team manager cannot be removed')
})

it('should allow manager to update a team member role', async () => {
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

  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  const response = await request(app)
    .patch(`/teams/${teamId}/members/${user.id}/role`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(200)
  expect(response.body.message).toBe('Member role updated successfully')
})

it('should reject updating member role for non-manager', async () => {
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

  const response = await request(app)
    .patch(`/teams/${teamId}/members/fake-user-id/role`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe(
    'Only the team manager can update member roles'
  )
})

it('should reject updating a nonexistent team', async () => {
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const token = loginResponse.body.token

  const response = await request(app)
    .patch('/teams/nonexistent-team/members/fake-user/role')
    .set('Authorization', `Bearer ${token}`)
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Team not found')
})

it('should reject invalid member role', async () => {
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const token = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .patch(`/teams/${teamId}/members/fake-user/role`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      role: 'ADMIN'
    })

  expect(response.status).toBe(400)
  expect(response.body.error).toBe('Invalid role')
})

it('should reject updating member role without authentication', async () => {
  const response = await request(app)
    .patch('/teams/fake-team/members/fake-user/role')
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(401)
})

it('should reject manager from updating their own role', async () => {
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const manager = await prisma.user.findUnique({
    where: {
      email: 'manager@test.com'
    }
  })

  const response = await request(app)
    .patch(`/teams/${teamId}/members/${manager.id}/role`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(400)
  expect(response.body.error).toBe(
    'Team manager role cannot be changed'
  )
})

it('should reject updating a user who is not a team member', async () => {
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

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

  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  const response = await request(app)
    .patch(`/teams/${teamId}/members/${user.id}/role`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(404)
  expect(response.body.error).toBe(
    'User is not a member of this team'
  )
})

it('should reject manager from another team updating a member role', async () => {
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

  const organization1 = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager1Token}`)
    .send({
      organizationName: 'Acme1',
      teamName: 'Engineering1'
    })

  const team1Id = organization1.body.team.id

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

  await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      organizationName: 'Acme2',
      teamName: 'Engineering2'
    })

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
    .send({
      teamId: team1Id
    })

  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${manager1Token}`)

  const user = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  const response = await request(app)
    .patch(`/teams/${team1Id}/members/${user.id}/role`)
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      role: 'MEMBER'
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe(
    'Only the team manager can update member roles'
  )
})

it('should allow the team manager to update the team name', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .patch(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Backend'
    })

  expect(response.status).toBe(200)
  expect(response.body.name).toBe('Backend')
})


it('should reject updating a team for a non-manager member', async () => {

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

  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  const response = await request(app)
    .patch(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Backend'
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe('Only the team manager can update it')
})


it('should reject updating a team from another team', async () => {

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
      username: 'OtherManager',
      email: 'other@test.com',
      password: '123456'
    })

  const otherLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'other@test.com',
      password: '123456'
    })

  const otherToken = otherLogin.body.token

  const otherOrganization = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${otherToken}`)
    .send({
      organizationName: 'Other',
      teamName: 'OtherTeam'
    })

  expect(otherOrganization.status).toBe(201)

  const response = await request(app)
    .patch(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .send({
      name: 'Backend'
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe('You do not belong to this team')
})


it('should reject updating a nonexistent team', async () => {

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
    .patch('/teams/nonexistent-team-id')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Backend'
    })

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Team not found')
})


it('should reject updating a team with an invalid name', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .patch(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'A'
    })

  expect(response.status).toBe(400)
  expect(response.body.errors).toBeDefined()
})

it('should allow the team manager to delete the team', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Delete Org',
      teamName: 'Delete Team'
    })

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .delete(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(200)
  expect(response.body.message).toBe('Team deleted successfully')
})

it('should reject deleting a team for a non-manager member', async () => {

  // Manager
  await request(app)
    .post('/auth/register')
    .send({
      username: 'DeleteManager',
      email: 'delete-manager@test.com',
      password: '123456'
    })

  const managerLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'delete-manager@test.com',
      password: '123456'
    })

  const managerToken = managerLogin.body.token

  // Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Delete Org',
      teamName: 'Delete Team'
    })

  const teamId = organizationResponse.body.team.id

  // Employee
  await request(app)
    .post('/auth/register')
    .send({
      username: 'DeleteMember',
      email: 'delete-member@test.com',
      password: '123456'
    })

  const userLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'delete-member@test.com',
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

  // Approve
  const approveResponse = await request(app)
    .patch(`/team-join-requests/${requestId}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(approveResponse.status).toBe(200)

  // Delete attempt as member
  const response = await request(app)
    .delete(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${userToken}`)

  expect(response.status).toBe(403)
})

it('should reject deleting a team from another team', async () => {

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

  const organization1 = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager1Token}`)
    .send({
      organizationName: 'Acme 1',
      teamName: 'Engineering'
    })

  const team1Id = organization1.body.team.id

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

  const organization2 = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      organizationName: 'Acme 2',
      teamName: 'Marketing'
    })

  const team2Id = organization2.body.team.id

  const response = await request(app)
    .delete(`/teams/${team1Id}`)
    .set('Authorization', `Bearer ${manager2Token}`)

  expect(response.status).toBe(403)

  const teamResponse = await request(app)
    .get(`/teams/${team2Id}`)
    .set('Authorization', `Bearer ${manager2Token}`)

  expect(teamResponse.status).toBe(200)
})

it('should reject deleting a nonexistent team', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'DeleteManager',
      email: 'delete-manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'delete-manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const response = await request(app)
    .delete('/teams/00000000-0000-0000-0000-000000000000')
    .set('Authorization', `Bearer ${managerToken}`)

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Team not found')
})

it('should reject deleting a team without authentication', async () => {

  const response = await request(app)
    .delete('/teams/00000000-0000-0000-0000-000000000000')

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('No token provided')
})

it('should clear team membership when deleting a team', async () => {

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
    .send({
      teamId
    })

  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  const userBeforeDelete = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  expect(userBeforeDelete.teamId).toBe(teamId)

  const taskResponse = await request(app)
  .post(`/teams/${teamId}/tasks`)
  .set('Authorization', `Bearer ${managerToken}`)
  .send({
    title: 'Task to delete',
    description: 'This task belongs to the team',
    assignedToId: userBeforeDelete.id
  })

expect(taskResponse.status).toBe(201)

const taskNotification = await prisma.notification.findFirst({
  where: {
    userId: userBeforeDelete.id,
    type: 'TASK_ASSIGNED',
    message: 'You have been assigned a new task: "Task to delete"'
  }
})

expect(taskNotification).not.toBeNull()

  await request(app)
    .delete(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)

  const deletedTask = await prisma.task.findUnique({
    where: {
      id: taskResponse.body.id
    }
  })

  expect(deletedTask).toBeNull()

  const deletedTaskNotification = await prisma.notification.findFirst({
    where: {
      userId: userBeforeDelete.id,
      type: 'TASK_ASSIGNED',
      message: 'You have been assigned a new task: "Task to delete"'
    }
  })

  expect(deletedTaskNotification).toBeNull()

  const userAfterDelete = await prisma.user.findUnique({
    where: {
      email: 'pablo@test.com'
    }
  })

  expect(userAfterDelete.teamId).toBeNull()
  expect(userAfterDelete.role).toBe('user')
})

it('should reset manager role when deleting a team', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = loginResponse.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  const managerBeforeDelete = await prisma.user.findUnique({
    where: {
      email: 'manager@test.com'
    }
  })

  expect(managerBeforeDelete.role).toBe('manager')
  expect(managerBeforeDelete.teamId).toBe(teamId)

  await request(app)
    .delete(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)

  const managerAfterDelete = await prisma.user.findUnique({
    where: {
      email: 'manager@test.com'
    }
  })

  expect(managerAfterDelete.role).toBe('user')
  expect(managerAfterDelete.teamId).toBeNull()
})

it('should remove pending join requests when deleting a team', async () => {

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

  const joinRequestResponse = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  expect(joinRequestResponse.body.status).toBe('pending')

  await request(app)
    .delete(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${managerToken}`)

  const joinRequest = await prisma.teamJoinRequest.findUnique({
    where: {
      id: joinRequestResponse.body.id
    }
  })

  expect(joinRequest).toBeNull()
})


  afterAll(async () => {
    await prisma.$disconnect()
  })

})
