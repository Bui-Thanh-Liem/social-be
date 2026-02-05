import { Db, MongoClient, ServerApiVersion } from 'mongodb'
import { envs } from '~/configs/env.config'
import { BadRequestError, InternalServerError } from '~/core/error.response'
import { logger } from '~/utils/logger.util'
import { AdminCollection, initAdminCollection } from '~/modules/admin/admin.schema'
import { initBookmarksCollection } from '~/modules/bookmarks/bookmarks.schema'
import {
  CommunitiesCollection,
  CommunityActivityCollection,
  CommunityInvitationCollection,
  CommunityMemberCollection,
  CommunityMentorCollection,
  CommunityPinCollection,
  initCommunitiesCollection,
  initCommunityActivityCollection,
  initCommunityInvitationCollection,
  initCommunityMemberCollection,
  initCommunityMentorCollection,
  initCommunityPinCollection
} from '~/modules/communities/communities.schema'
import { initFollowersCollection } from '~/modules/follows/follows.schema'
import { HashtagsCollection, initHashtagsCollection } from '~/modules/hashtags/hashtags.schema'
import { initLikesCollection, LikesCollection } from '~/modules/likes/likes.schema'
import { ConversationsCollection, initConversationsCollection } from '~/modules/conversations/conversation.schema'
import { initMediasCollection, MediasCollection } from '~/modules/media/media.schema'
import { initMessagesCollection, MessagesCollection } from '~/modules/messages/message.schema'
import { initNotificationsCollection } from '~/modules/notifications/notification.schema'
import { initReportTweetCollection, ReportTweetCollection } from '~/modules/report-tweet/report-tweet.schema'
import { initSearchHistoryCollection, SearchHistoryCollection } from '~/modules/search-history/search-history.schema'
import { initTokensCollection, TokensCollection } from '~/modules/tokens/tokens.schema'
import { initTrendingCollection, TrendingCollection } from '~/modules/trending/trending.schema'
import { initTweetsCollection, TweetsCollection } from '~/modules/tweets/tweets.schema'
import { initUsersCollection, UsersCollection } from '~/modules/users/user.schema'
import { BadWordsCollection, initBadWordsCollection } from '~/modules/bad-word/bad-word.schema'

const _MINPOOLSIZE = 5
const _MAXPOOLSIZE = 50 // không bao giờ vượt, nếu hơn thì phải chờ
const _SOCKET_TIMEOUT_MS = 45000 // 45 giây

class Database {
  private db: Db
  static client: MongoClient
  private isConnected: boolean = false
  private isConnecting: boolean = false
  static instance: Database | null = null

  // 1️⃣ PRIVATE constructor - Ngăn tạo instance từ bên ngoài
  private constructor() {
    try {
      // Chỉ khởi tạo client khi chưa có
      if (!Database.client) {
        Database.client = new MongoClient(envs.DB_CONNECT_STRING, {
          serverApi: {
            deprecationErrors: true,
            version: ServerApiVersion.v1
          },
          minPoolSize: _MINPOOLSIZE,
          maxPoolSize: _MAXPOOLSIZE,

          retryWrites: true,
          retryReads: true,
          tls: true,
          w: 'majority',

          monitorCommands: false,
          socketTimeoutMS: _SOCKET_TIMEOUT_MS,

          // 🆕 Các option quan trọng để giảm lỗi monitor timeout
          heartbeatFrequencyMS: 60000, // Gửi heartbeat chậm hơn: mỗi 20 giây thay vì 10 giây → ít nhạy cảm với latency ngắn
          connectTimeoutMS: 30000, // Thời gian chờ mở socket mới (default 30s, nhưng set rõ cho chắc)
          serverSelectionTimeoutMS: 30000 // Thời gian chọn server khi reconnect
          // maxIdleTimeMS: 300000,       // Optional: đóng connection idle sau 5 phút nếu muốn tiết kiệm
        })
      }
      this.db = Database.client.db(envs.DB_NAME)
    } catch (error) {
      console.error('MongoDB client initialization failed:', error)
      throw new InternalServerError('MongoDB client initialization failed')
    }
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
    logger.info('❌ Disconnected from MongoDB ❌')
  }

  async initialCollections() {
    try {
      this.checkConnection()
      initUsersCollection(this.db)
      initTokensCollection(this.db)
      initFollowersCollection(this.db)
      initMediasCollection(this.db)
      initTweetsCollection(this.db)
      initHashtagsCollection(this.db)
      initBookmarksCollection(this.db)
      initLikesCollection(this.db)
      initConversationsCollection(this.db)
      initMessagesCollection(this.db)
      initTrendingCollection(this.db)
      initNotificationsCollection(this.db)
      initReportTweetCollection(this.db)
      initCommunitiesCollection(this.db)
      initCommunityMentorCollection(this.db)
      initCommunityMemberCollection(this.db)
      initCommunityPinCollection(this.db)
      initCommunityInvitationCollection(this.db)
      initCommunityActivityCollection(this.db)
      initSearchHistoryCollection(this.db)
      initAdminCollection(this.db)
      initBadWordsCollection(this.db)
    } catch (error) {
      logger.error('Collection initialization failed:', error)
      throw error
    }
  }

  async initialIndex() {
    try {
      this.checkConnection()
      const indexUser = await UsersCollection.indexExists(['email_1', 'username_1', 'bio_text'])
      const indexLike = await LikesCollection.indexExists(['user_id_1_tweet_id_1'])
      const indexReportTweet = await ReportTweetCollection.indexExists(['tweet_id_1'])
      const indexToken = await TokensCollection.indexExists(['exp_1'])
      const indexTweet = await TweetsCollection.indexExists(['content_text'])
      const indexTrending = await TrendingCollection.indexExists(['slug_1', 'created_at_-1'])
      const indexHashtag = await HashtagsCollection.indexExists(['slug_1'])
      const indexMessage = await MessagesCollection.indexExists(['conversation_id_1_created_at_-1'])
      const indexConversation = await ConversationsCollection.indexExists(['name_1'])
      const indexCommunity = await CommunitiesCollection.indexExists([
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
      const indexMedia = await MediasCollection.indexExists(['s3_key_1'])
      const indexAdmin = await AdminCollection.indexExists(['email_1'])
      const indexBadWord = await BadWordsCollection.indexExists(['words_1'])

      // Admin
      if (!indexAdmin) {
        AdminCollection.createIndex({ email: 1 }, { unique: true })
      }

      // User
      if (!indexUser) {
        UsersCollection.createIndex({ email: 1 }, { unique: true })
        UsersCollection.createIndex({ username: 1 }, { unique: true })
        UsersCollection.createIndex({ bio: 'text' }, { default_language: 'none' })
      }

      // Report
      if (!indexReportTweet) {
        ReportTweetCollection.createIndex({ tweet_id: 1 }, { unique: true })
      }

      // Refresh
      if (!indexToken) {
        TokensCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
      }

      // Tweet - default_language: 'none' -> cho phép sử dụng stop words
      if (!indexTweet) {
        TweetsCollection.createIndex({ content: 'text' }, { default_language: 'none' }) // Hoạt động trên đoạn văn tốt => q=word
      }

      // Trending
      if (!indexTrending) {
        TrendingCollection.createIndex({ slug: 1 }, { unique: true })
        TrendingCollection.createIndex({ created_at: -1 })
      }

      // Hashtag
      if (!indexHashtag) {
        HashtagsCollection.createIndex({ slug: 1 }, { unique: true })
      }

      // Like
      if (!indexLike) {
        LikesCollection.createIndex({ user_id: 1, tweet_id: 1 }, { unique: true })
      }

      // Message
      if (!indexMessage) {
        MessagesCollection.createIndex({ conversation_id: 1, created_at: -1 })
      }

      // Conversation
      if (!indexConversation) {
        ConversationsCollection.createIndex({ name: 1 })
      }

      // Community
      if (!indexCommunity) {
        CommunitiesCollection.createIndex({ visibility_type: 1 })
        CommunitiesCollection.createIndex({ membership_type: 1 })
        CommunitiesCollection.createIndex({ name: 1 }, { unique: true })
        CommunitiesCollection.createIndex({ slug: 1 }, { unique: true })
        CommunitiesCollection.createIndex({ category: 1 })
        CommunitiesCollection.createIndex({ bio: 'text' }, { default_language: 'none' })
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

      // Media
      if (!indexMedia) {
        MediasCollection.createIndex({ s3_key: 1 }, { unique: true })
        MediasCollection.createIndex({ s3_key: 1, type: 1 }, { unique: true })
      }

      // BadWord
      if (!indexBadWord) {
        BadWordsCollection.createIndex({ words: 1 }, { unique: true })
      }

      logger.info('All indexes are ensured successfully')
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
