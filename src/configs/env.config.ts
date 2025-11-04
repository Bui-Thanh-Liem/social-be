import dotenv from 'dotenv'

const envFile = process.env.NODE_ENV !== 'development' ? '.env' : '.env.dev'
dotenv.config({ path: envFile })

export const envs = {
  NODE_ENV: process.env.NODE_ENV || '',

  DB_USERNAME: process.env.DB_USERNAME || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || '',

  VPS_IP: process.env.VPS_IP || '',

  REDIS_HOST: process.env.REDIS_HOST || '',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  SERVER_PORT: Number(process.env.SERVER_PORT) || 9000,
  SERVER_HOST: process.env.SERVER_HOST || 'localhost',

  CLIENT_DOMAIN: process.env.CLIENT_DOMAIN || 'http://localhost',
  SERVER_DOMAIN: process.env.SERVER_DOMAIN || 'http://localhost:9000',

  PASSWORD_SALT: process.env.PASSWORD_SALT || '',

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

  MAX_REPORT_THRESHOLD: process.env.MAX_REPORT_THRESHOLD || ''
}
