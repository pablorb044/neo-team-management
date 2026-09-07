import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email')),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
})