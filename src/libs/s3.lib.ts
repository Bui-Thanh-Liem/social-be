import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomBytes } from 'node:crypto'
import { readFileSync, unlinkSync } from 'fs'
import path, { extname } from 'node:path'
import { envs } from '~/configs/env.config'
import s3Client from '~/configs/s3.config'
import { Request } from 'express'
import formidable from 'formidable'
import { MAX_LENGTH_UPLOAD, MAX_SIZE_UPLOAD } from '~/shared/constants'
import { BadRequestError } from '~/core/error.response'

// Helper: tạo key duy nhất
const generateKey = (originalName: string) => {
  const ext = path.extname(originalName)
  const name = randomBytes(16).toString('hex')
  return `uploads/${Date.now()}-${name}${ext}`
}

// Upload file lên S3 và trả về URL và key (file nhỏ)
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
        Bucket: envs.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype!,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    )

    // Xóa file tạm
    unlinkSync(file.filepath)

    const url = `${envs.CLOUDFRONT_URL}/${key}`

    return { url, key }
  } catch (err) {
    throw new BadRequestError((err as any)?.message || 'Upload thất bại')
  }
}

// Tạo presigned URL để upload file lớn từ client lên S3 trực tiếp
export const presignedURL = async (req: Request) => {
  const { fileName, fileType } = req.body

  if (!fileName || !fileType) {
    throw new BadRequestError('fileName và fileType là bắt buộc')
  }

  const key = generateKey(fileName)

  const signedUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: envs.S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      CacheControl: 'public, max-age=31536000, immutable'
    }),
    { expiresIn: 600 } // 10 phút
  )

  return {
    success: true,
    presignedUrl: signedUrl,
    finalUrl: `${envs.CLOUDFRONT_URL}/${key}`,
    key
  }
}

// Xóa file từ S3 dựa trên mảng URL
export const deleteFromS3 = async (urls: string[]) => {
  const keys = urls.map((url) => {
    const urlObj = new URL(url)
    return urlObj.pathname.substring(1) // Bỏ dấu '/' đầu tiên
  })

  // Xóa từng file
  for (const key of keys) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: envs.S3_BUCKET_NAME,
          Key: key
        })
      )
    } catch (error) {
      console.error(`Không thể xóa file với key ${key}:`, (error as any).message)
    }
  }

  return true
}
