import { Request } from 'express'
import formidable, { File, Part } from 'formidable'
import fs, { createReadStream, unlink } from 'fs'
import { ObjectId } from 'mongodb'
import { nanoid } from 'nanoid'
import path from 'path'
import { compressionQueue } from '~/bull/queues'
import cloudinary from '~/configs/cloudinary.config'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.reponse'
import VideosService from '~/services/Videos.service'
import {
  CONSTANT_JOB,
  MAX_LENGTH_IMAGE_UPLOAD,
  MAX_LENGTH_UPLOAD,
  MAX_LENGTH_VIDEO_UPLOAD,
  MAX_SIZE_IMAGE_UPLOAD,
  MAX_SIZE_UPLOAD,
  MAX_SIZE_VIDEO_UPLOAD
} from '~/shared/constants'
import { UPLOAD_IMAGE_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from '~/shared/constants/path-static.constant'
import { EMediaType } from '~/shared/enums/type.enum'
import { compressionFile } from './compression.util'
import { logger } from './logger.util'

interface UploadedFile {
  url: string
  public_id: string
  format: string
  resource_type: EMediaType // <-- cái này quan trọng!
  width?: number
  height?: number
  duration?: number // chỉ có ở video
  bytes: number
}

export interface DeleteResult {
  url: string
  public_id: string
  resource_type: 'image' | 'video' | 'raw'
  deleted: boolean
  error?: string
}

interface ParsedCloudinaryUrl {
  public_id: string
  resource_type: 'image' | 'video' | 'raw'
}

export function uploadImages(req: Request): Promise<string[]> {
  // Kiểm tra & tạo folder lưu trữ nếu chưa tồn tại
  if (!fs.existsSync(UPLOAD_IMAGE_FOLDER_PATH)) {
    fs.mkdirSync(UPLOAD_IMAGE_FOLDER_PATH, { recursive: true })
  }

  // Thiết lập formidable
  const form = formidable({
    multiples: true,
    maxFiles: MAX_LENGTH_IMAGE_UPLOAD,
    keepExtensions: true,
    uploadDir: UPLOAD_IMAGE_FOLDER_PATH,
    maxFileSize: MAX_SIZE_IMAGE_UPLOAD,
    maxTotalFileSize: MAX_LENGTH_IMAGE_UPLOAD * MAX_SIZE_IMAGE_UPLOAD,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'images' && Boolean(mimetype && mimetype?.includes('image/'))

      if (!valid) {
        form.emit('error' as any, new BadRequestError('File type or filename is not valid') as any)
      }

      return valid
    }
  })

  //
  return new Promise((res, rej) => {
    form.parse(req, (err, fields, files) => {
      logger.info('files::', files)

      //
      if (err) {
        return rej(new BadRequestError(err?.message || 'Images upload error'))
      }

      const imageUploaded = files['images'] as File[]
      ;(async () => {
        try {
          const compressedFiles = await Promise.all(imageUploaded.map((img) => compressionFile(img)))
          const imgMap = compressedFiles.map((img) => `${envs.SERVER_DOMAIN}/uploads/${img}`)
          res(imgMap)
        } catch (error) {
          rej(error)
        }
      })()
    })
  })
}

export function uploadVideos(req: Request): Promise<string[]> {
  //
  if (!fs.existsSync(UPLOAD_VIDEO_FOLDER_PATH)) {
    fs.mkdirSync(UPLOAD_VIDEO_FOLDER_PATH, { recursive: true })
  }

  //
  const form = formidable({
    multiples: true,
    maxFiles: MAX_LENGTH_VIDEO_UPLOAD,
    keepExtensions: true,
    uploadDir: UPLOAD_VIDEO_FOLDER_PATH,
    maxFileSize: MAX_SIZE_VIDEO_UPLOAD,
    maxTotalFileSize: MAX_LENGTH_VIDEO_UPLOAD * MAX_SIZE_VIDEO_UPLOAD,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'videos' && Boolean(mimetype && mimetype?.includes('video/'))

      if (!valid) {
        form.emit('error' as any, new BadRequestError('File type or filename is not valid') as any)
      }

      return valid
    },
    filename(name: string, ext: string, part: Part) {
      // Mục đích tạo cho mỗi video 1 folder để convert HLS
      const filename = nanoid()

      //
      const folderPath = path.join(UPLOAD_VIDEO_FOLDER_PATH, filename)

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }

      return `${filename}/${filename}${ext}`
    }
  })

  //
  return new Promise((res, rej) => {
    form.parse(req, (err, fields, files) => {
      //
      if (err) {
        return rej(new BadRequestError(err?.message || 'Videos upload error'))
      }

      //
      const videoUploaded = files['videos'] as File[]

      ;(async () => {
        try {
          const videoMap = Promise.all(
            videoUploaded.map(async (video) => {
              //
              const user_id = new ObjectId(req.decoded_authorization?.user_id)
              const name = video.newFilename.split('/')[0]

              //
              const newVideo = await VideosService.create({
                name,
                user_id,
                size: video.size
              })

              // Sử dụng Queue phía trên đơn giản hơn, nhưng chung thread (lag app), không tận dụng chạy song song, không retry
              compressionQueue.add(CONSTANT_JOB.COMPRESSION_HLS, {
                _id: newVideo.insertedId,
                path: video.filepath
              })

              // http://localhost:9000/videos-hls/m6kQ0q4q2vbJIduXCAssl/master.m3u8
              return `${envs.SERVER_DOMAIN}/videos-hls/${name}/master.m3u8`
            })
          )

          res(videoMap)
        } catch (error) {
          rej(error)
        }
      })()
    })
  })
}

export const uploadToCloudinary = async (req: Request): Promise<UploadedFile[]> => {
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

  try {
    const [, files] = await form.parse(req)

    // Chuẩn hóa tất cả file từ mọi field
    const fileArray: formidable.File[] = []

    Object.values(files).forEach((item) => {
      if (Array.isArray(item)) {
        fileArray.push(...item.filter((f): f is formidable.File => !!f))
      } else if (item) {
        fileArray.push(item)
      }
    })

    if (fileArray.length === 0) {
      throw new BadRequestError('Không có file nào được upload!')
    }

    const uploadSingleFile = async (file: formidable.File): Promise<UploadedFile> => {
      // file.filepath luôn tồn tại và là đường dẫn file tạm trên disk
      if (!file.filepath || typeof file.filepath !== 'string') {
        throw new Error('File không có đường dẫn tạm')
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'twitter',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result!)
          }
        )

        createReadStream(file.filepath)
          .on('error', (err) => {
            reject(err)
          })
          .pipe(uploadStream)
      })

      // Xóa file tạm ngay sau khi upload xong
      unlink(file.filepath, (err) => {
        if (err) console.warn('Không thể xóa file tạm:', file.filepath)
      })

      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        width: result.width ?? undefined,
        height: result.height ?? undefined,
        duration: result.resource_type === 'video' ? result.duration : undefined,
        bytes: result.bytes
      }
    }

    const uploadedFiles = await Promise.all(fileArray.map(uploadSingleFile))

    return uploadedFiles
  } catch (error: any) {
    throw new BadRequestError(error.message || 'Upload thất bại')
  }
}

/**
 * Xoá 1 ảnh đã upload
 * @param filename Tên file ảnh (ví dụ: abc.png)
 */
export function deleteImage(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPLOAD_IMAGE_FOLDER_PATH, filename)

    if (!fs.existsSync(filePath)) {
      return reject(new BadRequestError('Image not found'))
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`❌ Delete image ${filename} failed:`, err)
        return reject(new BadRequestError('Delete image failed'))
      }
      logger.info(`✅ Delete image ${filename} success`)
      resolve()
    })
  })
}

/**
 * Xoá 1 video (xoá cả folder chứa file gốc & HLS)
 * @param folderName Tên folder video (ví dụ: m6kQ0q4q2vbJIduXCAssl)
 */
export function deleteVideo(folderName: string): Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const folderPath = path.join(UPLOAD_VIDEO_FOLDER_PATH, folderName)

      if (!fs.existsSync(folderPath)) {
        return reject(new BadRequestError('Video not found'))
      }

      // Xoá folder
      await fs.promises.rm(folderPath, { recursive: true, force: true })
      logger.info(`✅ Delete video ${folderName} success`)

      resolve()
    } catch (err) {
      logger.error(`❌ Delete video ${folderName} failed:`, err)
      reject(new BadRequestError('Delete video failed'))
    }
  })
}

/**
 * Xoá 1 ảnh đã upload
 * @param filename Tên file ảnh (ví dụ: https://res.cloudinary.com/dfvk6nhrj/image/upload/v1764041443/profile/dev_hjqs6m.png)
 */
export const deleteFromCloudinary = async (urls: string[]): Promise<DeleteResult[]> => {
  if (!urls || urls.length === 0) {
    return []
  }

  const parsedItems: { url: string; data: ParsedCloudinaryUrl }[] = []

  // Parse tất cả URL trước
  for (const url of urls) {
    try {
      const data = parseCloudinaryUrl(url.trim())
      parsedItems.push({ url, data })
    } catch (err) {
      parsedItems.push({
        url,
        data: { public_id: '', resource_type: 'image' }
      })
    }
  }

  // Gom nhóm theo resource_type để xóa riêng
  const groups = {
    image: parsedItems.filter((i) => i.data.resource_type === 'image'),
    video: parsedItems.filter((i) => i.data.resource_type === 'video'),
    raw: parsedItems.filter((i) => i.data.resource_type === 'raw')
  }

  const results: DeleteResult[] = []

  // Hàm xóa 1 nhóm
  const deleteGroup = async (items: typeof parsedItems, type: 'image' | 'video' | 'raw') => {
    const publicIds = items.map((i) => i.data.public_id).filter(Boolean)
    if (publicIds.length === 0) return

    const chunks = []
    for (let i = 0; i < publicIds.length; i += 100) {
      chunks.push(publicIds.slice(i, i + 100))
    }

    for (const chunk of chunks) {
      try {
        const result = await cloudinary.api.delete_resources(chunk, {
          resource_type: type,
          type: 'upload'
        })

        chunk.forEach((public_id) => {
          const item = items.find((i) => i.data.public_id === public_id)!
          const status = result.deleted[public_id]
          if (status === 'deleted' || status === 'not_found') {
            results.push({
              url: item.url,
              public_id,
              resource_type: type,
              deleted: true
            })
          } else {
            results.push({
              url: item.url,
              public_id,
              resource_type: type,
              deleted: false,
              error: status || 'unknown_error'
            })
          }
        })
      } catch (error: any) {
        chunk.forEach((public_id) => {
          const item = items.find((i) => i.data.public_id === public_id)!
          results.push({
            url: item.url,
            public_id,
            resource_type: type,
            deleted: false,
            error: error.message || 'Network error'
          })
        })
      }
    }
  }

  // Xóa từng nhóm song song
  await Promise.all([
    deleteGroup(groups.image, 'image'),
    deleteGroup(groups.video, 'video'),
    deleteGroup(groups.raw, 'raw')
  ])

  return results
}

// Hàm parse URL thành public_id + resource_type
const parseCloudinaryUrl = (url: string): ParsedCloudinaryUrl => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)

    // Cloudinary URL format: https://res.cloudinary.com/cloudname/image/upload/v.../folder/file.jpg
    const cloudNameIndex = pathParts.findIndex((p) => p === process.env.CLOUDINARY_CLOUD_NAME)
    if (cloudNameIndex === -1) throw new BadRequestError('URL không hợp lệ')

    const resourceTypeIndex = cloudNameIndex + 1
    const uploadIndex = pathParts.indexOf('upload', resourceTypeIndex)

    if (uploadIndex === -1) throw new BadRequestError('Invalid upload path')

    const resource_type = pathParts[resourceTypeIndex] as 'image' | 'video' | 'raw'
    if (!['image', 'video', 'raw'].includes(resource_type)) {
      throw new BadRequestError('Invalid resource type')
    }

    // Lấy từ sau "upload" đến hết
    const afterUpload = pathParts.slice(uploadIndex + 1)

    // Bỏ version (v123456789/) nếu có
    if (afterUpload[0]?.match(/^v\d+$/)) {
      afterUpload.shift()
    }

    // Ghép lại thành public_id (có folder)
    let public_id_with_folder = afterUpload.join('/')

    // Bỏ extension (.jpg, .png, .mp4, ...)
    public_id_with_folder = public_id_with_folder.replace(/\.[^/.]+$/, '')

    const public_id = public_id_with_folder

    return { public_id, resource_type }
  } catch (err) {
    throw new BadRequestError(
      `Không thể parse URL Cloudinary: ${url} - ${err instanceof Error ? err.message : 'Invalid URL'}`
    )
  }
}
