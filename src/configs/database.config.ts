import { envs } from './env.config'

export const mongodbConnection =
  envs.NODE_ENV === 'production'
    ? `mongodb://${envs.DB_USERNAME}:${envs.DB_PASSWORD}@${envs.DOMAIN}:27017/${envs.DB_NAME}?authSource=${envs.DB_NAME}&replicaSet=rs0`
    : `mongodb+srv://${envs.DB_USERNAME}:${envs.DB_PASSWORD}@cluster0-liemdev.dfynfof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-LiemDev`
