import { InsertOneResult, ObjectId, WithId } from 'mongodb'
import cacheServiceInstance from '~/helpers/cache.helper'
import { ConversationCollection, ConversationSchema } from '~/models/schemas/Conversation.schema'
import { BadRequestError, NotFoundError } from '~/shared/classes/error.class'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { CreateConversationDto } from '~/shared/dtos/req/conversation.dto'
import { EConversationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getIO } from '~/socket'
import { createKeyAllConversationIds } from '~/utils/createKeyCache.util'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'

class ConversationsService {
  async create({ user_id, payload }: { user_id: string; payload: CreateConversationDto }) {
    let _newConversation: InsertOneResult<ConversationSchema> | null = null
    const userObjectId = new ObjectId(user_id)

    // PRIVATE
    if (payload.type === EConversationType.Private) {
      const participantObjectId = new ObjectId(payload.participants[0]) // Nếu type là private thì payload.participant luôn là một User

      const result = await ConversationCollection.findOne({
        type: payload.type,
        participants: [userObjectId, participantObjectId]
      })

      if (result) {
        return await this.getOneById(result?._id.toString(), user_id)
      }

      const newData = await ConversationCollection.insertOne(
        new ConversationSchema({ type: payload.type, participants: [userObjectId, participantObjectId] })
      )
      return await this.getOneById(newData?.insertedId.toString(), user_id)
    } else {
      // GROUP
      const participantObjectIds = payload.participants.map((userId) => new ObjectId(userId))
      _newConversation = await ConversationCollection.insertOne(
        new ConversationSchema({
          type: payload.type,
          name: payload.name,
          participants: [userObjectId, ...participantObjectIds]
        })
      )
    }

    // Del findAllIds and emit conversation:new
    const io = getIO()
    const [newData] = await Promise.all(
      [user_id, ...payload.participants].map(async (id) => {
        const cacheKey = createKeyAllConversationIds(id)

        const conversation = await this.getOneById(_newConversation?.insertedId.toString() || '', user_id)

        io.to(id).emit(CONSTANT_EVENT_NAMES.NEW_CONVERSATION, conversation)
        await cacheServiceInstance.del(cacheKey)

        return conversation
      })
    )

    return newData
  }

  async getMulti({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<IConversation>
  }): Promise<ResMultiType<IConversation>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IConversation>(query)

    //
    const conversations = await ConversationCollection.aggregate<ConversationSchema>([
      {
        $match: {
          participants: {
            $in: [new ObjectId(user_id)]
          }
        }
      },
      {
        $sort: sort
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessage',
          pipeline: [
            {
              $project: {
                content: 1,
                created_at: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$lastMessage',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          name: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] }, // Kiểm tra nếu type = Private
              then: {
                $let: {
                  vars: {
                    otherParticipant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'participant',
                            cond: { $ne: ['$$participant._id', new ObjectId(user_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$otherParticipant.name' // Lấy name của participant không phải user_id
                }
              },
              else: '$name' // Giữ nguyên name nếu type != Private
            }
          },
          avatar: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] },
              then: {
                $let: {
                  vars: {
                    otherParticipant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'participant',
                            cond: { $ne: ['$$participant._id', new ObjectId(user_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$otherParticipant.avatar'
                }
              },
              else: {
                $map: {
                  input: '$participants',
                  as: 'participant',
                  in: '$$participant.avatar' // Lấy tất cả avatar của participants (mảng chuỗi)
                }
              }
            }
          }
        }
      }
    ]).toArray()

    //
    const total = await ConversationCollection.countDocuments({
      participants: {
        $in: [new ObjectId(user_id)]
      }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: conversations
    }
  }

  async getOneById(id: string, user_id: string) {
    if (!id) throw new BadRequestError('Id không hợp lệ')

    const conversation = await ConversationCollection.aggregate<ConversationSchema>([
      {
        $match: {
          _id: new ObjectId(id)
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessage',
          pipeline: [
            {
              $project: {
                content: 1,
                created_at: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$lastMessage',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          name: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] }, // Kiểm tra nếu type = Private
              then: {
                $let: {
                  vars: {
                    otherParticipant: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'participant',
                            cond: { $ne: ['$$participant._id', new ObjectId(user_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$otherParticipant.name' // Lấy name của participant không phải user_id
                }
              },
              else: '$name' // Giữ nguyên name nếu type != Private
            }
          }
        }
      }
    ]).next()

    if (!conversation) {
      throw new NotFoundError('Không tìm thấy cuộc trò chuyện')
    }

    return conversation
  }

  async getAllIds(user_id: string): Promise<string[]> {
    const cacheKey = createKeyAllConversationIds(user_id)
    const dataInCache = await cacheServiceInstance.getCache<string[]>(cacheKey)

    if (!dataInCache) {
      // Tìm trong db
      const conversations = await ConversationCollection.aggregate<ConversationSchema>([
        {
          $match: {
            participants: {
              $in: [new ObjectId(user_id)]
            }
          }
        },
        {
          $project: {
            _id: 1
          }
        }
      ]).toArray()

      // Gán cache
      const ids = conversations?.map((x) => x._id!.toString())
      await cacheServiceInstance.setCache(cacheKey, ids)
      return ids
    } else {
      return dataInCache
    }
  }

  async updateLastMessage(conversation_id: string, message_id: string) {
    return await ConversationCollection.findOneAndUpdate(
      { _id: new ObjectId(conversation_id) },
      {
        $set: {
          lastMessage: new ObjectId(message_id),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' } // để trả về doc mới
    )
  }
}

export default new ConversationsService()
