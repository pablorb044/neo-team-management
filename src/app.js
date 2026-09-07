import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authRouter } from './routes/auth.routes.js'
import { organizationRouter } from './routes/organization.routes.js'
import { teamJoinRequestRouter } from './routes/team-join-request.routes.js'
import { teamRouter } from './routes/team.routes.js'
import { taskRouter } from './routes/task.routes.js'
import { notificationRouter } from './routes/notification.routes.js'

const requiredEnv = [
  'JWT_SECRET',
  'DATABASE_URL',
  'FRONTEND_URL'
]

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}`
    )
  }
}

export const app = express()

app.use(helmet())

app.use(cors({
  origin: process.env.FRONTEND_URL
}))

app.use(express.json({ limit: '100kb' }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test'
})

app.use('/auth', authLimiter, authRouter)

app.use('/team-join-requests', teamJoinRequestRouter)
app.use('/organizations', organizationRouter)
app.use('/teams', teamRouter)
app.use('/', taskRouter)
app.use('/notifications', notificationRouter)

app.get('/ping', (req, res) => {
  res.json({
    ok: true,
    service: 'auth-api',
    version: '1.0.0'
  })
})

app.get('/', (req, res) => {
  res.json({
    name: 'Auth API',
    status: 'running',
    version: '1.0.0'
  })
})