import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'

export const CreateCommunityDtoSchema = z.object({
  name: z.string().trim().max(16),
  cover: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(200).optional(),
  category: z.string().trim().max(16),
  visibilityType: z.nativeEnum(EVisibilityType),
  membershipType: z.nativeEnum(EMembershipType)
})

export const AddMembersDtoSchema = z.object({
  member_ids: z.array(
    z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'Invalid MongoDB ObjectId'
    })
  ),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export type CreateCommunityDto = z.infer<typeof CreateCommunityDtoSchema>
export type AddMembersDto = z.infer<typeof AddMembersDtoSchema>
