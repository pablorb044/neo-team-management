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

it('should create an organization and team', async () => {

  // Register
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  // Login
  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const token = loginResponse.body.token

  // Create organization
  const response = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      organizationName: 'Carnes Paco S.L.',
      teamName: 'Sección de embutidos'
    })

  expect(response.status).toBe(201)

  expect(response.body.organization.name).toBe('Carnes Paco S.L.')
  expect(response.body.team.name).toBe('Sección de embutidos')

  expect(response.body.manager.username).toBe('Pablo')
  expect(response.body.manager.email).toBe('pablo@test.com')
  expect(response.body.manager.role).toBe('manager')
})

it('should reject creating a second team for the same manager', async () => {

  // Register
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  // Login
  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const token = loginResponse.body.token

  // First organization/team
  await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      organizationName: 'Carnes Paco S.L.',
      teamName: 'Sección de embutidos'
    })

  // Second organization/team
  const response = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      organizationName: 'Otra Empresa',
      teamName: 'Otro Equipo'
    })

  expect(response.status).toBe(400)
  expect(response.body.error)
    .toBe('User already belongs to a team')
})

it('should reject organization creation when user already belongs to a team', async () => {

  // Create manager
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

  // Create organization/team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // Register member
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

  // Request to join team
  const joinRequest = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ teamId })

  // Manager approves
  await request(app)
    .patch(`/team-join-requests/${joinRequest.body.id}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  // Member tries to create another organization
  const response = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      organizationName: 'Otra Empresa',
      teamName: 'Otro Equipo'
    })

  expect(response.status).toBe(400)
  expect(response.body.error)
    .toBe('User already belongs to a team')
})

it('should reject organization creation without authentication', async () => {

  const response = await request(app)
    .post('/organizations')
    .send({
      organizationName: 'Carnes Paco S.L.',
      teamName: 'Sección de embutidos'
    })

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('No token provided')
})

it('should return an organization for a team member', async () => {
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const organizationId =
    organizationResponse.body.organization.id

  const response = await request(app)
    .get(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${login.body.token}`)

  expect(response.status).toBe(200)
  expect(response.body.id).toBe(organizationId)
  expect(response.body.team.name).toBe('Engineering')
})

it('should reject getting a nonexistent organization', async () => {
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const login = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const response = await request(app)
    .get('/organizations/00000000-0000-0000-0000-000000000000')
    .set('Authorization', `Bearer ${login.body.token}`)

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Organization not found')
})

it('should reject getting an organization for a user from another organization', async () => {
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

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerLogin.body.token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const organizationId =
    organizationResponse.body.organization.id

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

  const response = await request(app)
    .get(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${userLogin.body.token}`)

  expect(response.status).toBe(403)
  expect(response.body.error)
    .toBe('You do not belong to this organization')
})

it('should return organization members', async () => {
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

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerLogin.body.token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const organizationId =
    organizationResponse.body.organization.id

  const response = await request(app)
    .get(`/organizations/${organizationId}/members`)
    .set('Authorization', `Bearer ${managerLogin.body.token}`)

  expect(response.status).toBe(200)
  expect(response.body).toHaveLength(1)
  expect(response.body[0].email).toBe('manager@test.com')
})

it('should allow the organization manager to update the organization name', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = login.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const organizationId = organizationResponse.body.organization.id

  const response = await request(app)
    .patch(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Acme Updated'
    })

  expect(response.status).toBe(200)
  expect(response.body.name).toBe('Acme Updated')
})


it('should reject updating an organization for a non-manager member', async () => {

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

  const organizationId = organizationResponse.body.organization.id
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
    .patch(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Hacked'
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe(
    'Only the organization manager can update it'
  )
})


it('should reject updating an organization from another organization', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager1',
      email: 'manager1@test.com',
      password: '123456'
    })

  const login1 = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager1@test.com',
      password: '123456'
    })

  const manager1Token = login1.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager1Token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const organizationId = organizationResponse.body.organization.id

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager2',
      email: 'manager2@test.com',
      password: '123456'
    })

  const login2 = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager2@test.com',
      password: '123456'
    })

  const manager2Token = login2.body.token

  await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      organizationName: 'Other',
      teamName: 'Other Team'
    })

  const response = await request(app)
    .patch(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${manager2Token}`)
    .send({
      name: 'Hacked'
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe(
    'You do not belong to this organization'
  )
})


it('should reject updating a nonexistent organization', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = login.body.token

  const response = await request(app)
    .patch('/organizations/nonexistent-id')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Acme'
    })

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Organization not found')
})


it('should reject updating an organization with an invalid name', async () => {

  await request(app)
    .post('/auth/register')
    .send({
      username: 'Manager',
      email: 'manager@test.com',
      password: '123456'
    })

  const login = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager@test.com',
      password: '123456'
    })

  const managerToken = login.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const organizationId = organizationResponse.body.organization.id

  const response = await request(app)
    .patch(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'A'
    })

  expect(response.status).toBe(400)
})


afterAll(async () => {
    await prisma.$disconnect()
  })

})

