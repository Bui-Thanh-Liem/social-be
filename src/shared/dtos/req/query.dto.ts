import z from 'zod'

export const QueryDtoSchema = z.object({
  page: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === undefined ? 1 : Number(val)))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'Page must be a number greater than or equal to 1'
    }),
  limit: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === undefined ? 10 : Number(val)))
    .refine((val) => !isNaN(val) && val > 1 && val <= 100, {
      message: 'Limit must be a number between 2 and 100'
    })
})

export type QueryDto = z.infer<typeof QueryDtoSchema>
