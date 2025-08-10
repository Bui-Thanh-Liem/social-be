// ESM
import { faker } from '@faker-js/faker'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { FollowerCollection, FollowerSchema } from '~/models/schemas/Follower.schema'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import TweetsService from '~/services/Tweets.service'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { EMediaType, ETweetType } from '~/shared/enums/type.enum'
import { hashPassword } from './crypto.util'

const MY_ID = new ObjectId('68981080240210c1b61fd82d')

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

function generateRandomBio(): string {
  const intros = [
    'Code cho vui',
    'Đang debug cuộc đời',
    'Lập trình vì cà phê',
    'Sống sót qua deadline',
    'Chạy bằng caffeine',
    'Người kể chuyện bằng code',
    'Thích viết code hơn viết status'
  ]

  const middles = [
    'Frontend lúc tỉnh, Backend lúc mơ',
    'Bug là bạn, deadline là người yêu',
    'Merge conflict nhưng vẫn lạc quan',
    'Thích dark mode hơn dark mood',
    'Yêu Node.js nhưng hay tán React',
    'Có thể ngủ bất cứ đâu, trừ lúc deploy',
    'Làm dev vì không muốn họp nhiều'
  ]

  const endings = ['☕💻', '🚀', '🐧', '🧠', '⚡', '🔥', '🌙']

  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  return `${random(intros)} | ${random(middles)} ${random(endings)}`
}

function generateLocation(): string {
  const locations = [
    'Hà Nội, Việt Nam',
    'TP.Hồ Chí Minh, Việt Nam',
    'Đà Nẵng, Việt Nam',
    'Cần Thơ, Việt Nam',
    'New York, USA',
    'San Francisco, USA',
    'London, UK',
    'Paris, France',
    'Berlin, Germany',
    'Tokyo, Japan',
    'Osaka, Japan',
    'Seoul, South Korea',
    'Singapore, Singapore',
    'Bangkok, Thailand',
    'Kuala Lumpur, Malaysia',
    'Jakarta, Indonesia',
    'Sydney, Australia',
    'Melbourne, Australia',
    'Dubai, UAE',
    'Doha, Qatar'
  ]

  return locations[Math.floor(Math.random() * locations.length)]
}

// Tạo 100 Users
async function createRandomUsers() {
  console.log('Start create users...')

  //
  const pass = 'User@123'

  //
  function func() {
    const name = faker.internet.username()
    return {
      name: name,
      username: _.snakeCase(name),
      email: faker.internet.email(),
      password: hashPassword(pass),
      day_of_birth: faker.date.birthdate(),
      avatar: faker.image.avatar(),
      verify: EUserVerifyStatus.Verified,
      cover_photo: faker.image.avatar(),
      bio: generateRandomBio(),
      location: generateLocation()
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

function randomHashtag() {
  return faker.internet.username()
}

function getRandomMentions(user_ids: ObjectId[]) {
  const shuffled = [...user_ids].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 3).map((id) => id.toString())
}

// Tạo 300 tweet (1 user tạo 3 tweet)
async function createRandomTweets(user_ids: ObjectId[]) {
  console.log('Start create tweet...')

  await Promise.all(
    user_ids.map(async (id) => {
      await Promise.all([
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(),
          hashtags: [randomHashtag(), randomHashtag(), randomHashtag()],
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(),
          hashtags: [randomHashtag(), randomHashtag(), randomHashtag()],
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(),
          hashtags: [randomHashtag(), randomHashtag(), randomHashtag()],
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        })
      ])
    })
  )
  console.log('Finish create tweet')
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
  await follow(MY_ID, user_ids)
  await createRandomTweets(user_ids)
}
