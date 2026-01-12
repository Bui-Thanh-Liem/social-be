import { randomBytes } from 'node:crypto'
import { extname } from 'node:path'

// Tạo key duy nhất
export const generateKey = (originalName: string) => {
  const ext = extname(originalName)
  const name = randomBytes(12).toString('hex')
  const now = new Date()

  // Tạo path: uploads/2026/01/12/1705051234-abc123xyz.jpg
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')

  return `uploads/${year}/${month}/${day}/${Date.now()}-${name}${ext}`
}
