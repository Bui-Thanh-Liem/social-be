import { Request } from 'express'
// const { default: formidable } = await import('formidable')
import formidable, { File, Part } from 'formidable'
import fs from 'fs'
import { ObjectId } from 'mongodb'
import { nanoid } from 'nanoid'
import path from 'path'
import { envs } from '~/configs/env.config'
import { compressionQueue } from '~/libs/bull/queues'
import VideosService from '~/services/Videos.service'
import { BadRequestError } from '~/shared/classes/error.class'
import {
  CONSTANT_JOB,
  MAX_LENGTH_IMAGE_UPLOAD,
  MAX_LENGTH_VIDEO_UPLOAD,
  MAX_SIZE_IMAGE_UPLOAD,
  MAX_SIZE_VIDEO_UPLOAD
} from '~/shared/constants'
import { UPLOAD_IMAGE_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from '~/shared/constants/path-static.constant'
import { compressionFile } from './compression.util'
import { logger } from './logger.util'

// class Queue {
//   items: string[]
//   encoding: boolean
//   constructor() {
//     this.items = []
//     this.encoding = false
//   }

//   enqueue(item: string) {
//     this.items.push(item)
//     this.processEncode()
//   }

//   async processEncode() {
//     if (this.encoding) return
//     if (this.items.length > 0) {
//       this.encoding = true
//       const filepath = this.items[0]
//       try {
//         await compressionVideo(filepath)
//         this.items.shift()
//         logger.info(`Encode video ${filepath} success`)
//       } catch (error) {
//         logger.info(`Encode video ${filepath} error`)
//         logger.info('error:::', error)
//       }
//       this.encoding = false
//       this.processEncode()
//     } else {
//       logger.info('Encode video queue is empty')
//     }
//   }
// }

// const queue = new Queue()

export function uploadImages(req: Request): Promise<string[]> {
  //
  if (!fs.existsSync(UPLOAD_IMAGE_FOLDER_PATH)) {
    fs.mkdirSync(UPLOAD_IMAGE_FOLDER_PATH, { recursive: true })
  }

  //
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
          const imgMap = compressedFiles.map((img) => `${envs.SERVER_DOMAIN}/${img}`)
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

      // Xoá trong DB
      await VideosService.delete(folderName)

      resolve()
    } catch (err) {
      logger.error(`❌ Delete video ${folderName} failed:`, err)
      reject(new BadRequestError('Delete video failed'))
    }
  })
}
