import { Request } from 'express'
import formidable from 'formidable'
import { createReadStream, unlink } from 'fs'
import cloudinary from '~/configs/cloudinary.config'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.response'
import { MAX_LENGTH_UPLOAD, MAX_SIZE_UPLOAD } from '~/shared/constants'
import { EMediaType } from '~/shared/enums/type.enum'
import { IMedia } from '~/shared/interfaces/common/media.interface'

export interface UploadedCloudinaryFile {
  url: string
  public_id: string
  format: string
  resource_type: 'image' | 'video' // <-- cái này quan trọng!
  width?: number
  height?: number
  duration?: number // chỉ có ở video
  bytes: number
}

interface DeleteResult {
  public_id: string
  resource_type: EMediaType
  deleted: boolean
  error?: string
}

export const uploadToCloudinary = async (req: Request): Promise<UploadedCloudinaryFile[]> => {
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

    const uploadSingleFile = async (file: formidable.File): Promise<UploadedCloudinaryFile> => {
      // file.filepath luôn tồn tại và là đường dẫn file tạm trên disk
      if (!file.filepath || typeof file.filepath !== 'string') {
        throw new BadRequestError('File không có đường dẫn tạm')
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: envs.CLOUDINARY_FOLDER_NAME,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
          },
          (error: any, result: any) => {
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
 * @param filename Tên file ảnh (ví dụ: https://res.cloudinary.com/dfvk6nhrj/image/upload/v1764041443/profile/dev_hjqs6m.png)
 */
export const deleteFromCloudinary = async (media: IMedia[]): Promise<DeleteResult[]> => {
  console.log('Deleting media from Cloudinary:', media)
  if (!media || media.length === 0) {
    return []
  }

  // Parse tất cả URL trước
  // const parsedItems: { url: string; data: ParsedCloudinaryUrl }[] = []
  // for (const url of urls) {
  //   try {
  //     const data = parseCloudinaryUrl(url.trim())
  //     parsedItems.push({ url, data })
  //   } catch (err) {
  //     parsedItems.push({
  //       url,
  //       data: { public_id: '', resource_type: 'image' }
  //     })
  //   }
  // }

  // Gom nhóm theo resource_type để xóa riêng
  const groups = {
    image: media?.filter((i) => i.resource_type === 'image'),
    video: media?.filter((i) => i.resource_type === 'video'),
    raw: media?.filter((i) => i.resource_type === 'raw')
  }

  const results: DeleteResult[] = []

  // Hàm xóa 1 nhóm
  const deleteGroup = async (items: typeof media, type: EMediaType) => {
    const publicIds = items.map((i) => i.public_id).filter(Boolean)
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
          const item = items.find((i) => i.public_id === public_id)!
          const status = result.deleted[public_id]
          if (status === 'deleted' || status === 'not_found') {
            results.push({
              public_id,
              resource_type: type,
              deleted: true
            })
          } else {
            results.push({
              public_id,
              resource_type: type,
              deleted: false,
              error: status || 'unknown_error'
            })
          }
        })
      } catch (error: any) {
        chunk.forEach((public_id) => {
          const item = items.find((i) => i.public_id === public_id)!
          results.push({
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
    deleteGroup(groups.image, EMediaType.Image),
    deleteGroup(groups.video, EMediaType.Video),
    deleteGroup(groups.raw, EMediaType.Raw)
  ])

  return results
}

// Hàm parse URL thành public_id + resource_type
export const parseCloudinaryUrl = (url: string): IMedia => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)

    // Cloudinary URL format: https://res.cloudinary.com/cloudname/image/upload/v.../folder/file.jpg
    const cloudNameIndex = pathParts.findIndex((p) => p === process.env.CLOUDINARY_CLOUD_NAME)
    if (cloudNameIndex === -1) throw new BadRequestError('URL không hợp lệ')

    const resourceTypeIndex = cloudNameIndex + 1
    const uploadIndex = pathParts.indexOf('upload', resourceTypeIndex)

    if (uploadIndex === -1) throw new BadRequestError('Invalid upload path')

    const resource_type = pathParts[resourceTypeIndex] as EMediaType
    if (!Object.values(EMediaType).includes(resource_type)) {
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

    return { public_id, resource_type, url }
  } catch (err) {
    throw new BadRequestError(
      `Không thể parse URL Cloudinary: ${url} - ${err instanceof Error ? err.message : 'Invalid URL'}`
    )
  }
}
