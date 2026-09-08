import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

describe('Tasks', () => {

  beforeEach(async () => {
    await prisma.notification.deleteMany()
    await prisma.task.deleteMany()
    await prisma.teamJoinRequest.deleteMany()
    await prisma.team.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should allow manager to create a task assigned to a MEMBER', async () => {

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

    // Crear employee
    const employeeResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'Employee',
        email: 'employee@test.com',
        password: '123456'
      })

    const employeeId = employeeResponse.body.id

    // Convertir employee en MEMBER del Team
    await prisma.user.update({
      where: {
        id: employeeId
      },
      data: {
        teamId,
        role: 'MEMBER'
      }
    })

    // Crear Task
    const response = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Implement login',
        description: 'Finish the login flow',
        assignedToId: employeeId
      })

    expect(response.status).toBe(201)
    expect(response.body.title).toBe('Implement login')
    expect(response.body.description).toBe('Finish the login flow')
    expect(response.body.teamId).toBe(teamId)
    expect(response.body.assignedToId).toBe(employeeId)
    expect(response.body.status).toBe('SENT')

    const notification = await prisma.notification.findFirst({
      where: {
        userId: employeeId,
        type: 'TASK_ASSIGNED',
        taskId: response.body.id
      }
    })

    expect(notification).not.toBeNull()
    expect(notification.message)
      .toBe('You have been assigned a new task: "Implement login"')
  })

    it('should reject a non-manager from creating a task', async () => {

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

    // Crear MEMBER
    const employeeResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'Employee',
        email: 'employee@test.com',
        password: '123456'
      })

    const employeeId = employeeResponse.body.id

    const employeeLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'employee@test.com',
        password: '123456'
      })

    const employeeToken = employeeLogin.body.token

    // Meterlo en el Team como MEMBER
    await prisma.user.update({
      where: {
        id: employeeId
      },
      data: {
        teamId,
        role: 'MEMBER'
      }
    })

    // Intentar crear Task
    const response = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'Unauthorized task',
        description: 'This should fail',
        assignedToId: employeeId
      })

    expect(response.status).toBe(403)
    expect(response.body.error).toBe(
      'Only the team manager can create tasks'
    )
  })

    it('should reject assigning a task to a user from another team', async () => {

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
    const team1Response = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        organizationName: 'Acme',
        teamName: 'Engineering'
      })

    const team1Id = team1Response.body.team.id

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
    const team2Response = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${manager2Token}`)
      .send({
        organizationName: 'Beta',
        teamName: 'Backend'
      })

    const team2Id = team2Response.body.team.id

    // MEMBER del Team 2
    const employeeResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'Employee',
        email: 'employee@test.com',
        password: '123456'
      })

    const employeeId = employeeResponse.body.id

    await prisma.user.update({
      where: {
        id: employeeId
      },
      data: {
        teamId: team2Id,
        role: 'MEMBER'
      }
    })

    // Manager 1 intenta asignarle una Task del Team 1
    // al MEMBER del Team 2
    const response = await request(app)
      .post(`/teams/${team1Id}/tasks`)
      .set('Authorization', `Bearer ${manager1Token}`)
      .send({
        title: 'Cross team task',
        description: 'This should fail',
        assignedToId: employeeId
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe(
      'Assigned user does not belong to this team'
    )
  })

    it('should reject assigning a task to a user who is not a MEMBER', async () => {

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

    // Crear usuario normal
    const employeeResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'Employee',
        email: 'employee@test.com',
        password: '123456'
      })

    const employeeId = employeeResponse.body.id

    // Meterlo en el Team pero mantener role = user
    await prisma.user.update({
      where: {
        id: employeeId
      },
      data: {
        teamId
      }
    })

    // Intentar asignarle una Task
    const response = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Invalid assignment',
        description: 'This should fail',
        assignedToId: employeeId
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe(
      'Tasks can only be assigned to team members with MEMBER role'
    )
  })

    it('should reject creating a task with a non-existent user', async () => {

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

    // UUID válido pero usuario inexistente
    const nonExistentUserId =
    '11111111-1111-4111-8111-111111111111'

    const response = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Invalid task',
        description: 'This should fail',
        assignedToId: nonExistentUserId
      })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe(
  'Assigned user not found'
)

  })

  it('should reject a manager from another team from creating a task', async () => {

  // Manager 1
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

  const token1 = login1.body.token

  const organization1 = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token1}`)
    .send({
      organizationName: 'Acme',
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

  const login2 = await request(app)
    .post('/auth/login')
    .send({
      email: 'manager2@test.com',
      password: '123456'
    })

  const token2 = login2.body.token

  const manager2 = await prisma.user.findUnique({
  where: {
    email: 'manager2@test.com'
  }
})

  const organization2 = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${token2}`)
    .send({
      organizationName: 'Other',
      teamName: 'Backend'
    })

  const team2Id = organization2.body.team.id

  // Manager 1 intenta crear una task en el Team 2
  const response = await request(app)
    .post(`/teams/${team2Id}/tasks`)
    .set('Authorization', `Bearer ${token1}`)
    .send({
      title: 'Unauthorized task',
      assignedToId: manager2.id
    })

  expect(response.status).toBe(403)
  expect(response.body.error).toBe(
    'Only the team manager can create tasks'
  )
  })

  it('should create a task with SENT status by default', async () => {

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

    const memberResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'Member',
        email: 'member@test.com',
        password: '123456'
      })

    const memberId = memberResponse.body.id

    await prisma.user.update({
      where: {
        id: memberId
      },
      data: {
        teamId,
        role: 'MEMBER'
      }
    })

    const response = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'New task',
        assignedToId: memberId
      })

    expect(response.status).toBe(201)
    expect(response.body.status).toBe('SENT')
  })

  it('should allow a MEMBER to get their assigned tasks', async () => {

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
        username: 'Member',
        email: 'member@test.com',
        password: '123456'
      })

    const memberLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'member@test.com',
        password: '123456'
      })

    const memberToken = memberLogin.body.token

    const member = await prisma.user.findUnique({
      where: {
        email: 'member@test.com'
      }
    })

    await prisma.user.update({
      where: {
        id: member.id
      },
      data: {
        teamId,
        role: 'MEMBER'
      }
    })

    await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'My task',
        description: 'Task assigned to member',
        assignedToId: member.id
      })

    const response = await request(app)
      .get('/tasks/me')
      .set('Authorization', `Bearer ${memberToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].title).toBe('My task')
    expect(response.body[0].assignedToId).toBe(member.id)
  })

  it('should only return tasks assigned to the authenticated user', async () => {

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
        username: 'Member1',
        email: 'member1@test.com',
        password: '123456'
      })

    await request(app)
      .post('/auth/register')
      .send({
        username: 'Member2',
        email: 'member2@test.com',
        password: '123456'
      })

    const member1Login = await request(app)
      .post('/auth/login')
      .send({
        email: 'member1@test.com',
        password: '123456'
      })

    const member1Token = member1Login.body.token

    const member1 = await prisma.user.findUnique({
      where: { email: 'member1@test.com' }
    })

    const member2 = await prisma.user.findUnique({
      where: { email: 'member2@test.com' }
    })

    await prisma.user.updateMany({
      where: {
        id: {
          in: [member1.id, member2.id]
        }
      },
      data: {
        teamId,
        role: 'MEMBER'
      }
    })

    await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Task 1',
        assignedToId: member1.id
      })

    await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Task 2',
        assignedToId: member2.id
      })

    const response = await request(app)
      .get('/tasks/me')
      .set('Authorization', `Bearer ${member1Token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].title).toBe('Task 1')
    expect(response.body[0].assignedToId).toBe(member1.id)
  })

  it('should allow a MEMBER to move their task from SENT to WORKING', async () => {
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

    // Organization + Team
    const organizationResponse = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        organizationName: 'Acme',
        teamName: 'Engineering'
      })

    const teamId = organizationResponse.body.team.id

    // MEMBER
    await request(app)
      .post('/auth/register')
      .send({
        username: 'Pablo',
        email: 'pablo@test.com',
        password: '123456'
      })

    const memberLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'pablo@test.com',
        password: '123456'
      })

    const memberToken = memberLogin.body.token

    const memberMe = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)

    const memberId = memberMe.body.id

    // Join request
    await request(app)
      .post('/team-join-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        teamId
      })

    // Get join request
    const requestsResponse = await request(app)
      .get('/team-join-requests')
      .set('Authorization', `Bearer ${managerToken}`)

    const joinRequestId = requestsResponse.body[0].id

    // Approve
    await request(app)
      .patch(`/team-join-requests/${joinRequestId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)

    // Make MEMBER
    await request(app)
      .patch(`/teams/${teamId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        role: 'MEMBER'
      })

    // Create task
    const taskResponse = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Test task',
        description: 'Test description',
        assignedToId: memberId
      })

    expect(taskResponse.status).toBe(201)
    expect(taskResponse.body.status).toBe('SENT')

    const taskId = taskResponse.body.id

    // MEMBER → WORKING
    const response = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'WORKING'
      })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('WORKING')
  })

  it('should reject a MEMBER from updating a task assigned to another user', async () => {
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

    // Organization + Team
    const organizationResponse = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        organizationName: 'Acme',
        teamName: 'Engineering'
      })

    const teamId = organizationResponse.body.team.id

    // MEMBER 1
    await request(app)
      .post('/auth/register')
      .send({
        username: 'Pablo',
        email: 'pablo@test.com',
        password: '123456'
      })

    const member1Login = await request(app)
      .post('/auth/login')
      .send({
        email: 'pablo@test.com',
        password: '123456'
      })

    const member1Token = member1Login.body.token

    const member1Me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${member1Token}`)

    const member1Id = member1Me.body.id

    // MEMBER 2
    await request(app)
      .post('/auth/register')
      .send({
        username: 'Carlos',
        email: 'carlos@test.com',
        password: '123456'
      })

    const member2Login = await request(app)
      .post('/auth/login')
      .send({
        email: 'carlos@test.com',
        password: '123456'
      })

    const member2Token = member2Login.body.token

    const member2Me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${member2Token}`)

    const member2Id = member2Me.body.id

    // MEMBER 1 join request
    await request(app)
      .post('/team-join-requests')
      .set('Authorization', `Bearer ${member1Token}`)
      .send({
        teamId
      })

    const requests1 = await request(app)
      .get('/team-join-requests')
      .set('Authorization', `Bearer ${managerToken}`)

    const request1Id = requests1.body[0].id

    await request(app)
      .patch(`/team-join-requests/${request1Id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)

    // MEMBER 2 join request
    await request(app)
      .post('/team-join-requests')
      .set('Authorization', `Bearer ${member2Token}`)
      .send({
        teamId
      })

    const requests2 = await request(app)
      .get('/team-join-requests')
      .set('Authorization', `Bearer ${managerToken}`)

    const request2Id = requests2.body.find(
      request => request.userId === member2Id
    ).id

    await request(app)
      .patch(`/team-join-requests/${request2Id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)

    // Make both users MEMBER
    await request(app)
      .patch(`/teams/${teamId}/members/${member1Id}/role`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        role: 'MEMBER'
      })

    await request(app)
      .patch(`/teams/${teamId}/members/${member2Id}/role`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        role: 'MEMBER'
      })

    // Manager creates task assigned to MEMBER 1
    const taskResponse = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Private task',
        description: 'Task assigned to Pablo',
        assignedToId: member1Id
      })

    expect(taskResponse.status).toBe(201)

    const taskId = taskResponse.body.id

    // MEMBER 2 tries to update MEMBER 1's task
    const response = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${member2Token}`)
      .send({
        status: 'WORKING'
      })

    expect(response.status).toBe(403)
    expect(response.body.error).toBe(
      'Only the assigned user can update the task status'
    )
  })

  it('should allow a MEMBER to move their task from WORKING to SUBMITTED', async () => {
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

    // Organization + Team
    const organizationResponse = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        organizationName: 'Acme',
        teamName: 'Engineering'
      })

    const teamId = organizationResponse.body.team.id

    // MEMBER
    await request(app)
      .post('/auth/register')
      .send({
        username: 'Pablo',
        email: 'pablo@test.com',
        password: '123456'
      })

    const memberLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'pablo@test.com',
        password: '123456'
      })

    const memberToken = memberLogin.body.token

    const memberMe = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)

    const memberId = memberMe.body.id

    // Join request
    await request(app)
      .post('/team-join-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        teamId
      })

    // Get join request
    const requestsResponse = await request(app)
      .get('/team-join-requests')
      .set('Authorization', `Bearer ${managerToken}`)

    const joinRequestId = requestsResponse.body[0].id

    // Approve
    await request(app)
      .patch(`/team-join-requests/${joinRequestId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)

    // Make MEMBER
    await request(app)
      .patch(`/teams/${teamId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        role: 'MEMBER'
      })

    // Create task
    const taskResponse = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Test task',
        description: 'Test description',
        assignedToId: memberId
      })

    expect(taskResponse.status).toBe(201)
    expect(taskResponse.body.status).toBe('SENT')

    const taskId = taskResponse.body.id

    // MEMBER → WORKING
    const workingResponse = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'WORKING'
      })

    expect(workingResponse.status).toBe(200)
    expect(workingResponse.body.status).toBe('WORKING')

    // MEMBER → SUBMITTED
    const submittedResponse = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'SUBMITTED'
      })

    expect(submittedResponse.status).toBe(200)
    expect(submittedResponse.body.status).toBe('SUBMITTED')
  })

    it('should reject moving a task directly from SENT to DONE', async () => {
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

    // Organization + Team
    const organizationResponse = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        organizationName: 'Acme',
        teamName: 'Engineering'
      })

    const teamId = organizationResponse.body.team.id

    // MEMBER
    await request(app)
      .post('/auth/register')
      .send({
        username: 'Pablo',
        email: 'pablo@test.com',
        password: '123456'
      })

    const memberLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'pablo@test.com',
        password: '123456'
      })

    const memberToken = memberLogin.body.token

    const memberMe = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)

    const memberId = memberMe.body.id

    // Join request
    await request(app)
      .post('/team-join-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        teamId
      })

    // Approve
    const requestsResponse = await request(app)
      .get('/team-join-requests')
      .set('Authorization', `Bearer ${managerToken}`)

    const joinRequestId = requestsResponse.body[0].id

    await request(app)
      .patch(`/team-join-requests/${joinRequestId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)

    // Make user MEMBER
    await request(app)
      .patch(`/teams/${teamId}/members/${memberId}/role`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        role: 'MEMBER'
      })

    // Create task
    const taskResponse = await request(app)
      .post(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Test task',
        description: 'Test description',
        assignedToId: memberId
      })

    expect(taskResponse.status).toBe(201)
    expect(taskResponse.body.status).toBe('SENT')

    const taskId = taskResponse.body.id

    // SENT → DONE should be rejected
    const response = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'DONE'
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe(
      'Invalid task status transition'
    )
  })

  it('should allow the MANAGER to move a submitted task to DONE', async () => {
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

  // Organization + Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // MEMBER
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberToken = memberLogin.body.token

  const memberMe = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${memberToken}`)

  const memberId = memberMe.body.id

  // Join request
  await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      teamId
    })

  // Get join request
  const requestsResponse = await request(app)
    .get('/team-join-requests')
    .set('Authorization', `Bearer ${managerToken}`)

  const joinRequestId = requestsResponse.body[0].id

  // Approve
  await request(app)
    .patch(`/team-join-requests/${joinRequestId}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  // Make MEMBER
  await request(app)
    .patch(`/teams/${teamId}/members/${memberId}/role`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      role: 'MEMBER'
    })

  // Create task
  const taskResponse = await request(app)
    .post(`/teams/${teamId}/tasks`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      title: 'Test task',
      description: 'Test description',
      assignedToId: memberId
    })

  expect(taskResponse.status).toBe(201)
  expect(taskResponse.body.status).toBe('SENT')

  const taskId = taskResponse.body.id

  // MEMBER → WORKING
  const workingResponse = await request(app)
    .patch(`/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      status: 'WORKING'
    })

  expect(workingResponse.status).toBe(200)
  expect(workingResponse.body.status).toBe('WORKING')

  // MEMBER → SUBMITTED
  const submittedResponse = await request(app)
    .patch(`/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      status: 'SUBMITTED'
    })

  expect(submittedResponse.status).toBe(200)
  expect(submittedResponse.body.status).toBe('SUBMITTED')

  // MANAGER → DONE
  const doneResponse = await request(app)
    .patch(`/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      status: 'DONE'
    })

  expect(doneResponse.status).toBe(200)
  expect(doneResponse.body.status).toBe('DONE')

  const notification = await prisma.notification.findFirst({
  where: {
    userId: memberId,
    type: 'TASK_COMPLETED',
    taskId: taskId
  }
})

expect(notification).not.toBeNull()
})

it('should reject a MEMBER from moving a submitted task to DONE', async () => {
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

  // Organization + Team
  const organizationResponse = await request(app)
    .post('/organizations')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      organizationName: 'Acme',
      teamName: 'Engineering'
    })

  const teamId = organizationResponse.body.team.id

  // MEMBER
  await request(app)
    .post('/auth/register')
    .send({
      username: 'Pablo',
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberToken = memberLogin.body.token

  const memberMe = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${memberToken}`)

  const memberId = memberMe.body.id

  // Join request
  await request(app)
    .post('/team-join-requests')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      teamId
    })

  // Get join request
  const requestsResponse = await request(app)
    .get('/team-join-requests')
    .set('Authorization', `Bearer ${managerToken}`)

  const joinRequestId = requestsResponse.body[0].id

  // Approve
  await request(app)
    .patch(`/team-join-requests/${joinRequestId}/approve`)
    .set('Authorization', `Bearer ${managerToken}`)

  // Make MEMBER
  await request(app)
    .patch(`/teams/${teamId}/members/${memberId}/role`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      role: 'MEMBER'
    })

  // Create task
  const taskResponse = await request(app)
    .post(`/teams/${teamId}/tasks`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      title: 'Test task',
      description: 'Test description',
      assignedToId: memberId
    })

  expect(taskResponse.status).toBe(201)

  const taskId = taskResponse.body.id

  // MEMBER → WORKING
  const workingResponse = await request(app)
    .patch(`/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      status: 'WORKING'
    })

  expect(workingResponse.status).toBe(200)

  // MEMBER → SUBMITTED
  const submittedResponse = await request(app)
    .patch(`/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      status: 'SUBMITTED'
    })

  expect(submittedResponse.status).toBe(200)
  expect(submittedResponse.body.status).toBe('SUBMITTED')

  // MEMBER → DONE should be rejected
  const doneResponse = await request(app)
    .patch(`/tasks/${taskId}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      status: 'DONE'
    })

  expect(doneResponse.status).toBe(400)
  expect(doneResponse.body.error).toBe(
    'Invalid task status transition'
  )
})

it('should allow the team manager to delete a task', async () => {
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

  const memberLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberMe = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${memberLogin.body.token}`)

  await prisma.user.update({
    where: {
      id: memberMe.body.id
    },
    data: {
      teamId,
      role: 'MEMBER'
    }
  })

  const taskResponse = await request(app)
    .post(`/teams/${teamId}/tasks`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      title: 'Task to delete',
      description: 'This task should be deleted',
      assignedToId: memberMe.body.id
    })

  expect(taskResponse.status).toBe(201)

  const deleteResponse = await request(app)
    .delete(`/tasks/${taskResponse.body.id}`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(deleteResponse.status).toBe(204)
  
  const deletedNotifications = await prisma.notification.findMany({
    where: {
      taskId: taskResponse.body.id
    }
  })

  expect(deletedNotifications).toHaveLength(0)

  const deletedTask = await prisma.task.findUnique({
    where: {
      id: taskResponse.body.id
    }
  })

  expect(deletedTask).toBeNull()
})

it('should reject a MEMBER from deleting a task', async () => {
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

  const memberLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberMe = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${memberLogin.body.token}`)

  const memberId = memberMe.body.id

  await prisma.user.update({
    where: {
      id: memberId
    },
    data: {
      teamId,
      role: 'MEMBER'
    }
  })

  const taskResponse = await request(app)
    .post(`/teams/${teamId}/tasks`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      title: 'Protected task',
      assignedToId: memberId
    })

  const deleteResponse = await request(app)
    .delete(`/tasks/${taskResponse.body.id}`)
    .set('Authorization', `Bearer ${memberLogin.body.token}`)

  expect(deleteResponse.status).toBe(403)
  expect(deleteResponse.body.error).toBe(
    'Only the team manager can delete tasks'
  )
})

it('should reject deleting a completed task', async () => {
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

  const memberLogin = await request(app)
    .post('/auth/login')
    .send({
      email: 'pablo@test.com',
      password: '123456'
    })

  const memberMe = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${memberLogin.body.token}`)

  const memberId = memberMe.body.id

  await prisma.user.update({
    where: {
      id: memberId
    },
    data: {
      teamId,
      role: 'MEMBER'
    }
  })

  const taskResponse = await request(app)
    .post(`/teams/${teamId}/tasks`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      title: 'Completed task',
      assignedToId: memberId
    })

  const taskId = taskResponse.body.id

  await prisma.task.update({
    where: {
      id: taskId
    },
    data: {
      status: 'DONE'
    }
  })

  const deleteResponse = await request(app)
    .delete(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${managerToken}`)

  expect(deleteResponse.status).toBe(400)
  expect(deleteResponse.body.error).toBe(
    'Completed tasks cannot be deleted'
  )
})

it('should reject deleting a nonexistent task', async () => {
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

  const response = await request(app)
    .delete('/tasks/11111111-1111-4111-8111-111111111111')
    .set('Authorization', `Bearer ${managerLogin.body.token}`)

  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Task not found')
})

  afterAll(async () => {
    await prisma.$disconnect()
  })

})
