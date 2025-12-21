import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.dev'
dotenv.config({ path: envFile })

export const envs = {
  NODE_ENV: process.env.NODE_ENV || '',

  //
  DB_USERNAME: process.env.DB_USERNAME || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || '',
  DB_CONNECT_STRING: process.env.DB_CONNECT_STRING || 'Error',

  DOMAIN: process.env.DOMAIN || '',

  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  SERVER_PORT: Number(process.env.SERVER_PORT) || 9000,
  SERVER_HOST: process.env.SERVER_HOST || '',

  CLIENT_DOMAIN: process.env.CLIENT_DOMAIN || '',
  SERVER_DOMAIN: process.env.SERVER_DOMAIN || '',

  PASSWORD_SALT: process.env.PASSWORD_SALT || '',

  //
  JWT_SECRET_ACCESS: process.env.JWT_SECRET_ACCESS || '',
  JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH || '',
  JWT_SECRET_TEMP: process.env.JWT_SECRET_TEMP || '',

  TEMP_TOKEN_EXPIRES_IN: process.env.TEMP_TOKEN_EXPIRES_IN || '5m',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  MAIL_SERVICE_USER: process.env.MAIL_SERVICE_USER || '',
  MAIL_SERVICE_PASS: process.env.MAIL_SERVICE_PASS || '',
  MAIL_SERVICE_ROOT: process.env.MAIL_SERVICE_ROOT || '',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_REDIRECT_URIS: process.env.GOOGLE_REDIRECT_URIS || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_URL_GET_CODE: process.env.GOOGLE_URL_GET_CODE || '',
  GOOGLE_URL_GET_INFO: process.env.GOOGLE_URL_GET_INFO || '',

  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || '',
  FACEBOOK_REDIRECT_URIS: process.env.FACEBOOK_REDIRECT_URIS || '',
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || '',
  FACEBOOK_URL_GET_CODE: process.env.FACEBOOK_URL_GET_CODE || '',
  FACEBOOK_URL_GET_INFO: process.env.FACEBOOK_URL_GET_INFO || '',

  // Ngưỡng tối đa trước khi xóa
  MAX_REPORT_THRESHOLD: process.env.MAX_REPORT_THRESHOLD || '',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER_NAME: process.env.CLOUDINARY_FOLDER_NAME || '',

  // AWS
  AWS_REGION: process.env.AWS_REGION || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  CLOUDFRONT_URL: process.env.CLOUDFRONT_URL || '',

  // Discord bot
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
  DISCORD_LOG_CHANNEL_ID: process.env.DISCORD_LOG_CHANNEL_ID || '',
  DISCORD_URL_WEBHOOK: process.env.DISCORD_URL_WEBHOOK || '',
  DISCORD_BOT_NAME: process.env.DISCORD_BOT_NAME || '',
  DISCORD_BOT_AVATAR: process.env.DISCORD_BOT_AVATAR || ''
}
