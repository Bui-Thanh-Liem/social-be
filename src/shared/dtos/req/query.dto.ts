import z from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const QueryDtoSchema = z.object({
  // page: z
  //   .string()
  //   .trim()
  //   .optional()
  //   .transform((val) => (val === undefined ? 1 : Number(val)))
  //   .refine((val) => !isNaN(val) && val >= 1, {
  //     message: 'Page must be a number greater than or equal to 1'
  //   }),
  // limit: z
  //   .string()
  //   .trim()
  //   .optional()
  //   .transform((val) => (val === undefined ? 10 : Number(val)))
  //   .refine((val) => !isNaN(val) && val > 1 && val <= 100, {
  //     message: 'Limit must be a number between 2 and 100'
  //   }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(2).max(100).default(10),
  q: z.string().trim().optional(),
  f: z.string().trim().optional(),
  pf: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val === 'on', { message: 'People follow invalid (on)' }),
  user_id: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'ObjectId không hợp lệ'
    })
    .optional(),
  community_id: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'ObjectId không hợp lệ'
    })
    .optional(),
  ishl: z.enum(['0', '1']).default('0'),
  sd: z
    .string()
    .datetime({ offset: true }) // bắt buộc ISO 8601 có timezone (Z hoặc +07:00)
    .transform((val) => new Date(val))
    .optional(),
  ed: z
    .string()
    .datetime({ offset: true })
    .transform((val) => new Date(val))
    .optional()
})

export type QueryDto = z.infer<typeof QueryDtoSchema>
