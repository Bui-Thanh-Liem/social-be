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
  member_ids: z.array(
    z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'Invalid MongoDB ObjectId'
    })
  ),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export const GetDetailBySlugDtoSchema = z.object({
  slug: z.string().trim()
})

export type CreateCommunityDto = z.infer<typeof CreateCommunityDtoSchema>
export type InvitationMembersDto = z.infer<typeof InvitationMembersDtoSchema>
export type GetDetailBySlugDto = z.infer<typeof GetDetailBySlugDtoSchema>
