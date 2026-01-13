import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.response'
import { IMediaBare } from '~/shared/interfaces/schemas/media.interface'

export const signedCloudfrontUrl = (bareMedia: IMediaBare | IMediaBare[] | undefined) => {
  try {
    //
    if (!bareMedia) return { s3_key: '', url: '' }

    //
    const privateKey = envs.AWS_CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n')

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
            dateLessThan: new Date(Date.now() + Number(envs.AWS_SIGNED_URL_EXPIRES_IN)).toISOString()
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
