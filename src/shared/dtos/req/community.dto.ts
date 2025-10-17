import { z } from 'zod'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'

export const CreateCommunityDtoSchema = z.object({
  name: z.string().trim().max(16),
  cover: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(200).optional(),
  category: z.string().trim().max(16),
  visibilityType: z.nativeEnum(EVisibilityType),
  membershipType: z.nativeEnum(EMembershipType)
})

export type CreateCommunityDto = z.infer<typeof CreateCommunityDtoSchema>
