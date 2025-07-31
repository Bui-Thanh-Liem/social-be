import { File } from 'formidable'
import { unlinkSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_FOLDER_PATH } from '~/shared/constants/path-static.constant'
import { encodeHLSWithMultipleVideoStreams } from './video'

export async function compressionFile(file: File): Promise<string> {
  const filename = file.newFilename.split('.').shift()
  const newFilename = `${filename}.jpg`

  return new Promise((res, rej) => {
    sharp(file.filepath)
      .jpeg({ quality: 80 })
      .toFile(join(UPLOAD_IMAGE_FOLDER_PATH, newFilename))
      .then(() => {
        unlinkSync(file.filepath)
        res(newFilename)
      })
      .catch((err) => {
        rej(err)
      })
  })
}

export async function compressionVideo(input: string) {
  await encodeHLSWithMultipleVideoStreams(input)
}
