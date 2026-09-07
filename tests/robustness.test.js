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


it('should reject inactive user from creating an organization', async () => {

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

  const token = login.body.token

  await request(app)
    .delete('/auth/me')
    .set('Authorization', `Bearer ${token}`)

  const response = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      organizationName: 'Inactive Org',
      teamName: 'Inactive Team'
    })

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('User is inactive')
})

it('should reject inactive user from creating a team join request', async () => {

  // Manager activo
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

  await request(app)
    .delete('/auth/me')
    .set('Authorization', `Bearer ${userToken}`)

  const response = await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      teamId
    })

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('User is inactive')
})

it('should reject inactive user from accessing a team', async () => {

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

  const token = login.body.token

  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  await request(app)
    .delete('/auth/me')
    .set('Authorization', `Bearer ${token}`)

  const response = await request(app)
    .get(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${token}`)

  expect(response.status).toBe(401)
  expect(response.body.error).toBe('User is inactive')
})

it('should reject an invalid team id when getting a team', async () => {

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
    .get('/teams/not-a-uuid')
    .set('Authorization', `Bearer ${login.body.token}`)

  expect(response.status).toBe(400)
})

it('should reject an invalid organization id', async () => {

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
    .get('/organizations/not-a-uuid')
    .set('Authorization', `Bearer ${login.body.token}`)

  expect(response.status).toBe(400)
})

it('should reject an invalid team id in join request', async () => {

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
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      teamId: 'not-a-uuid'
    })

  expect(response.status).toBe(400)
  expect(response.body.errors).toBeDefined()
})

it('should reject an empty team name update', async () => {

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

  const teamId = organizationResponse.body.team.id

  const response = await request(app)
    .patch(`/teams/${teamId}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      name: ''
    })

  expect(response.status).toBe(400)
})

it('should reject an empty organization name update', async () => {

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

  const organizationId = organizationResponse.body.organization.id

  const response = await request(app)
    .patch(`/organizations/${organizationId}`)
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      name: ''
    })

  expect(response.status).toBe(400)
})

it('should return 404 for a nonexistent route', async () => {

  const response = await request(app)
    .get('/this-route-does-not-exist')

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Route not found')
})

afterAll(async () => {
    await prisma.$disconnect()
  })

})

