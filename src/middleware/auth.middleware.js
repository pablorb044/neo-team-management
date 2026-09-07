import { UserModel } from '../models/user.model.js'
import { verifyToken } from '../utils/jwt.js'
import { sanitizeUser } from '../utils/user.js'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    // 1. comprobar que existe header
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // 2. separar "Bearer token"
    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' })
    }

    // 3. verificar token
    const decoded = verifyToken(token)

    // 4. comprobar que el usuario existe y está activo
    const user = await UserModel.getById(decoded.id)

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User is inactive'
      })
    }

    // 5. guardar usuario en request
    req.user = sanitizeUser(user)

    next()

  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token'
    })
  }
}