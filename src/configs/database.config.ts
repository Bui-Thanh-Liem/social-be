import { Db, MongoClient, ServerApiVersion } from 'mongodb'
import { envs } from '~/configs/env.config'
import { initBookmarkCollection } from '~/models/schemas/Bookmark.schema'
import { initFollowerCollection } from '~/models/schemas/Follower.schema'
import { initHashtagCollection } from '~/models/schemas/Hashtag.schema'
import { initLikeCollection } from '~/models/schemas/Like.schema'
import { initRefreshTokenCollection, RefreshTokenCollection } from '~/models/schemas/RefreshToken.schema'
import { initTweetCollection } from '~/models/schemas/Tweet.schema'
import { initUserCollection, UserCollection } from '~/models/schemas/User.schema'
import { initVideoCollection } from '~/models/schemas/Video.schema'

class DatabaseConfig {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(
      `mongodb+srv://${envs.DB_USERNAME}:${envs.DB_PASSWORD}@cluster0-liemdev.dfynfof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-LiemDev`,
      {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true
        }
      }
    )
    this.db = this.client.db(envs.DB_NAME)
  }

  async connect() {
    await this.client.connect()
    await this.db.command({ ping: 1 })
    console.log('Pinged your deployment. You successfully connected to MongoDB!')
  }

  async disconnect() {
    await this.client.close()
    console.log('Disconnected from MongoDB')
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
  }

  async initialIndex() {
    const indexUser = await UserCollection.indexExists(['email_1', 'username_1'])
    const indexRefresh = await RefreshTokenCollection.indexExists(['token_1', 'exp_1'])
    if (indexUser && indexRefresh) return

    // User
    UserCollection.createIndex({ email: 1 }, { unique: true })
    UserCollection.createIndex({ username: 1 }, { unique: true })

    // Refresh
    RefreshTokenCollection.createIndex({ token: 1 }, { unique: true })
    RefreshTokenCollection.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
  }

  getDb() {
    return this.db
  }
}

const database = new DatabaseConfig()
export default database
