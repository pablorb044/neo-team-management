import { z } from 'zod'

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .optional(),

  email: z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email'))
  .optional()
})