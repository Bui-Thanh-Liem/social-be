// ESM
import { faker } from '@faker-js/faker'
import { ObjectId } from 'mongodb'
import { FollowerCollection, FollowerSchema } from '~/models/schemas/Follower.schema'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import TweetsService from '~/services/Tweets.service'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { ETweetType } from '~/shared/enums/type.enum'
import { hashPassword } from './crypto.util'

const MY_ID = new ObjectId('688f1a1c7fc55465abe62b96')

function generateRandomTweet(): string {
  const openers = [
    'Sáng nay tôi',
    'Tối qua code đến',
    'Nay mình học được rằng',
    'Dev sống là để',
    'Deadline đang gọi, nhưng tôi thì',
    'Bug hôm nay dạy tôi rằng',
    'Thức dậy và thấy'
  ]

  const middles = [
    'fix bug mà không biết bug gì 🐞',
    'ngồi nhìn terminal 30 phút không gõ gì 🧘',
    'dò log như thầy bói xem voi 🔍🐘',
    'viết xong 300 dòng code chỉ để xoá hết 💀',
    'merge conflict mà thấy như tan vỡ tình yêu 💔',
    'production sập vì thiếu dấu ; 😵‍💫',
    'cài lại Node.js lần thứ 7 trong tuần 🤡'
  ]

  const closers = [
    '... vẫn yêu nghề nha 😎',
    '... ai cần dev tâm lý thì inbox 📩',
    '... team bảo đó là feature, không phải bug 🚀',
    '... tôi vẫn ổn, chỉ là VSCode chưa load được 😶‍🌫️',
    '... cà phê là chân ái ☕️',
    '... chờ CI/CD pass như chờ người yêu rep tin nhắn 📱',
    '... mệt nhưng vẫn deploy 🫡'
  ]

  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  return `${random(openers)} ${random(middles)} ${random(closers)}`
}

// Tạo 100 Users
async function createRandomUsers() {
  console.log('Start create users...')

  //
  const pass = 'User@123'

  //
  function func() {
    return {
      name: faker.internet.username(),
      email: faker.internet.email(),
      password: hashPassword(pass),
      day_of_birth: faker.date.birthdate(),
      verify: EUserVerifyStatus.Verified
    }
  }

  //
  const data = faker.helpers.multiple(func, {
    count: 100
  })

  console.log('Finish create users')

  return await Promise.all(
    data.map(async (d) => {
      const res = await UserCollection.insertOne(
        new UserSchema({
          ...d,
          email_verify_token: ''
        })
      )
      return res.insertedId
    })
  )
}

// Tạo 300 tweet (1 user tạo 3 tweet)
async function createRandomTweets(user_ids: ObjectId[]) {
  await Promise.all(
    user_ids.map(async (id) => {
      await Promise.all([
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(),
          hashtags: [],
          medias: [],
          mentions: []
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(),
          hashtags: [],
          medias: [],
          mentions: []
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(),
          hashtags: [],
          medias: [],
          mentions: []
        })
      ])
    })
  )
  console.log('Finish create tweet ...')
}

// Hàm Follow 100 users trên
async function follow(user_id: ObjectId, followed_user_ids: ObjectId[]) {
  console.log('Start following...')

  await Promise.all(
    followed_user_ids.map((id) => FollowerCollection.insertOne(new FollowerSchema({ user_id, followed_user_id: id })))
  )

  console.log('Finish follow')
}

export async function startFaker() {
  const user_ids = await createRandomUsers()
  // await follow(MY_ID, user_ids)
  await createRandomTweets(user_ids)
}
