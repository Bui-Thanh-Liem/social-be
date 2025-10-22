// ESM
import { faker } from '@faker-js/faker'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { FollowerCollection } from '~/models/schemas/Follower.schema'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import TweetsService from '~/services/Tweets.service'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { EMediaType, ETweetType } from '~/shared/enums/type.enum'
import { hashPassword } from './crypto.util'
import { logger } from './logger.util'

const MY_ID = new ObjectId('68f85d17f3c271df6ed8bd6f')
const PASS = 'User123@'

function generateRandomTweet(hashtags: string[]): string {
  const openers = [
    // Lập trình viên
    'Sáng nay tôi',
    'Tối qua code đến',
    'Nay mình học được rằng',
    'Dev sống là để',
    'Deadline đang gọi, nhưng tôi thì',
    'Bug hôm nay dạy tôi rằng',
    'Thức dậy và thấy',

    // Đời sống
    'Hôm nay đi làm mà',
    'Cuối tuần này định',
    'Sáng sớm ra đường thấy',
    'Tối về nhà và',
    'Ngồi cà phê vỉa hè',
    'Chạy bộ sáng nay và',
    'Đang ăn phở thì',

    // Thể thao
    'Xem bóng đá tối qua',
    'Đi gym sáng nay',
    'World Cup năm nay',
    'Việt Nam vô địch',
    'Ronaldo vs Messi',
    'Tennis hôm nay',
    'Chạy marathon và',

    // Kinh tế
    'Giá vàng hôm nay',
    'Bitcoin lại',
    'Lạm phát đang',
    'Chứng khoán tuần này',
    'Startup mình',
    'Kinh tế Việt Nam',
    'Đầu tư bất động sản',

    // Pháp luật
    'Luật mới quy định',
    'Tòa án hôm nay',
    'Quyền lợi người tiêu dùng',
    'Hợp đồng lao động',
    'Bảo hiểm xã hội',
    'Luật giao thông',
    'An toàn mạng'
  ]

  const middles = [
    // Lập trình viên
    'fix bug mà không biết bug gì 🐞',
    'ngồi nhìn terminal 30 phút không gõ gì 🧘',
    'dò log như thầy bói xem voi 🔍🐘',
    'viết xong 300 dòng code chỉ để xoá hết 💀',
    'merge conflict mà thấy như tan vỡ tình yêu 💔',
    'production sập vì thiếu dấu ; 😵‍💫',
    'cài lại Node.js lần thứ 7 trong tuần 🤡',

    // Đời sống
    'tắc đường 2 tiếng mà vẫn cười 😅',
    'mua rau củ mà hết tiền trong ví 💸',
    'gặp crush ở siêu thị mà tóc tai lộn xộn 😱',
    'nấu ăn thành công lần đầu tiên 🍳',
    'dọn nhà xong mà như chiến trường 🏠',
    'ngủ quên hẹn với bạn thân 😴',
    'đi mua 1 thứ về 10 thứ 🛒',

    // Thể thao
    'Việt Nam thắng mà suýt đột quỵ ⚽',
    'tập gym 1 ngày đau cả tuần 💪',
    'chạy bộ 1km mà thở như máy kéo 🏃‍♂️',
    'xem tennis mà muốn học đánh 🎾',
    'bơi lội 10 phút mà như chạy marathon 🏊‍♂️',
    'đá bóng với hàng xóm và thua đau 😂',
    'yoga 15 phút mà muốn đi về 🧘‍♀️',

    // Kinh tế
    'tăng 10% mà lòng như lên mây ✈️',
    'giảm sâu hơn Mariana Trench 📉',
    'lên 100k rồi xuống về 0 🎢',
    'dự đoán sai 100% lần liên tiếp 🔮',
    'đầu tư như đánh bạc ở casino 🎰',
    'tiết kiệm từng đồng mà vẫn âm 💰',
    'startup mình như rocket bay lên 🚀',

    // Pháp luật
    'khiến 90% dân không hiểu gì 📚',
    'như mê cung không lối thoát 🗂️',
    'phức tạp hơn code backend 👨‍💼',
    'cần lawyer giải thích 3 tiếng ⚖️',
    'đọc 5 lần vẫn như tiếng ngoại hành tinh 👽',
    'vi phạm mà không hay biết 🚨',
    'thay đổi liên tục như thời tiết 🌦️'
  ]

  const closers = [
    // Lập trình viên
    '... vẫn yêu nghề nha 😎',
    '... ai cần dev tâm lý thì inbox 📩',
    '... team bảo đó là feature, không phải bug 🚀',
    '... tôi vẫn ổn, chỉ là VSCode chưa load được 😶‍🌫️',
    '... cà phê là chân ái ☕️',
    '... chờ CI/CD pass như chờ người yêu rep tin nhắn 📱',
    '... mệt nhưng vẫn deploy 🫡',

    // Đời sống
    '... cuộc sống mà, có gì đâu 🤷‍♂️',
    '... ngày mai lại làm tiếp 💪',
    '... ai làm người lớn dễ thế 👨‍💼',
    '... hạnh phúc đơn giản thế thôi 😊',
    '... tiền đâu mà lo 💸',
    '... sống chậm lại để yêu thương 💕',
    '... tuổi này mà còn ngây thơ 🌸',

    // Thể thao
    '... thể thao là cuộc sống 🏃‍♂️',
    '... lần sau tập nhẹ hơn 😅',
    '... ai bảo thể thao dễ 💪',
    '... tinh thần thắng mới là chính 🏆',
    '... năm sau World Cup chờ đó ⚽',
    '... sức khỏe là vàng 💛',
    '... động lực tập luyện +1 🔥',

    // Kinh tế
    '... kinh tế khó đoán vậy 📊',
    '... đầu tư có rủi ro nhé 📈',
    '... tiền bạc là thứ 2, sức khỏe số 1 💚',
    '... crypto chỉ là maynh mũi thôi 🪙',
    '... tương lai tươi sáng 🌟',
    '... chăm chỉ làm việc là chính 💼',
    '... học hỏi kinh nghiệm mỗi ngày 📚',

    // Pháp luật
    '... pháp luật cần đơn giản hóa 📝',
    '... tuân thủ để bình an 🕊️',
    '... kiến thức pháp lý quan trọng ⚖️',
    '... ai cũng nên biết quyền của mình 🛡️',
    '... công bằng xã hội 🤝',
    '... minh bạch là chìa khóa 🔑',
    '... pháp luật vì người dân 👥'
  ]

  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  const parts = [random(openers), random(middles), random(closers)]

  // chọn 1–2 hashtag ngẫu nhiên để chèn vào giữa nội dung
  const pickedTags = hashtags
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 2) + 1)
    .map((h) => (h.startsWith('#') ? h : `#${h}`))

  // chọn vị trí chèn ngẫu nhiên, tránh đầu & cuối quá sớm
  const insertIndex = Math.floor(Math.random() * (parts.length - 1)) + 1
  parts.splice(insertIndex, 0, pickedTags.join(' '))

  return parts.join(' ')
}

function generateRandomBio(): string {
  const intros = [
    // Tech/Dev
    'Code cho vui',
    'Đang debug cuộc đời',
    'Lập trình vì cà phê',
    'Sống sót qua deadline',
    'Chạy bằng caffeine',
    'Người kể chuyện bằng code',
    'Thích viết code hơn viết status',

    // Đời sống
    'Sống chậm trong thế giới nhanh',
    'Yêu đời yêu người',
    'Tìm hạnh phúc trong từng giây phút',
    'Cà phê sáng, trà chiều',
    'Người lạc quan vô duyên',
    'Đi tìm ý nghĩa cuộc sống',
    'Sống có tâm',
    'Minimalist đang tập',
    'Foodie chính hiệu',
    'Travel blogger nghiệp dư',

    // Thể thao
    'Gym là tình yêu',
    'Chạy bộ mỗi sáng',
    'Yoga cho tâm hồn',
    'Bóng đá là đam mê',
    'Tennis cuối tuần',
    'Swimmer by heart',
    'Marathon runner',
    'Fitness enthusiast',

    // Kinh tế/Business
    'Startup dreamer',
    'Crypto believer',
    'Stock market warrior',
    'Business mindset',
    'Entrepreneur wannabe',
    'Investment learner',
    'Financial freedom seeker',
    'Innovation lover',

    // Pháp luật
    'Legal knowledge matters',
    'Quyền lợi người tiêu dùng',
    'Luật sư đang tập',
    'Legal consultant',
    'Tư vấn pháp lý',
    'Justice seeker',

    // Học tập
    'Học tập suốt đời',
    'Knowledge seeker',
    'Bookworm chính hiệu',
    'Lifelong learner',
    'Tự học là chính',
    'Đọc sách mỗi ngày'
  ]

  const middles = [
    // Tech/Dev
    'Frontend lúc tỉnh, Backend lúc mơ',
    'Bug là bạn, deadline là người yêu',
    'Merge conflict nhưng vẫn lạc quan',
    'Thích dark mode hơn dark mood',
    'Yêu Node.js nhưng hay tán React',
    'Có thể ngủ bất cứ đâu, trừ lúc deploy',
    'Làm dev vì không muốn họp nhiều',

    // Đời sống
    'Yêu phở hơn pizza',
    'Cà phê đen không đường',
    'Sống để trải nghiệm',
    'Nấu ăn thỉnh thoảng thành công',
    'Du lịch bụi chuyên nghiệp',
    'Chụp ảnh đồ ăn trước khi ăn',
    'Nghe nhạc chill khi làm việc',
    'Thích mưa hơn nắng',
    'Đọc sách trước khi ngủ',
    'Dọn nhà cuối tuần',

    // Thể thao
    'Squat là cuộc sống',
    'Chạy để quên đi stress',
    '10k steps mỗi ngày',
    'Protein shake là bữa phụ',
    'Tập gym từ 6h sáng',
    'Yoga mỗi tối',
    'Weekend footballer',

    // Kinh tế/Business
    'Portfolio đỏ lè nhưng vẫn optimistic',
    'Buy low sell high (lý thuyết)',
    'HODL là triết lý sống',
    'Startup ideas 24/7',
    'Excel là bạn thân',
    'ROI calculator trong đầu',
    'Passive income dreamer',

    // Pháp luật
    'Đọc luật như đọc truyện',
    'Legal documents không scary',
    'Hợp đồng cần đọc kỹ',
    'Quyền và nghĩa vụ cân bằng',
    'Tư vấn miễn phí cho bạn bè',

    // Học tập
    'Coursera là Netflix của tôi',
    'TED Talks mỗi sáng',
    'Podcast thay TV',
    'Note-taking professional',
    'Mind map mọi thứ'
  ]

  const endings = [
    '☕💻',
    '🚀',
    '🐧',
    '🧠',
    '⚡',
    '🔥',
    '🌙',
    '📚',
    '💪',
    '⚽',
    '🏃‍♂️',
    '📊',
    '📈',
    '⚖️',
    '🎯',
    '🌟',
    '💡',
    '🎨',
    '🌱',
    '🎵',
    '📱',
    '✈️',
    '🏖️',
    '🍕',
    '🥑',
    '🎮',
    '📷',
    '🎪'
  ]

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
  logger.info('Start create users...')

  //
  function func() {
    const name = faker.internet.username().slice(0, 15)
    return {
      name: name,
      username: `@${_.snakeCase(name)}`,
      email: faker.internet.email(),
      password: hashPassword(PASS),
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

  logger.info('Finish create users')

  //
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

// Tạo 500 tweet (1 user tạo 5 tweet)
async function createRandomTweets(user_ids: ObjectId[]) {
  logger.info('Start create tweet...')

  await Promise.all(
    user_ids.map(async (id) => {
      const ht1 = [randomHashtag(), randomHashtag(), randomHashtag()]
      const ht2 = [randomHashtag(), randomHashtag(), randomHashtag()]
      const ht3 = [randomHashtag(), randomHashtag(), randomHashtag()]
      const ht4 = [randomHashtag(), randomHashtag(), randomHashtag()]
      const ht5 = [randomHashtag(), randomHashtag(), randomHashtag()]

      await Promise.all([
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(ht1),
          hashtags: ht1,
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(ht2),
          hashtags: ht2,
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(ht3),
          hashtags: ht3,
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(ht4),
          hashtags: ht4,
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        }),
        TweetsService.create(id.toString(), {
          type: ETweetType.Tweet,
          audience: ETweetAudience.Everyone,
          content: generateRandomTweet(ht5),
          hashtags: ht5,
          mentions: getRandomMentions(user_ids),
          media: { url: faker.image.avatar(), type: EMediaType.Image }
        })
      ])
    })
  )

  logger.info('Finish create tweet')
}

// Hàm Follow/followed 100 users
async function follow(user_id: ObjectId, followed_user_ids: ObjectId[]) {
  logger.info('Start following...')

  const docs: any[] = []

  // Tôi theo dõi 100 user
  for (const id of followed_user_ids) {
    docs.push({ user_id, followed_user_id: id })
  }

  // 100 user theo dõi tôi
  for (const id of followed_user_ids) {
    docs.push({ user_id: id, followed_user_id: user_id })
  }

  // Thêm 1 lần duy nhất
  await FollowerCollection.insertMany(docs)

  logger.info('Finish follow')
}

export async function startFaker() {
  const user_ids = await createRandomUsers()
  await follow(MY_ID, user_ids)
  await createRandomTweets(user_ids)
}
