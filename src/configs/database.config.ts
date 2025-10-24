import { Db, MongoClient, ServerApiVersion } from 'mongodb'
import { envs } from '~/configs/env.config'
import { initBookmarkCollection } from '~/models/schemas/Bookmark.schema'
import {
  CommunityCollection,
  CommunityInvitationCollection,
  CommunityMemberCollection,
  CommunityMentorCollection,
  CommunityPinCollection,
  initCommunityCollection,
  initCommunityInvitationCollection,
  initCommunityMemberCollection,
  initCommunityMentorCollection,
  initCommunityPinCollection
} from '~/models/schemas/Community.schema'
import { ConversationCollection, initConversationCollection } from '~/models/schemas/Conversation.schema'
import { initFollowerCollection } from '~/models/schemas/Follower.schema'
import { HashtagCollection, initHashtagCollection } from '~/models/schemas/Hashtag.schema'
import { initLikeCollection } from '~/models/schemas/Like.schema'
import { initMessageCollection, MessageCollection } from '~/models/schemas/Message.schema'
import { initNotificationCollection } from '~/models/schemas/Notification.schema'
import { initRefreshTokenCollection, RefreshTokenCollection } from '~/models/schemas/RefreshToken.schema'
import { initReportTweetCollection, ReportTweetCollection } from '~/models/schemas/ReportTweet.schema'
import { initTrendingCollection, TrendingCollection } from '~/models/schemas/Trending.schema'
import { initTweetCollection, TweetCollection } from '~/models/schemas/Tweet.schema'
import { initUserCollection, UserCollection } from '~/models/schemas/User.schema'
import { initVideoCollection } from '~/models/schemas/Video.schema'
import { logger } from '~/utils/logger.util'

class DatabaseConfig {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(
      `mongodb+srv://${envs.DB_USERNAME}:${envs.DB_PASSWORD}@cluster0-liemdev.dfynfof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-LiemDev`,
      {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true
        }
      }
    )
    this.db = this.client.db(envs.DB_NAME)
  }

  async connect() {
    await this.client.connect()
    await this.db.command({ ping: 1 })
    logger.info('Pinged your deployment. You successfully connected to MongoDB!')
  }

  async disconnect() {
    await this.client.close()
    logger.info('Disconnected from MongoDB')
  }

  initialCollections() {
    initUserCollection(this.db)
    initRefreshTokenCollection(this.db)
    initFollowerCollection(this.db)
    initVideoCollection(this.db)
    initTweetCollection(this.db)
    initHashtagCollection(this.db)
    initBookmarkCollection(this.db)
    initLikeCollection(this.db)
    initConversationCollection(this.db)
    initMessageCollection(this.db)
    initTrendingCollection(this.db)
    initNotificationCollection(this.db)
    initReportTweetCollection(this.db)
    initCommunityCollection(this.db)
    initCommunityMentorCollection(this.db)
    initCommunityMemberCollection(this.db)
    initCommunityPinCollection(this.db)
    initCommunityInvitationCollection(this.db)
  }

  async initialIndex() {
    const indexUser = await UserCollection.indexExists(['email_1', 'username_1', 'bio_text'])
    const indexReportTweet = await ReportTweetCollection.indexExists(['tweet_id_1'])
    const indexRefresh = await RefreshTokenCollection.indexExists(['token_1', 'exp_1'])
    const indexTweet = await TweetCollection.indexExists(['content_text'])
    const indexTrending = await TweetCollection.indexExists(['slug_1', 'created_at_-1'])
    const indexHashtag = await HashtagCollection.indexExists(['slug_1'])
    const indexMessage = await HashtagCollection.indexExists(['conversation_id_1_created_at_-1'])
    const indexConversation = await HashtagCollection.indexExists(['name_1'])
    const indexCommunity = await CommunityCollection.indexExists([
      'name_1',
      'slug_1',
      'bio_text',
      'visibilityType_1',
      'membershipType_1'
    ])
    const indexCommunityMentor = await CommunityMentorCollection.indexExists(['community_id_1', 'user_id_1'])
    const indexCommunityMember = await CommunityMemberCollection.indexExists(['community_id_1', 'user_id_1'])
    const indexCommunityPin = await CommunityPinCollection.indexExists(['community_id_1', 'user_id_1'])
    const indexCommunityInvitation = await CommunityPinCollection.indexExists(['community_id_1', 'user_id_1', 'exp_1'])

    // User
    if (!indexUser) {
      UserCollection.createIndex({ email: 1 }, { unique: true })
      UserCollection.createIndex({ username: 1 }, { unique: true })
      UserCollection.createIndex({ bio: 'text' }, { default_language: 'none' })
    }

    // Report
    if (!indexReportTweet) {
      ReportTweetCollection.createIndex({ tweet_id: 1 }, { unique: true })
    }

    // Refresh
    if (!indexRefresh) {
      RefreshTokenCollection.createIndex({ token: 1 }, { unique: true })
      RefreshTokenCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }

    // Tweet - default_language: 'none' -> cho phép sử dụng stop words
    if (!indexTweet) {
      TweetCollection.createIndex({ content: 'text' }, { default_language: 'none' }) // Hoạt động trên đoạn văn tốt => q=word
    }

    // Trending
    if (!indexTrending) {
      TrendingCollection.createIndex({ slug: 1 }, { unique: true })
      TrendingCollection.createIndex({ created_at: -1 })
    }

    // Hashtag
    if (!indexHashtag) {
      HashtagCollection.createIndex({ slug: 1 }, { unique: true })
    }

    // Message
    if (!indexMessage) {
      MessageCollection.createIndex({ conversation_id: 1, created_at: -1 })
    }

    // Conversation
    if (!indexConversation) {
      ConversationCollection.createIndex({ name: 1 })
    }

    // Community
    if (!indexCommunity) {
      CommunityCollection.createIndex({ visibilityType: 1 })
      CommunityCollection.createIndex({ membershipType: 1 })
      CommunityCollection.createIndex({ name: 1 }, { unique: true })
      CommunityCollection.createIndex({ slug: 1 }, { unique: true })
      CommunityCollection.createIndex({ bio: 'text' }, { default_language: 'none' })
      // CommunityCollection.createIndex({ category: 'text' }, { default_language: 'none' })
    }

    // Community mentor
    if (!indexCommunityMentor) {
      CommunityMentorCollection.createIndex({ user_id: 1 })
      CommunityMentorCollection.createIndex({ community_id: 1 })
      CommunityMentorCollection.createIndex({ community_id: 1, user_id: 1 }, { unique: true })
    }

    // Community member
    if (!indexCommunityMember) {
      CommunityMemberCollection.createIndex({ user_id: 1 })
      CommunityMemberCollection.createIndex({ community_id: 1 })
      CommunityMemberCollection.createIndex({ community_id: 1, user_id: 1 }, { unique: true })
    }

    // Community pin
    if (!indexCommunityPin) {
      CommunityPinCollection.createIndex({ user_id: 1 })
      CommunityPinCollection.createIndex({ community_id: 1 })
      CommunityPinCollection.createIndex({ community_id: 1, user_id: 1 }, { unique: true })
    }

    // CommunityInvitation
    if (!indexCommunityInvitation) {
      CommunityInvitationCollection.createIndex({ user_id: 1 })
      CommunityPinCollection.createIndex({ community_id: 1 })
      CommunityInvitationCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
      CommunityPinCollection.createIndex({ community_id: 1, user_id: 1 }, { unique: true })
    }
  }

  getDb() {
    return this.db
  }

  getClient() {
    return this.client
  }
}

const database = new DatabaseConfig()
export default database
