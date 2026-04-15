import { StringValue } from 'ms'
import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.dev'
dotenv.config({ path: envFile })

export const envs = {
  NODE_ENV: process.env.NODE_ENV || '', // development | production, create in Dockerfile

  // Database
  DB_USERNAME: process.env.DB_USERNAME || 'Error',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Error',
  DB_NAME: process.env.DB_NAME || 'Error',
  DB_CONNECT_STRING: process.env.DB_CONNECT_STRING || 'Error',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  // Server
  SERVER_PORT: Number(process.env.SERVER_PORT) || 9000,
  SERVER_HOST: process.env.SERVER_HOST || 'Error',

  // Domains
  CLIENT_DOMAIN: process.env.CLIENT_DOMAIN || 'Error',
  CLIENT_DOMAIN_ADMIN: process.env.CLIENT_DOMAIN_ADMIN || 'Error',
  SERVER_DOMAIN: process.env.SERVER_DOMAIN || 'Error',

  // API Key (dùng để xác thực giữa các service nội bộ, không phải cho client)
  API_KEY: process.env.API_KEY || 'Error',

  // Password salt
  PASSWORD_SALT: process.env.PASSWORD_SALT || 'Error',

  // JWT - USER
  JWT_SECRET_ACCESS_USER: process.env.JWT_SECRET_ACCESS_USER || 'Error',
  JWT_SECRET_REFRESH_USER: process.env.JWT_SECRET_REFRESH_USER || 'Error',
  JWT_SECRET_TEMP_USER: process.env.JWT_SECRET_TEMP_USER || 'Error',

  // JWT - ADMIN
  JWT_SECRET_ACCESS_ADMIN: process.env.JWT_SECRET_ACCESS_ADMIN || 'Error',
  JWT_SECRET_REFRESH_ADMIN: process.env.JWT_SECRET_REFRESH_ADMIN || 'Error',
  JWT_SECRET_TEMP_ADMIN: process.env.JWT_SECRET_TEMP_ADMIN || 'Error',

  // Token Expirations
  JWT_EXPIRES_IN_5M: (process.env.JWT_EXPIRES_IN_5M || '5m') as StringValue,
  JWT_EXPIRES_IN_15M: (process.env.JWT_EXPIRES_IN_15M || '15m') as StringValue,
  JWT_EXPIRES_IN_3D: (process.env.JWT_EXPIRES_IN_3D || '3d') as StringValue,
  JWT_EXPIRES_IN_30D: (process.env.JWT_EXPIRES_IN_30D || '30d') as StringValue,

  // Mail
  MAIL_SERVICE_USER: process.env.MAIL_SERVICE_USER || 'Error',
  MAIL_SERVICE_PASS: process.env.MAIL_SERVICE_PASS || 'Error',
  MAIL_SERVICE_ROOT: process.env.MAIL_SERVICE_ROOT || 'Error',

  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'Error',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Error',

  // OAuth - Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'Error',
  GOOGLE_REDIRECT_URIS: process.env.GOOGLE_REDIRECT_URIS || 'Error',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'Error',
  GOOGLE_URL_GET_CODE: process.env.GOOGLE_URL_GET_CODE || '',
  GOOGLE_URL_GET_INFO: process.env.GOOGLE_URL_GET_INFO || '',

  // OAuth - Facebook
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || 'Error',
  FACEBOOK_REDIRECT_URIS: process.env.FACEBOOK_REDIRECT_URIS || 'Error',
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || 'Error',
  FACEBOOK_URL_GET_CODE: process.env.FACEBOOK_URL_GET_CODE || 'Error',
  FACEBOOK_URL_GET_INFO: process.env.FACEBOOK_URL_GET_INFO || 'Error',

  // Ngưỡng tối đa trước khi xóa bài viết được báo cáo tự động
  MAX_REPORT_THRESHOLD: process.env.MAX_REPORT_THRESHOLD || '10',

  // AWS (only for local development, production dùng IAM Role)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'Error',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'Error',
  AWS_REGION: process.env.AWS_REGION || 'Error',

  // CloudFront (dùng để tạo signed URL cho client tải ảnh lên, sau đó CloudFront sẽ chuyển tiếp đến S3)
  AWS_CLOUDFRONT_DOMAIN: process.env.AWS_CLOUDFRONT_DOMAIN || 'Error',
  AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID || 'Error',
  AWS_CLOUDFRONT_PRIVATE_KEY: process.env.AWS_CLOUDFRONT_PRIVATE_KEY || 'Error',
  AWS_SIGNED_URL_EXPIRES_IN: process.env.AWS_SIGNED_URL_EXPIRES_IN || '0',

  // S3
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'Error',
  AWS_PRESIGNED_URL_EXPIRES_IN: process.env.AWS_PRESIGNED_URL_EXPIRES_IN || '0',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'Error',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || 'Error',
  TELEGRAM_CHAT_GROUP_ID: process.env.TELEGRAM_CHAT_GROUP_ID || 'Error',

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'Error',

  // Email khách (dùng để tạo tài khoản guest, không phải email thật)
  GUEST_EMAIL_1: process.env.GUEST_EMAIL_1 || 'Error',
  GUEST_EMAIL_2: process.env.GUEST_EMAIL_2 || 'Error',
  GUEST_EMAIL_3: process.env.GUEST_EMAIL_3 || 'Error',
  GUEST_EMAIL_4: process.env.GUEST_EMAIL_4 || 'Error',
  GUEST_EMAIL_5: process.env.GUEST_EMAIL_5 || 'Error',
  GUEST_EMAIL_6: process.env.GUEST_EMAIL_6 || 'Error',
  GUEST_EMAIL_7: process.env.GUEST_EMAIL_7 || 'Error',
  GUEST_EMAIL_8: process.env.GUEST_EMAIL_8 || 'Error',
  GUEST_EMAIL_9: process.env.GUEST_EMAIL_9 || 'Error',
  GUEST_EMAIL_10: process.env.GUEST_EMAIL_10 || 'Error'
}
