import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import { envs } from '~/configs/env.config'

export const signedCloudfrontUrl = (s3_key: string | string[]) => {
  const privateKey = envs.AWS_CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n')

  if (Array.isArray(s3_key)) {
    return s3_key.map((key) =>
      getSignedUrl({
        url: `${envs.AWS_CLOUDFRONT_DOMAIN}/${key}`,
        keyPairId: envs.AWS_CLOUDFRONT_KEY_PAIR_ID,
        privateKey: privateKey,
        dateLessThan: new Date(Date.now() + Number(envs.AWS_SIGNED_URL_EXPIRES_IN)).toISOString()
      })
    )
  }

  return getSignedUrl({
    url: `${envs.AWS_CLOUDFRONT_DOMAIN}/${s3_key}`,
    keyPairId: envs.AWS_CLOUDFRONT_KEY_PAIR_ID,
    privateKey: privateKey,
    dateLessThan: new Date(Date.now() + Number(envs.AWS_SIGNED_URL_EXPIRES_IN)).toISOString()
  })
}
