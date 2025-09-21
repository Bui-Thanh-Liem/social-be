import { Db, MongoClient, ServerApiVersion } from 'mongodb'
import { envs } from '~/configs/env.config'
import { initBookmarkCollection } from '~/models/schemas/Bookmark.schema'
import { initConversationCollection } from '~/models/schemas/Conversation.schema'
import { initFollowerCollection } from '~/models/schemas/Follower.schema'
import { initHashtagCollection } from '~/models/schemas/Hashtag.schema'
import { initLikeCollection } from '~/models/schemas/Like.schema'
import { initMessageCollection } from '~/models/schemas/Message.schema'
import { initRefreshTokenCollection, RefreshTokenCollection } from '~/models/schemas/RefreshToken.schema'
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
  }

  async initialIndex() {
    const indexUser = await UserCollection.indexExists(['email_1', 'username_1'])
    const indexRefresh = await RefreshTokenCollection.indexExists(['token_1', 'exp_1'])
    const indexTweet = await TweetCollection.indexExists(['content_text'])
    if (indexUser && indexRefresh && indexTweet) return

    // User
    UserCollection.createIndex({ email: 1 }, { unique: true })
    UserCollection.createIndex({ username: 1 }, { unique: true })

    // Refresh
    RefreshTokenCollection.createIndex({ token: 1 }, { unique: true })
    RefreshTokenCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })

    // Tweet - default_language: 'none' -> cho phép sử dụng stop words
    TweetCollection.createIndex({ content: 'text' }, { default_language: 'none' })

    // Trending
    TrendingCollection.createIndex({ slug: 1 }, { unique: true })
  }

  getDb() {
    return this.db
  }
}

const database = new DatabaseConfig()
export default database
