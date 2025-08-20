import z from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { EMediaType } from '~/shared/enums/type.enum'

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
  f: z
    .preprocess(
      (val) => Number(val),
      z.nativeEnum(EMediaType, {
        errorMap: () => ({ message: 'Invalid Media Type' })
      })
    )
    .optional(),
  pf: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val === 'on', { message: 'People follow invalid (on)' }),
  profile_id: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'Invalid MongoDB ObjectId'
    })
    .optional(),
  ishl: z.enum(['0', '1']).default('0')
})

export type QueryDto = z.infer<typeof QueryDtoSchema>
