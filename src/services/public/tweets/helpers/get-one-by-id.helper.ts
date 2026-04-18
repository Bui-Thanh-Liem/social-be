import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '~/schemas/public/tweet.schema'
import followsService from '../../follows.service'
import { ObjectId } from 'mongodb'
import { ETweetAudience, ETweetStatus, ETweetType } from '~/shared/enums/public/tweets.enum'
import { COLLECTION_USERS_NAME } from '~/schemas/public/user.schema'
import { EUserStatus } from '~/shared/enums/public/users.enum'
import { COLLECTION_COMMUNITIES_NAME, CommunitiesSchema } from '~/schemas/public/community.schema'
import { COLLECTION_BOOKMARKS_NAME } from '~/schemas/public/bookmark.schema'
import { COLLECTION_LIKES_NAME } from '~/schemas/public/like.schema'
import { ForbiddenError } from '~/core/error.response'
import { EVisibilityType } from '~/shared/enums/public/communities.enum'

export async function getOneByIdHelper({
  id,
  user_active_id
}: {
  id: string
  user_active_id: string
}): Promise<TweetsSchema | null> {
  const followed_user_ids = await followsService.getUserFollowing(user_active_id)
  followed_user_ids.push(user_active_id)

  //
  const userActiveObjectId = user_active_id ? new ObjectId(user_active_id) : null

  // 1. Định nghĩa điều kiện match (không đổi)
  const match_condition = {
    _id: new ObjectId(id),
    $and: [
      // Điều kiện về quyền xem (Audience) - Giữ nguyên logic
      {
        $or: [
          { audience: ETweetAudience.Everyone },
          { audience: ETweetAudience.Followers, user_id: { $in: followed_user_ids } },
          { audience: ETweetAudience.Mentions, mentions: { $in: [userActiveObjectId] } },
          { user_id: userActiveObjectId }
        ]
      },
      // ĐIỀU KIỆN STATUS: Tác giả xem bài của mình thì status gì cũng được,
      // người khác xem thì bài phải Ready
      {
        $or: [{ user_id: userActiveObjectId }, { status: ETweetStatus.Ready }]
      }
    ]
  }

  // 2. Aggregate để lấy chi tiết tweet (bỏ $addFields tính is_like, is_bookmark)
  const tweet_db = await TweetsCollection.aggregate<TweetsSchema>([
    {
      $match: match_condition
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
        'author.status.status': { $ne: EUserStatus.Hidden }
      }
    },
    // ----------------------------------------------

    {
      $lookup: {
        from: COLLECTION_USERS_NAME,
        localField: 'mentions',
        foreignField: '_id',
        as: 'mentions',
        pipeline: [{ $project: { name: 1, username: 1 } }]
      }
    },
    {
      $lookup: {
        from: COLLECTION_COMMUNITIES_NAME,
        localField: 'community_id',
        foreignField: '_id',
        as: 'community_id',
        pipeline: [{ $project: { _id: 1, name: 1, slug: 1, visibility_type: 1 } }]
      }
    },
    {
      $unwind: { path: '$community_id', preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: COLLECTION_USERS_NAME, // tên collection chứa user
        localField: 'user_id', // field trong tweet
        foreignField: '_id', // field trong user
        as: 'user_id',
        pipeline: [
          {
            $project: {
              avatar: 1,
              name: 1,
              bio: 1,
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
        path: '$user_id', // chuyển đổi array sang object
        preserveNullAndEmptyArrays: true // nếu user bị xóa vẫn trả về tweet - user_id: null
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
        from: COLLECTION_BOOKMARKS_NAME, // collection chứa bookmark
        localField: '_id', // _id của tweet
        foreignField: 'tweet_id', // field trong bookmark trỏ đến tweet
        as: 'bookmarks', // tên array chứa kết quả
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
        likes_count: { $size: '$likes' },
        // is_like: {
        //   $in: [new ObjectId(user_active_id), '$likes.user_id']
        // },
        // is_bookmark: {
        //   $in: [new ObjectId(user_active_id), '$bookmarks.user_id']
        // },
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
                      { $eq: ['$$child.user_id', userActiveObjectId] }
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
                      { $eq: ['$$child.user_id', userActiveObjectId] }
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
  ]).next()
  console.log('Get in DB')

  //
  if (tweet_db?.community_id) {
    const community = tweet_db?.community_id as unknown as CommunitiesSchema
    if (community.visibility_type === EVisibilityType.Private) {
      throw new ForbiddenError('Bài viết trong cộng đồng riêng tư không được phép xem ở chế độ này.')
    }
  }

  // 3. Trả về kết quả
  return tweet_db
}
