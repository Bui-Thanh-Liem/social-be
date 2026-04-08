import { z } from 'zod'

export const CreateReelDtoSchema = z.object({
  email_verify_token: z.string().trim()
})

export type CreateReelDto = z.infer<typeof CreateReelDtoSchema>
