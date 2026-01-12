import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.dev'
dotenv.config({ path: envFile })

export const envs = {
  NODE_ENV: process.env.NODE_ENV || '', // development | production, create in Dockerfile

  //
  DB_USERNAME: process.env.DB_USERNAME || 'Error',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Error',
  DB_NAME: process.env.DB_NAME || 'Error',
  DB_CONNECT_STRING: process.env.DB_CONNECT_STRING || 'Error',

  DOMAIN: process.env.DOMAIN || 'Error',

  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  SERVER_PORT: Number(process.env.SERVER_PORT) || 9000,
  SERVER_HOST: process.env.SERVER_HOST || 'Error',

  CLIENT_DOMAIN: process.env.CLIENT_DOMAIN || 'Error',
  SERVER_DOMAIN: process.env.SERVER_DOMAIN || 'Error',

  PASSWORD_SALT: process.env.PASSWORD_SALT || 'Error',

  //
  JWT_SECRET_ACCESS: process.env.JWT_SECRET_ACCESS || 'Error',
  JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH || 'Error',
  JWT_SECRET_TEMP: process.env.JWT_SECRET_TEMP || 'Error',

  TEMP_TOKEN_EXPIRES_IN: process.env.TEMP_TOKEN_EXPIRES_IN || '5m',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  MAIL_SERVICE_USER: process.env.MAIL_SERVICE_USER || 'Error',
  MAIL_SERVICE_PASS: process.env.MAIL_SERVICE_PASS || 'Error',
  MAIL_SERVICE_ROOT: process.env.MAIL_SERVICE_ROOT || 'Error',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'Error',
  GOOGLE_REDIRECT_URIS: process.env.GOOGLE_REDIRECT_URIS || 'Error',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'Error',
  GOOGLE_URL_GET_CODE: process.env.GOOGLE_URL_GET_CODE || '',
  GOOGLE_URL_GET_INFO: process.env.GOOGLE_URL_GET_INFO || '',

  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || 'Error',
  FACEBOOK_REDIRECT_URIS: process.env.FACEBOOK_REDIRECT_URIS || 'Error',
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || 'Error',
  FACEBOOK_URL_GET_CODE: process.env.FACEBOOK_URL_GET_CODE || 'Error',
  FACEBOOK_URL_GET_INFO: process.env.FACEBOOK_URL_GET_INFO || 'Error',

  // Ngưỡng tối đa trước khi xóa bài viết được báo cáo tự động
  MAX_REPORT_THRESHOLD: process.env.MAX_REPORT_THRESHOLD || '10',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'Error',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'Error',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'Error',
  CLOUDINARY_FOLDER_NAME: process.env.CLOUDINARY_FOLDER_NAME || '',
  CLOUDINARY_ACCESS_EXPIRES: process.env.CLOUDINARY_ACCESS_EXPIRES || '900',

  // AWS (only for local development, production dùng IAM Role)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'Error',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'Error',
  AWS_REGION: process.env.AWS_REGION || 'Error',

  AWS_CLOUDFRONT_DOMAIN: process.env.AWS_CLOUDFRONT_DOMAIN || 'Error',
  AWS_CLOUDFRONT_KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID || 'Error',
  AWS_CLOUDFRONT_PRIVATE_KEY: process.env.AWS_CLOUDFRONT_PRIVATE_KEY || 'Error',
  AWS_SIGNED_URL_EXPIRES_IN: process.env.AWS_SIGNED_URL_EXPIRES_IN || '0',

  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'Error',
  AWS_PRESIGNED_URL_EXPIRES_IN: process.env.AWS_PRESIGNED_URL_EXPIRES_IN || '0'
}
