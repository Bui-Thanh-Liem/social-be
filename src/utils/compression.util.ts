import { File } from 'formidable'
import { promises as fs } from 'fs' // Sử dụng fs.promises thay cho unlinkSync
import { join } from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_FOLDER_PATH } from '~/shared/constants/path-static.constant'
import { encodeHLSWithMultipleVideoStreams } from './video'

export async function compressionFile(file: File): Promise<string> {
  try {
    // Lấy tên file gốc, bỏ phần mở rộng
    const filename = file.newFilename.split('.').shift()
    // Tạo tên file mới với tiền tố để tránh trùng
    const newFilename = `compressed-${filename}.jpg`
    const outputPath = join(UPLOAD_IMAGE_FOLDER_PATH, newFilename)

    // Kiểm tra xem input và output có trùng không
    if (file.filepath === outputPath) {
      throw new Error('Input and output paths are the same')
    }

    // Nén ảnh và lưu vào file mới
    await sharp(file.filepath).jpeg({ quality: 80 }).toFile(outputPath)

    // Xóa file gốc nếu cần
    try {
      await fs.unlink(file.filepath)
      console.log(`Đã xóa file gốc: ${file.filepath}`)
    } catch (err) {
      console.warn(`Không thể xóa file gốc ${file.filepath}:`, err)
    }

    return newFilename
  } catch (err) {
    console.error('Lỗi nén ảnh:', err)
    throw err
  }
}

export async function compressionVideo(input: string) {
  await encodeHLSWithMultipleVideoStreams(input)
}
