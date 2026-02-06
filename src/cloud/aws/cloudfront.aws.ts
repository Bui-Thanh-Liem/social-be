import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.response'
import { IMediaBare } from '~/modules/media/media.interface'

export const signedCloudfrontUrl = (bareMedia: IMediaBare | IMediaBare[] | undefined) => {
  try {
    //
    if (!bareMedia) return { s3_key: '', url: '' }

    // 1. XỬ LÝ PRIVATE KEY: Loại bỏ dấu ngoặc kép dư thừa và xử lý ký tự xuống dòng
    let privateKey = (envs.AWS_CLOUDFRONT_PRIVATE_KEY || '').trim()

    // Nếu bị bao bởi dấu ngoặc kép (do dán vào env bị dư)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1)
    }

    // Thay thế chuỗi "\n" thành ký tự xuống dòng thực tế
    privateKey = privateKey.replace(/\\n/g, '\n')

    //
    if (Array.isArray(bareMedia)) {
      return bareMedia
        .filter((x) => x.s3_key)
        .map((media) => ({
          s3_key: media.s3_key,
          url: getSignedUrl({
            url: `${envs.AWS_CLOUDFRONT_DOMAIN}/${media.s3_key}`,
            keyPairId: envs.AWS_CLOUDFRONT_KEY_PAIR_ID,
            privateKey: privateKey,
            dateLessThan: new Date(Date.now() + (Number(envs.AWS_SIGNED_URL_EXPIRES_IN) || 43200000)).toISOString()
          })
        }))
    }

    //
    if (!bareMedia.s3_key) {
      return bareMedia
    }

    //
    return {
      s3_key: bareMedia.s3_key,
      url: getSignedUrl({
        url: `${envs.AWS_CLOUDFRONT_DOMAIN}/${bareMedia.s3_key}`,
        keyPairId: envs.AWS_CLOUDFRONT_KEY_PAIR_ID,
        privateKey: privateKey,
        dateLessThan: new Date(Date.now() + Number(envs.AWS_SIGNED_URL_EXPIRES_IN)).toISOString()
      })
    }
  } catch (error) {
    console.log('s3_key:::', bareMedia, error)
    throw new BadRequestError('Ký URL Cloudfront thất bại')
  }
}
