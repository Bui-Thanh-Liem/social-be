import z from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants/regex.constant'

export const CreateAccessRecentDtoSchema = z
  .object({
    ref_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'ObjectId không hợp lệ cho ref_id'
    }),
    user_id: z
      .string()
      .trim()
      .regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'ObjectId không hợp lệ cho user_id'
      })
      .optional(),
    type: z.enum(['tweet', 'community', 'user'], {
      errorMap: () => ({ message: 'Type phải là tweet, community hoặc user' })
    }),
    // Thêm trường slug vào schema, cho phép optional lúc đầu
    ref_slug: z.string().trim().optional()
  })
  .refine(
    (data) => {
      // Nếu type là user hoặc community, yêu cầu slug phải tồn tại và không trống
      if ((data.type === 'user' || data.type === 'community') && !data.ref_slug) {
        return false
      }
      return true
    },
    {
      message: "Slug là bắt buộc khi type là 'user' hoặc 'community'",
      path: ['ref_slug'] // Gán lỗi trực tiếp vào trường ref_slug để dễ hiển thị ở UI
    }
  )

export type CreateAccessRecentDto = z.infer<typeof CreateAccessRecentDtoSchema>
