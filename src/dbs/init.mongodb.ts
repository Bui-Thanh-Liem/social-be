import { Db, MongoClient, ServerApiVersion, MongoClientOptions } from 'mongodb'
import { envs } from '~/configs/env.config'
import { initBookmarkCollection } from '~/models/schemas/Bookmark.schema'
import {
  CommunityActivityCollection,
  CommunityCollection,
  CommunityInvitationCollection,
  CommunityMemberCollection,
  CommunityMentorCollection,
  CommunityPinCollection,
  initCommunityActivityCollection,
  initCommunityCollection,
  initCommunityInvitationCollection,
  initCommunityMemberCollection,
  initCommunityMentorCollection,
  initCommunityPinCollection
} from '~/models/schemas/Community.schema'
import { ConversationCollection, initConversationCollection } from '~/models/schemas/Conversation.schema'
import { initFollowerCollection } from '~/models/schemas/Follower.schema'
import { HashtagCollection, initHashtagCollection } from '~/models/schemas/Hashtag.schema'
import { initLikeCollection, LikeCollection } from '~/models/schemas/Like.schema'
import { initMessageCollection, MessageCollection } from '~/models/schemas/Message.schema'
import { initNotificationCollection } from '~/models/schemas/Notification.schema'
import { initTokenCollection, TokenCollection } from '~/models/schemas/Token.schema'
import { initReportTweetCollection, ReportTweetCollection } from '~/models/schemas/Report-tweet.schema'
import { initSearchHistoryCollection, SearchHistoryCollection } from '~/models/schemas/SearchHistory.schema'
import { initTrendingCollection, TrendingCollection } from '~/models/schemas/Trending.schema'
import { initTweetCollection, TweetCollection } from '~/models/schemas/Tweet.schema'
import { initUserCollection, UserCollection } from '~/models/schemas/User.schema'
import { initVideoCollection } from '~/models/schemas/Video.schema'
import { BadRequestError, InternalServerError } from '~/core/error.response'
import { logger } from '~/utils/logger.util'

const _MINPOOLSIZE = 5
const _MAXPOOLSIZE = 20 // không bao giờ vượt, nếu hơn thì phải chờ
const _SECOND_DLE = 600000 // 10 phút
const _SOCKET_TIMEOUT_MS = 45000 // 45 giây
console.log('envs.DB_CONNECT_STRING :::', envs.DB_CONNECT_STRING)

class Database {
  private db: Db
  static client: MongoClient
  private isConnected: boolean = false
  private isConnecting: boolean = false
  static instance: Database | null = null

  // 1️⃣ PRIVATE constructor - Ngăn tạo instance từ bên ngoài
  private constructor() {
    // Chỉ khởi tạo client khi chưa có
    if (!Database.client) {
      Database.client = new MongoClient(envs.DB_CONNECT_STRING, {
        // serverApi: {
        //   deprecationErrors: true,
        //   version: ServerApiVersion.v1
        // },
        minPoolSize: _MINPOOLSIZE,
        maxPoolSize: _MAXPOOLSIZE,

        retryWrites: true,
        retryReads: true,

        socketTimeoutMS: _SOCKET_TIMEOUT_MS,
        monitorCommands: true,

        // 🆕 Các option quan trọng để giảm lỗi monitor timeout
        heartbeatFrequencyMS: 20000, // Gửi heartbeat chậm hơn: mỗi 20 giây thay vì 10 giây → ít nhạy cảm với latency ngắn
        connectTimeoutMS: 30000, // Thời gian chờ mở socket mới (default 30s, nhưng set rõ cho chắc)
        serverSelectionTimeoutMS: 30000 // Thời gian chọn server khi reconnect
        // maxIdleTimeMS: 300000,       // Optional: đóng connection idle sau 5 phút nếu muốn tiết kiệm
      })
    }
    this.db = Database.client.db(envs.DB_NAME)
  }

  // 2️⃣ PUBLIC getInstance() - Cách duy nhất để lấy instance
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  static getClient(): MongoClient {
    if (!Database.client) {
      throw new BadRequestError('Database client not initialized')
    }
    return Database.client
  }

  private checkConnection() {
    if (!this.isConnected) {
      throw new BadRequestError('Database not connected. Call connect() first')
    }
  }

  static async countConnections(): Promise<number> {
    try {
      if (!Database.instance?.isConnected) {
        return 0
      }
      const stats = await Database.instance.db.admin().serverStatus()
      return stats.connections.current
    } catch (error) {
      logger.error('Count connections failed:', error)
      return 0
    }
  }

  async connect() {
    try {
      // 🆕 Prevent multiple concurrent connections
      if (this.isConnecting) {
        logger.warn('Connection already in progress')
        return
      }

      if (this.isConnected) {
        logger.warn('Already connected to MongoDB')
        return
      }

      await Database.client.connect()
      console.log('[v0] After connect:', await Database.countConnections())

      await this.db.command({ ping: 1 })
      console.log('[v0] After ping:', await Database.countConnections())
      this.isConnected = true

      logger.info('Connected to MongoDB successfully')
    } catch (error) {
      this.isConnected = false // 🆕 Reset on error
      logger.error('MongoDB connection failed:', error)
      throw new InternalServerError('MongoDB connection failed') // Re-throw để app biết lỗi
    } finally {
      this.isConnecting = false // 🆕 Always reset flag
    }
  }

  async disconnect() {
    await Database.client.close()
    logger.info('Disconnected from MongoDB')
  }

  async initialCollections() {
    try {
      this.checkConnection()
      initUserCollection(this.db)
      initTokenCollection(this.db)
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
      initCommunityActivityCollection(this.db)
      initSearchHistoryCollection(this.db)
    } catch (error) {
      logger.error('Collection initialization failed:', error)
      throw error
    }
  }

  async initialIndex() {
    try {
      this.checkConnection()
      const indexUser = await UserCollection.indexExists(['email_1', 'username_1', 'bio_text'])
      const indexLike = await LikeCollection.indexExists(['user_id_1_tweet_id_1'])
      const indexReportTweet = await ReportTweetCollection.indexExists(['tweet_id_1'])
      const indexToken = await TokenCollection.indexExists(['exp_1'])
      const indexTweet = await TweetCollection.indexExists(['content_text'])
      const indexTrending = await TrendingCollection.indexExists(['slug_1', 'created_at_-1'])
      const indexHashtag = await HashtagCollection.indexExists(['slug_1'])
      const indexMessage = await MessageCollection.indexExists(['conversation_id_1_created_at_-1'])
      const indexConversation = await ConversationCollection.indexExists(['name_1'])
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
      const indexCommunityInvitation = await CommunityInvitationCollection.indexExists([
        'exp_1',
        'user_id_1',
        'community_id_1',
        'community_id_1_user_id_1'
      ])
      const indexCommunityActivity = await CommunityActivityCollection.indexExists(['community_id_1'])
      const indexSearchHistory = await SearchHistoryCollection.indexExists(['owner_1'])

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
      if (!indexToken) {
        TokenCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
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

      // Like
      if (!indexLike) {
        LikeCollection.createIndex({ user_id: 1, tweet_id: 1 }, { unique: true })
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
        CommunityCollection.createIndex({ visibility_type: 1 })
        CommunityCollection.createIndex({ membership_type: 1 })
        CommunityCollection.createIndex({ name: 1 }, { unique: true })
        CommunityCollection.createIndex({ slug: 1 }, { unique: true })
        CommunityCollection.createIndex({ category: 1 })
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
        CommunityInvitationCollection.createIndex({ community_id: 1 })
        CommunityInvitationCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
        CommunityInvitationCollection.createIndex({ community_id: 1, user_id: 1 }, { unique: true })
      }

      // CommunityActivity
      if (!indexCommunityActivity) {
        CommunityActivityCollection.createIndex({ community_id: 1 })
      }

      // SearchHistory
      if (!indexSearchHistory) {
        SearchHistoryCollection.createIndex({ owner: 1 })
      }
    } catch (error) {
      logger.error('Index initialization failed:', error)
      throw error
    }
  }
}

// ✅ Export getInstance => Singleton > chỉ cho phép có 1 kết nối.
const instanceMongodb = Database.getInstance()
const clientMongodb = Database.getClient()
export { clientMongodb, Database, instanceMongodb }
