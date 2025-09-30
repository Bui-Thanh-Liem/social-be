import { count } from 'console'
import { InsertOneResult, ObjectId } from 'mongodb'
import database from '~/configs/database.config'
import cacheServiceInstance from '~/helpers/cache.helper'
import { ConversationCollection, ConversationSchema } from '~/models/schemas/Conversation.schema'
import { MessageCollection } from '~/models/schemas/Message.schema'
import { BadRequestError, NotFoundError } from '~/shared/classes/error.class'
import { CreateConversationDto } from '~/shared/dtos/req/conversation.dto'
import { EConversationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getSocket } from '~/socket'
import ConversationGateway from '~/socket/gateways/Conversation.gateway'
import { createKeyAllConversationIds } from '~/utils/createKeyCache.util'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'

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
    const { skip, limit, sort } = getPaginationAndSafeQuery<IConversation>(query)

    //
    const conversations = await ConversationCollection.aggregate<ConversationSchema>([
      {
        $match: {
          participants: {
            $in: [new ObjectId(user_id)]
          },
          deletedFor: {
            $nin: [new ObjectId(user_id)]
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
      },
      deletedFor: {
        $nin: [new ObjectId(user_id)]
      }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: conversations
    }
  }

  // async getOneById(id: string, user_id: string) {
  //   if (!id) throw new BadRequestError('Id không hợp lệ')

  //   const conversation = await ConversationCollection.aggregate<ConversationSchema>([
  //     {
  //       $match: {
  //         _id: new ObjectId(id)
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'messages',
  //         localField: 'lastMessage',
  //         foreignField: '_id',
  //         as: 'lastMessage',
  //         pipeline: [
  //           {
  //             $project: {
  //               sender: 1,
  //               content: 1,
  //               created_at: 1
  //             }
  //           }
  //         ]
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'participants',
  //         foreignField: '_id',
  //         as: 'participants',
  //         pipeline: [
  //           {
  //             $project: {
  //               _id: 1,
  //               name: 1,
  //               avatar: 1
  //             }
  //           }
  //         ]
  //       }
  //     },
  //     {
  //       $unwind: {
  //         path: '$lastMessage',
  //         preserveNullAndEmptyArrays: true
  //       }
  //     },
  //     {
  //       $addFields: {
  //         name: {
  //           $cond: {
  //             if: { $eq: ['$type', EConversationType.Private] }, // Kiểm tra nếu type = Private
  //             then: {
  //               $let: {
  //                 vars: {
  //                   otherParticipant: {
  //                     $arrayElemAt: [
  //                       {
  //                         $filter: {
  //                           input: '$participants',
  //                           as: 'participant',
  //                           cond: { $ne: ['$$participant._id', new ObjectId(user_id)] }
  //                         }
  //                       },
  //                       0
  //                     ]
  //                   }
  //                 },
  //                 in: '$$otherParticipant.name' // Lấy name của participant không phải user_id
  //               }
  //             },
  //             else: '$name' // Giữ nguyên name nếu type != Private
  //           }
  //         },
  //         avatar: {
  //           $cond: {
  //             if: { $eq: ['$type', EConversationType.Private] },
  //             then: {
  //               $let: {
  //                 vars: {
  //                   otherParticipant: {
  //                     $arrayElemAt: [
  //                       {
  //                         $filter: {
  //                           input: '$participants',
  //                           as: 'participant',
  //                           cond: { $ne: ['$$participant._id', new ObjectId(user_id)] }
  //                         }
  //                       },
  //                       0
  //                     ]
  //                   }
  //                 },
  //                 in: '$$otherParticipant.avatar'
  //               }
  //             },
  //             else: {
  //               $map: {
  //                 input: '$participants',
  //                 as: 'participant',
  //                 in: '$$participant.avatar' // Lấy tất cả avatar của participants (mảng chuỗi)
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   ]).next()

  //   if (!conversation) {
  //     throw new NotFoundError('Không tìm thấy cuộc trò chuyện')
  //   }

  //   return conversation
  // }

  // async updateLastMessageAndStatus({
  //   sender_id,
  //   message_id,
  //   conversation_id
  // }: {
  //   sender_id: string
  //   message_id: string
  //   conversation_id: string
  // }) {
  //   //
  //   const updated = await ConversationCollection.findOneAndUpdate(
  //     { _id: new ObjectId(conversation_id) },
  //     [
  //       {
  //         $set: {
  //           lastMessage: new ObjectId(message_id),
  //           readStatus: {
  //             $map: {
  //               input: {
  //                 $filter: {
  //                   input: '$participants',
  //                   cond: { $ne: ['$$this', new ObjectId(sender_id)] }
  //                 }
  //               },
  //               as: 'id',
  //               in: '$$id'
  //             }
  //           },
  //           updatedAt: '$$NOW'
  //         }
  //       }
  //     ],
  //     { returnDocument: 'after' }
  //   )

  //   //
  //   const full = await ConversationCollection.aggregate<ConversationSchema>([
  //     { $match: { _id: updated?._id } },
  //     {
  //       $lookup: {
  //         from: 'users',
  //         localField: 'participants',
  //         foreignField: '_id',
  //         as: 'participants',
  //         pipeline: [
  //           {
  //             $project: {
  //               name: 1,
  //               avatar: 1
  //             }
  //           }
  //         ]
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'messages',
  //         localField: 'lastMessage',
  //         foreignField: '_id',
  //         as: 'lastMessage',
  //         pipeline: [
  //           {
  //             $project: {
  //               created_at: 1,
  //               sender: 1,
  //               content: 1
  //             }
  //           }
  //         ]
  //       }
  //     },
  //     { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
  //     {
  //       $addFields: {
  //         name: {
  //           $cond: {
  //             if: { $eq: ['$type', EConversationType.Private] }, // Kiểm tra nếu type = Private
  //             then: {
  //               $let: {
  //                 vars: {
  //                   otherParticipant: {
  //                     $arrayElemAt: [
  //                       {
  //                         $filter: {
  //                           input: '$participants',
  //                           as: 'participant',
  //                           cond: { $ne: ['$$participant._id', new ObjectId(sender_id)] }
  //                         }
  //                       },
  //                       0
  //                     ]
  //                   }
  //                 },
  //                 in: '$$otherParticipant.name' // Lấy name của participant không phải user_id
  //               }
  //             },
  //             else: '$name' // Giữ nguyên name nếu type != Private
  //           }
  //         },
  //         avatar: {
  //           $cond: {
  //             if: { $eq: ['$type', EConversationType.Private] },
  //             then: {
  //               $let: {
  //                 vars: {
  //                   otherParticipant: {
  //                     $arrayElemAt: [
  //                       {
  //                         $filter: {
  //                           input: '$participants',
  //                           as: 'participant',
  //                           cond: { $ne: ['$$participant._id', new ObjectId(sender_id)] }
  //                         }
  //                       },
  //                       0
  //                     ]
  //                   }
  //                 },
  //                 in: '$$otherParticipant.avatar'
  //               }
  //             },
  //             else: {
  //               $map: {
  //                 input: '$participants',
  //                 as: 'participant',
  //                 in: '$$participant.avatar' // Lấy tất cả avatar của participants (mảng chuỗi)
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   ]).next()

  //   //
  //   if (full?.readStatus) {
  //     full?.readStatus?.forEach((userId) => {
  //       if (userId) {
  //         ConversationGateway.changeConversation(full, userId.toString())
  //       }
  //     })
  //   }

  //   return full
  // }

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
                            cond: { $ne: ['$$p._id', new ObjectId(user_id)] }
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

    await this.updateConvDeleted(id)

    if (!conversation) {
      throw new NotFoundError('Không tìm thấy cuộc trò chuyện')
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

  async readConversation({ user_id, conversation_id }: { conversation_id: string; user_id: string }) {
    //
    const updated = await ConversationCollection.findOneAndUpdate(
      { _id: new ObjectId(conversation_id) },
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

  async countUnreadConv(user_id: string) {
    return await ConversationCollection.countDocuments({
      readStatus: { $in: [new ObjectId(user_id)] },
      deletedFor: {
        $nin: [new ObjectId(user_id)]
      }
    })
  }

  async delete({ user_id, conversation_id }: { conversation_id: string; user_id: string }) {
    const session = database.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        // Pull user ra khỏi participants
        const updated = await ConversationCollection.findOneAndUpdate(
          { _id: new ObjectId(conversation_id) },
          { $push: { deletedFor: new ObjectId(user_id) } },
          { returnDocument: 'after', projection: { participants: 1, deletedFor: 1 }, session }
        )

        // Nếu không tìm thấy => conversation_id không hợp lệ
        if (!updated) {
          throw new BadRequestError('Conversation không tồn tại')
        }

        // Nếu participants rỗng => xoá luôn conversation + messages
        console.log('updated:::', updated)
        console.log(
          'updated.deletedFor?.length === updated.participants?.length:::',
          updated.deletedFor?.length === updated.participants?.length
        )

        if (updated.deletedFor?.length === updated.participants?.length) {
          await MessageCollection.deleteMany({ conversation: new ObjectId(conversation_id) }, { session })
          await ConversationCollection.deleteOne({ _id: new ObjectId(conversation_id) }, { session })
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

  private async updateConvDeleted(conv_id: string) {
    await ConversationCollection.updateOne({ _id: new ObjectId(conv_id) }, { $set: { deletedFor: [] } })
  }
}

export default new ConversationsService()
