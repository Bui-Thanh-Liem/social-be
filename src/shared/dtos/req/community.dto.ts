import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'

export const CreateCommunityDtoSchema = z.object({
  name: z.string().trim().max(32),
  cover: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(200).optional(),
  category: z.string().trim().max(16),
  visibilityType: z.nativeEnum(EVisibilityType),
  membershipType: z.nativeEnum(EMembershipType),
  member_ids: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'Invalid MongoDB ObjectId'
      })
    )
    .optional()
})

export const InvitationMembersDtoSchema = z.object({
  member_ids: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'Invalid MongoDB ObjectId'
      })
    )
    .min(1, { message: 'Vui lòng chọn ít nhất một người dùng.' }),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export const JoinLeaveCommunityDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export const PinCommunityDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export const GetOneBySlugDtoSchema = z.object({
  slug: z.string().trim()
})

export const GetMMByIdDtoSchema = z.object({
  id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export const PromoteMentorDtoSchema = z.object({
  user_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  }),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export type CreateCommunityDto = z.infer<typeof CreateCommunityDtoSchema>
export type InvitationMembersDto = z.infer<typeof InvitationMembersDtoSchema>
export type JoinLeaveCommunityDto = z.infer<typeof JoinLeaveCommunityDtoSchema>
export type PromoteMentorDto = z.infer<typeof PromoteMentorDtoSchema>
export type GetOneBySlugDto = z.infer<typeof GetOneBySlugDtoSchema>
export type GetMMByIdDto = z.infer<typeof GetMMByIdDtoSchema>
export type PinCommunityDto = z.infer<typeof PinCommunityDtoSchema>
