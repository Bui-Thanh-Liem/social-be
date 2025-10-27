import { InsertOneResult, ObjectId } from 'mongodb'
import database from '~/configs/database.config'
import cacheServiceInstance from '~/helpers/cache.helper'
import { ConversationCollection, ConversationSchema } from '~/models/schemas/Conversation.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { BadRequestError, NotFoundError } from '~/shared/classes/error.class'
import { CreateConversationDto } from '~/shared/dtos/req/conversation.dto'
import { EConversationType, ENotificationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getSocket } from '~/socket'
import ConversationGateway from '~/socket/gateways/Conversation.gateway'
import { createKeyAllConversationIds } from '~/utils/createKeyCache.util'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import MessagesService from './Messages.service'
import NotificationService from './Notification.service'

class ConversationsService {
  async create({ user_id, payload }: { user_id: string; payload: CreateConversationDto }) {
    const socket = getSocket()
    let _newConversation: InsertOneResult<ConversationSchema> | null = null
    const userObjectId = new ObjectId(user_id)

    // PRIVATE
    if (payload.type === EConversationType.Private) {
      const participantObjectId = new ObjectId(payload.participants[0]) // Nếu type là private thì payload.participant luôn là một User

      const findItem = await ConversationCollection.findOne({
        type: payload.type,
        participants: [userObjectId, participantObjectId]
      })

      if (findItem) {
        return await this.getOneById(findItem?._id.toString(), user_id)
      }

      const newData = await ConversationCollection.insertOne(
        new ConversationSchema({
          type: payload.type,
          avatar: payload?.avatar,
          participants: [userObjectId, participantObjectId]
        })
      )
      const newCon = await this.getOneById(newData?.insertedId.toString(), user_id)
      if (newCon._id) {
        socket?.join(newCon._id?.toString())
        ConversationGateway.sendNewConversation(newCon, participantObjectId.toString())
      }
      return newCon
    }

    // GROUP
    const participantObjectIds = payload.participants.map((userId) => new ObjectId(userId))
    _newConversation = await ConversationCollection.insertOne(
      new ConversationSchema({
        type: payload.type,
        name: payload.name,
        avatar: payload?.avatar,
        mentors: [userObjectId],
        participants: [userObjectId, ...participantObjectIds]
      })
    )

    // Del findAllIds and emit conversation:new
    const [newData] = await Promise.all(
      [user_id, ...payload.participants].map(async (id) => {
        const cacheKey = createKeyAllConversationIds(id)

        const conversation = await this.getOneById(_newConversation?.insertedId.toString() || '', user_id)

        ConversationGateway.sendNewConversation(conversation, id)

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
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<IConversation>(query)

    //
    let userIds: ObjectId[] = []
    if (q) {
      const matchedUsers = await UserCollection.find(
        { $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }] },
        { projection: { _id: 1 } }
      ).toArray()
      userIds = matchedUsers.map((u) => u._id)
    }

    //
    const conversations = await ConversationCollection.aggregate<ConversationSchema>([
      {
        $match: {
          participants: {
            $in: [new ObjectId(user_id)]
          },
          deletedFor: {
            $nin: [new ObjectId(user_id)]
          },
          ...(q
            ? {
                $or: [{ name: { $regex: q, $options: 'i' } }, { participants: { $in: userIds } }]
              }
            : {})
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
                sender: 1,
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
                username: 1,
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
          username: {
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
                  in: '$$otherParticipant.username' // Lấy username của participant không phải user_id
                }
              },
              else: '$username' // Giữ nguyên username nếu type != Private
            }
          },
          avatar: {
            $cond: {
              if: {
                $and: [{ $ne: ['$avatar', null] }, { $ne: ['$avatar', ''] }]
              },
              then: '$avatar', // nếu conversation có avatar -> dùng nó
              else: {
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
                      input: {
                        $slice: [
                          {
                            $filter: {
                              input: '$participants',
                              as: 'participant',
                              cond: {
                                $and: [{ $ne: ['$$participant.avatar', null] }, { $ne: ['$$participant.avatar', ''] }]
                              }
                            }
                          },
                          4
                        ]
                      },
                      as: 'participant',
                      in: '$$participant.avatar'
                    }
                  }
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
      },
      deletedFor: {
        $nin: [new ObjectId(user_id)]
      },
      ...(q
        ? {
            $or: [{ name: { $regex: q, $options: 'i' } }, { participants: { $in: userIds } }]
          }
        : {})
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
      // Lấy lastMessage
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessage',
          pipeline: [
            {
              $project: {
                sender: 1,
                content: 1,
                created_at: 1
              }
            }
          ]
        }
      },
      // Lấy participants
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
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          name: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] },
              then: {
                $let: {
                  vars: {
                    other: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'p',
                            cond: { $ne: ['$$p._id', new ObjectId(user_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$other.name'
                }
              },
              else: '$name'
            }
          },
          username: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] },
              then: {
                $let: {
                  vars: {
                    other: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'p',
                            cond: { $ne: ['$$p._id', new ObjectId(user_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$other.username'
                }
              },
              else: '$username'
            }
          },
          avatar: {
            $cond: {
              if: {
                $and: [{ $ne: ['$avatar', null] }, { $ne: ['$avatar', ''] }]
              },
              then: '$avatar', // nếu conversation có avatar -> dùng nó
              else: {
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
                      input: {
                        $slice: [
                          {
                            $filter: {
                              input: '$participants',
                              as: 'participant',
                              cond: {
                                $and: [{ $ne: ['$$participant.avatar', null] }, { $ne: ['$$participant.avatar', ''] }]
                              }
                            }
                          },
                          4
                        ]
                      },
                      as: 'participant',
                      in: '$$participant.avatar'
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]).next()

    await this.updateConvDeleted(id)

    if (!conversation) {
      throw new NotFoundError('Không tìm thấy cuộc trò chuyện.')
    }

    return conversation
  }

  async updateLastMessageAndStatus({
    sender_id,
    message_id,
    conversation_id
  }: {
    sender_id: string
    message_id: string
    conversation_id: string
  }) {
    // 1. Update lastMessage + readStatus
    const updated = await ConversationCollection.findOneAndUpdate(
      { _id: new ObjectId(conversation_id) },
      [
        {
          $set: {
            lastMessage: new ObjectId(message_id),
            deletedFor: [],
            readStatus: {
              $map: {
                input: {
                  $filter: {
                    input: '$participants',
                    cond: { $ne: ['$$this', new ObjectId(sender_id)] }
                  }
                },
                as: 'id',
                in: '$$id'
              }
            },
            updatedAt: '$$NOW'
          }
        }
      ],
      { returnDocument: 'after' }
    )

    if (!updated?._id) return null

    const participants = updated.participants as ObjectId[]

    // 2. Build conversation cho từng viewer và emit
    for (const viewerId of participants) {
      const fullForViewer = await ConversationCollection.aggregate<ConversationSchema>([
        { $match: { _id: updated._id } },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participants',
            pipeline: [{ $project: { name: 1, avatar: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: 'lastMessage',
            foreignField: '_id',
            as: 'lastMessage',
            pipeline: [{ $project: { created_at: 1, sender: 1, content: 1 } }]
          }
        },
        { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            name: {
              $cond: {
                if: { $eq: ['$type', EConversationType.Private] },
                then: {
                  $let: {
                    vars: {
                      other: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$participants',
                              as: 'p',
                              cond: { $ne: ['$$p._id', viewerId] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: '$$other.name'
                  }
                },
                else: '$name'
              }
            },
            avatar: {
              $cond: {
                if: { $eq: ['$type', EConversationType.Private] },
                then: {
                  $let: {
                    vars: {
                      other: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$participants',
                              as: 'p',
                              cond: { $ne: ['$$p._id', viewerId] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: '$$other.avatar'
                  }
                },
                else: {
                  $map: {
                    input: '$participants',
                    as: 'p',
                    in: '$$p.avatar'
                  }
                }
              }
            }
          }
        }
      ]).next()

      if (fullForViewer) {
        ConversationGateway.changeConversation(fullForViewer, viewerId.toString())
      }
    }

    // 3. Return conversation đúng định dạng cho sender (người gọi API)
    // => chính là conversationForViewer ứng với sender_id
    const conversationForSender = await ConversationCollection.aggregate<ConversationSchema>([
      { $match: { _id: updated._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessage',
          pipeline: [{ $project: { created_at: 1, sender: 1, content: 1 } }]
        }
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          name: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] },
              then: {
                $let: {
                  vars: {
                    other: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'p',
                            cond: { $ne: ['$$p._id', new ObjectId(sender_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$other.name'
                }
              },
              else: '$name'
            }
          },
          avatar: {
            $cond: {
              if: { $eq: ['$type', EConversationType.Private] },
              then: {
                $let: {
                  vars: {
                    other: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$participants',
                            as: 'p',
                            cond: { $ne: ['$$p._id', new ObjectId(sender_id)] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$other.avatar'
                }
              },
              else: {
                $map: {
                  input: '$participants',
                  as: 'p',
                  in: '$$p.avatar'
                }
              }
            }
          }
        }
      }
    ]).next()

    return conversationForSender
  }

  async read({ user_id, conv_id }: { conv_id: string; user_id: string }) {
    //
    const updated = await ConversationCollection.findOneAndUpdate(
      { _id: new ObjectId(conv_id) },
      { $pull: { readStatus: new ObjectId(user_id) } },
      { returnDocument: 'after' }
    )

    //
    const full = await ConversationCollection.aggregate<ConversationSchema>([
      { $match: { _id: updated?._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
          pipeline: [
            {
              $project: {
                name: 1,
                avatar: 1
              }
            }
          ]
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
                created_at: 1,
                sender: 1,
                content: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
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
    ]).next()

    //
    if (full) {
      ConversationGateway.changeConversation(full, user_id)
    }

    //
    return full
  }

  async countUnread(user_id: string) {
    return await ConversationCollection.countDocuments({
      readStatus: { $in: [new ObjectId(user_id)] },
      deletedFor: {
        $nin: [new ObjectId(user_id)]
      }
    })
  }

  async delete({ user_id, conv_id }: { conv_id: string; user_id: string }) {
    const session = database.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        // Pull user ra khỏi participants
        const updated = await ConversationCollection.findOneAndUpdate(
          { _id: new ObjectId(conv_id) },
          { $push: { deletedFor: new ObjectId(user_id) } },
          {
            returnDocument: 'after',
            projection: { participants: 1, deletedFor: 1 },
            session
          }
        )

        // Nếu không tìm thấy => conversation_id không hợp lệ
        if (!updated) {
          throw new BadRequestError('Cuộc trò chuyện không tồn tại')
        }

        // Nếu participants bằng deletedFor => xoá luôn conversation + messages
        if (updated.deletedFor?.length === updated.participants?.length) {
          await MessagesService.deleteConversationMessages(conv_id)
          await ConversationCollection.deleteOne({ _id: new ObjectId(conv_id) })
        }
      })

      return true
    } catch (err) {
      console.error('Transaction failed:', err)
      throw err
    } finally {
      await session.endSession()
    }
  }

  async togglePinConv({ user_id, conv_id }: { user_id: string; conv_id: string }): Promise<'Ghim' | 'Gỡ ghim'> {
    const conv = await ConversationCollection.findOne({ _id: new ObjectId(conv_id) })
    if (!conv) throw new Error('Không tìm thấy cuộc trò chuyện')

    const userObjectId = new ObjectId(user_id)

    const alreadyPinned = conv.pinned?.some((p) => p.user_id.equals(userObjectId))

    if (alreadyPinned) {
      // unpin
      await ConversationCollection.updateOne(
        { _id: new ObjectId(conv_id) },
        { $pull: { pinned: { user_id: userObjectId } } }
      )
      return 'Gỡ ghim'
    } else {
      // pin
      await ConversationCollection.updateOne(
        { _id: new ObjectId(conv_id) },
        { $push: { pinned: { user_id: userObjectId, at: new Date() } } }
      )
      return 'Ghim'
    }
  }

  async addParticipants({
    conv_id,
    user_id,
    participants
  }: {
    user_id: string
    conv_id: string
    participants: string[]
  }) {
    //
    const conv = await ConversationCollection.findOne({ _id: new ObjectId(conv_id) })
    if (!conv) throw new Error('Không tìm thấy cuộc trò chuyện')

    //
    const exists = conv.participants.some((p) => p.equals(user_id))
    if (!exists) {
      throw new BadRequestError('Bạn không phải là thành viên của cuộc trò chuyện này.')
    }

    //
    const currentCount = conv.participants.length
    const newCount = currentCount + participants.length

    if (newCount > 50) {
      throw new BadRequestError('Số lượng thành viên không được vượt quá 50 người.')
    }

    //
    await ConversationCollection.updateOne(
      { _id: new ObjectId(conv._id) },
      {
        $addToSet: {
          participants: {
            $each: participants.map((id) => new ObjectId(id))
          }
        }
      }
    )
  }

  async removeParticipants({
    conv_id,
    user_id,
    participant
  }: {
    user_id: string
    conv_id: string
    participant: string
  }): Promise<string> {
    let mess = 'Rời'

    const conv = await ConversationCollection.findOne({ _id: new ObjectId(conv_id) })
    if (!conv) throw new NotFoundError('Không tìm thấy cuộc trò chuyện')

    const userObjectId = new ObjectId(user_id)
    const participantObjectId = new ObjectId(participant)

    // Kiểm tra user gọi có trong nhóm
    const exists = conv.participants.some((p) => p.equals(userObjectId))
    if (!exists) throw new BadRequestError('Bạn không phải là thành viên của cuộc trò chuyện này.')

    // Nếu user xoá người khác → cần là mentor
    const existMentorCaller = conv.mentors?.some((p) => p.equals(userObjectId)) ?? false

    if (user_id !== participant) {
      mess = 'Xoá thành viên khỏi'

      const existMentorTarget = conv.mentors?.some((p) => p.equals(participantObjectId)) ?? false

      if (!existMentorCaller) {
        throw new BadRequestError('Bạn không phải là trưởng nhóm của cuộc trò chuyện này.')
      }

      if (existMentorTarget) {
        throw new BadRequestError('Bạn không thể xoá thành viên cùng cấp trưởng nhóm với bạn.')
      }
    } else {
      // Tự rời nhóm
      if (existMentorCaller && conv.mentors.length === 1) {
        throw new BadRequestError('Hãy cho một thành viên lên nhóm trưởng trước khi bạn rời cuộc trò chuyện.')
      }
    }

    // Xoá khỏi participants và mentors
    const updated = await ConversationCollection.findOneAndUpdate(
      { _id: conv._id },
      {
        $pull: {
          participants: participantObjectId,
          mentors: participantObjectId
        }
      },
      { returnDocument: 'after', projection: { participants: 1 } }
    )

    // Nếu không tìm thấy => conversation_id không hợp lệ
    if (!updated) {
      throw new BadRequestError('Cuộc trò chuyện không tồn tại.')
    }

    // Nếu participants trống => xoá luôn conversation + messages
    if (updated.participants?.length === 0) {
      await MessagesService.deleteConversationMessages(conv_id)
      await ConversationCollection.deleteOne({ _id: new ObjectId(conv_id) })
    }

    // Gửi thông báo chỉ khi bị xoá
    if (user_id !== participant) {
      await NotificationService.createInQueue({
        content: `Bạn đã bị xoá khỏi nhóm ${conv?.name || 'cuộc trò chuyện'}.`,
        type: ENotificationType.Other,
        sender: user_id,
        receiver: participant
      })
    }

    return mess
  }

  async promoteMentor({ conv_id, user_id, participant }: { user_id: string; conv_id: string; participant: string }) {
    const conv = await ConversationCollection.findOne({ _id: new ObjectId(conv_id) })
    if (!conv) throw new NotFoundError('Không tìm thấy cuộc trò chuyện')

    const userObjectId = new ObjectId(user_id)
    const participantObjectId = new ObjectId(participant)

    // Kiểm tra user có trong nhóm
    const exists = conv.participants.some((p) => p.equals(userObjectId))
    if (!exists) throw new BadRequestError('Bạn không phải là thành viên của cuộc trò chuyện này.')

    // Không tự promote bản thân
    if (user_id === participant) throw new BadRequestError('Bạn không thể tự cho bạn là nhóm trưởng.')

    // Kiểm tra quyền người gọi
    const isMentorCaller = conv.mentors?.some((p) => p.equals(userObjectId)) ?? false
    if (!isMentorCaller) throw new BadRequestError('Bạn không phải là trưởng nhóm của cuộc trò chuyện này.')

    // Kiểm tra người được promote có phải mentor chưa
    const alreadyMentor = conv.mentors?.some((p) => p.equals(participantObjectId)) ?? false
    if (alreadyMentor) throw new BadRequestError('Người này đã là trưởng nhóm rồi.')

    // Cập nhật
    await ConversationCollection.updateOne({ _id: conv._id }, { $addToSet: { mentors: participantObjectId } })

    // Gửi thông báo
    await NotificationService.createInQueue({
      content: `Bạn đã trở thành nhóm trưởng của cuộc trò chuyện ${conv?.name || ''}.`,
      type: ENotificationType.Other,
      sender: user_id,
      receiver: participant
    })
  }

  // Cập nhật lại deleteFor = [] khi có tin nhắn mới
  private async updateConvDeleted(conv_id: string) {
    await ConversationCollection.updateOne({ _id: new ObjectId(conv_id) }, { $set: { deletedFor: [] } })
  }
}

export default new ConversationsService()
