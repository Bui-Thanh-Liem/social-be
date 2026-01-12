import { PutObjectCommand, DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { readFileSync, unlinkSync } from 'fs'
import { Request } from 'express'
import formidable from 'formidable'
import { MAX_LENGTH_UPLOAD, MAX_SIZE_UPLOAD } from '~/shared/constants'
import { BadRequestError } from '~/core/error.response'
import { envs } from '~/configs/env.config'
import { generateKey } from '~/utils/create-key-upload-media.util'
import { PresignedUrlDto } from '~/shared/dtos/req/upload.dto'
import { ResPresignedUrl } from '~/shared/dtos/res/upload.dto'

//
const isDev = process.env.NODE_ENV === 'development'

// Khởi tạo S3 client (.env.dev, prod thì dùng IAM Role)
export const s3Client = new S3Client({
  region: envs.AWS_REGION,
  credentials: isDev
    ? {
        accessKeyId: envs.AWS_ACCESS_KEY_ID,
        secretAccessKey: envs.AWS_SECRET_ACCESS_KEY
      }
    : undefined
})

// Tạo presigned URL để upload file lớn từ client lên S3 trực tiếp
export const presignedURL = async ({ file_name, file_type }: PresignedUrlDto): Promise<ResPresignedUrl> => {
  if (!file_name || !file_type) {
    throw new BadRequestError('fileName và fileType là bắt buộc')
  }

  const key = generateKey(file_name)

  const signed_url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Key: key,
      ContentType: file_type,
      Bucket: envs.AWS_S3_BUCKET_NAME,
      CacheControl: 'public, max-age=31536000, immutable'
    }),
    { expiresIn: Number(envs.AWS_PRESIGNED_URL_EXPIRES_IN) }
  )

  return {
    key,
    presigned_url: signed_url
  }
}

// Xóa file từ S3 dựa trên mảng URL
export const deleteFromS3 = async (keys: string[]) => {
  if (!keys || keys.length === 0) return

  // 1. Chia nhỏ mảng nếu có hơn 1000 keys (Chunking)
  const MAX_DELETE_SIZE = 1000
  const chunks = []
  for (let i = 0; i < keys.length; i += MAX_DELETE_SIZE) {
    chunks.push(keys.slice(i, i + MAX_DELETE_SIZE))
  }

  try {
    const results = await Promise.all(
      chunks.map((chunk) => {
        const Objects = chunk.map((key) => ({ Key: key }))

        return s3Client.send(
          new DeleteObjectsCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Delete: {
              Objects,
              Quiet: false // Chỉnh thành false để biết file nào lỗi
            }
          })
        )
      })
    )

    // 2. Kiểm tra xem có file nào xóa lỗi không
    results.forEach((res) => {
      if (res.Errors && res.Errors.length > 0) {
        console.error('Các file xóa lỗi:', res.Errors)
      }
    })

    console.log(`Đã xử lý xóa ${keys.length} file.`)
  } catch (error) {
    // Lỗi này thường là lỗi kết nối hoặc quyền hạn (IAM Role)
    console.error('Lỗi hệ thống khi xóa hàng loạt:', error)
    throw error
  }
}

// Upload file lên S3 và trả về URL và key (thường không sử dụng, resize và watermark nên dùng lambda)
export const uploadToS3 = async (req: Request) => {
  // Thiết lập formidable
  const form = formidable({
    multiples: true,
    keepExtensions: true,
    maxFileSize: MAX_SIZE_UPLOAD,
    maxFiles: MAX_LENGTH_UPLOAD,
    maxTotalFileSize: MAX_LENGTH_UPLOAD * MAX_SIZE_UPLOAD,
    filter: ({ name, originalFilename, mimetype }) => {
      const isValidMime = (mimetype?.startsWith('image/') || mimetype?.startsWith('video/')) ?? false

      const isValidField = name === 'images' || name === 'videos'

      const valid = isValidField && isValidMime

      if (!valid) {
        form.emit('error' as any, new BadRequestError('File type or filename is not valid') as any)
      }

      return valid
    }
  })

  //
  try {
    const [, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      throw new BadRequestError('Không có file nào được upload!')
    }

    // Đọc file vào buffer
    const buffer = readFileSync(file.filepath)

    const key = generateKey(file.originalFilename!)

    await s3Client.send(
      new PutObjectCommand({
        Key: key,
        Body: buffer,
        Bucket: envs.AWS_S3_BUCKET_NAME,
        ContentType: file.mimetype!,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    )

    // Xóa file tạm
    unlinkSync(file.filepath)

    const url = `${''}/${key}`

    return { url, key }
  } catch (err) {
    throw new BadRequestError((err as any)?.message || 'Upload thất bại')
  }
}
