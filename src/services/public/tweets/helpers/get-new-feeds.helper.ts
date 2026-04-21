import { ObjectId } from 'mongodb'
import { EFeedType, EFeedTypeItem, ETweetAudience, ETweetStatus, ETweetType } from '~/shared/enums/public/tweets.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import followsService from '../../follows.service'
import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '~/schemas/public/tweet.schema'
import { COLLECTION_USERS_NAME } from '~/schemas/public/user.schema'
import { EUserStatus } from '~/shared/enums/public/users.enum'
import { COLLECTION_BOOKMARKS_NAME } from '~/schemas/public/bookmark.schema'
import { COLLECTION_LIKES_NAME } from '~/schemas/public/like.schema'
import {
  COLLECTION_MEMBER_NAME,
  COLLECTION_MENTOR_NAME,
  CommunitiesCollection,
  CommunitiesSchema
} from '~/schemas/public/community.schema'
import { EMembershipType } from '~/shared/enums/public/communities.enum'
import tweetsService from '../tweets.service'

export async function getNewFeedsHelper({
  query,
  feed_type,
  user_active_id
}: {
  feed_type: EFeedType
  query: IQuery<ITweet>
  user_active_id: string
}): Promise<ResMultiType<ITweet>> {
  //
  const activeObjectId = new ObjectId(user_active_id)
  const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

  //
  const followed_user_ids = await followsService.getUserFollowingIds(user_active_id)
  followed_user_ids.push(user_active_id)

  // Dynamic match condition based on feed type
  let match_condition: any

  //
  switch (feed_type) {
    case EFeedType.Everyone: {
      // Chỉ tweets công khai từ tất cả mọi người
      match_condition = {
        audience: ETweetAudience.Everyone
      }
      break
    }

    case EFeedType.Following: {
      // Chỉ tweets following
      match_condition = {
        user_id: { $in: followed_user_ids.map((id) => new ObjectId(id)) }
      }
      break
    }

    default:
      match_condition = {
        $or: [
          { audience: ETweetAudience.Everyone },
          { audience: ETweetAudience.Mentions, mentions: { $in: [user_active_id] } },
          { $and: [{ audience: ETweetAudience.Followers }, { user_id: { $in: followed_user_ids } }] }
        ]
      }
  }

  //
  const skipCom = Math.floor(skip / 3) // Giả sử cứ 3 bài viết sẽ có 1 bài trong cộng đồng, thì skip của cộng đồng sẽ là skip/3
  const [tweets, communities] = await Promise.all([
    //
    TweetsCollection.aggregate<TweetsSchema>([
      {
        $match: {
          status: ETweetStatus.Ready,
          community_id: { $eq: null }, // Chỉ lấy những bài viết không trong cộng đồng
          ...match_condition
        }
      },
      {
        $match: { type: { $ne: ETweetType.Comment } }
      },

      // --- BƯỚC THÊM MỚI: Kiểm tra status người dùng ---
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'user_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $match: {
          $or: [{ 'author._id': new ObjectId(user_active_id) }, { 'author.status.status': { $ne: EUserStatus.Hidden } }]
        }
      },
      // ----------------------------------------------

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
          from: COLLECTION_USERS_NAME,
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id',
          pipeline: [
            {
              $project: {
                avatar: 1,
                bio: 1,
                name: 1,
                username: 1,
                verify: 1,
                cover_photo: 1,
                day_of_birth: 1,
                location: 1,
                website: 1,
                isPinnedReel: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$user_id',
          preserveNullAndEmptyArrays: true
        }
      },

      // lookup để kiểm tra user hiện tại có follow user_id không
      {
        $lookup: {
          from: 'followers',
          let: { target_user_id: '$user_id._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followed_user_id', '$$target_user_id'] },
                    { $eq: ['$user_id', new ObjectId(user_active_id)] }
                  ]
                }
              }
            }
          ],
          as: 'userFollowCheck'
        }
      },
      {
        $addFields: {
          'user_id.isFollow': { $gt: [{ $size: '$userFollowCheck' }, 0] }
        }
      },
      {
        $project: {
          userFollowCheck: 0 // xoá field tạm
        }
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags',
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1,
                verify: 1,
                bio: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: COLLECTION_BOOKMARKS_NAME,
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks',
          pipeline: [
            {
              $project: {
                user_id: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: COLLECTION_LIKES_NAME,
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes',
          pipeline: [
            {
              $project: {
                user_id: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: COLLECTION_TWEETS_NAME,
          localField: '_id',
          foreignField: 'parent_id',
          as: 'tweets_children'
        }
      },
      {
        $addFields: {
          is_like: {
            $in: [new ObjectId(user_active_id), '$likes.user_id']
          },
          is_bookmark: {
            $in: [new ObjectId(user_active_id), '$bookmarks.user_id']
          },
          // lấy id retweet của user (1 cái đầu tiên hoặc null)
          retweet: {
            $let: {
              vars: {
                matched: {
                  $filter: {
                    input: '$tweets_children',
                    as: 'child',
                    cond: {
                      $and: [
                        { $eq: ['$$child.type', ETweetType.Retweet] },
                        { $eq: ['$$child.user_id', new ObjectId(user_active_id)] }
                      ]
                    }
                  }
                }
              },
              in: { $arrayElemAt: ['$$matched._id', 0] }
            }
          },
          // lấy id quote tweet của user (1 cái đầu tiên hoặc null)
          quote: {
            $let: {
              vars: {
                matched: {
                  $filter: {
                    input: '$tweets_children',
                    as: 'child',
                    cond: {
                      $and: [
                        { $eq: ['$$child.type', ETweetType.QuoteTweet] },
                        { $eq: ['$$child.user_id', new ObjectId(user_active_id)] }
                      ]
                    }
                  }
                }
              },
              in: { $arrayElemAt: ['$$matched._id', 0] }
            }
          },
          comments_count: {
            $size: {
              $filter: {
                input: '$tweets_children',
                as: 'tweet',
                cond: {
                  $eq: ['$$tweet.type', ETweetType.Comment]
                }
              }
            }
          },
          retweets_count: {
            $size: {
              $filter: {
                input: '$tweets_children',
                as: 'tweet',
                cond: {
                  $eq: ['$$tweet.type', ETweetType.Retweet]
                }
              }
            }
          },
          quotes_count: {
            $size: {
              $filter: {
                input: '$tweets_children',
                as: 'tweet',
                cond: {
                  $eq: ['$$tweet.type', ETweetType.QuoteTweet]
                }
              }
            }
          }
        }
      }
    ]).toArray(),

    //
    feed_type !== EFeedType.Following &&
      CommunitiesCollection.aggregate<CommunitiesSchema>([
        // 1️⃣ Chỉ lấy community mở
        { $match: { membership_type: EMembershipType.Open, admin: { $ne: activeObjectId } } },

        // 2️⃣ Join sang bảng mentor
        {
          $lookup: {
            from: COLLECTION_MENTOR_NAME,
            localField: '_id',
            foreignField: 'community_id',
            as: 'mentors'
          }
        },

        // 3️⃣ Join sang bảng member
        {
          $lookup: {
            from: COLLECTION_MEMBER_NAME,
            localField: '_id',
            foreignField: 'community_id',
            as: 'members'
          }
        },

        // 4️⃣ Lọc bỏ community mà user đã là mentor hoặc member
        {
          $match: {
            'mentors.user_id': { $ne: activeObjectId },
            'members.user_id': { $ne: activeObjectId }
          }
        },

        { $sort: sort },
        { $skip: skipCom },
        { $limit: 2 },
        {
          $unwind: {
            path: '$admin',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            mentors: 0,
            members: 0,
            pin: 0,
            bio: 0
          }
        }
      ]).toArray()
  ])

  // Increase views
  const date = new Date()
  const ids = tweets.map((tweet) => tweet._id as ObjectId)
  const [total] = await Promise.all([
    TweetsCollection.countDocuments(match_condition),
    TweetsCollection.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      {
        $inc: { user_view: 1 },
        $set: {
          updated_at: date
        }
      }
    )
  ])

  // Cập nhật updated_at và tăng số lần xem
  tweets.forEach((tweet) => {
    tweet.updated_at = date
    if (user_active_id) {
      tweet.user_view += 1
    } else {
      tweet.guest_view += 1
    }
  })

  return {
    total,
    total_page: Math.ceil(total / limit),
    items: tweetsService.signedCloudfrontMediaUrls(tweets) as TweetsSchema[],
    extra: { type: EFeedTypeItem.Community, items: communities || [] }
  }
}
