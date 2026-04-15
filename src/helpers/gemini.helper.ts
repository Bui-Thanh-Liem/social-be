import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.response'

class GeminiHelper {
  // Khai báo thuộc tính static để lưu trữ instance duy nhất
  private static instance: GeminiHelper
  private model: GenerativeModel
  private genAI: GoogleGenerativeAI

  // Private constructor để ngăn chặn việc khởi tạo từ bên ngoài
  private constructor() {
    const apiKey = envs.GEMINI_API_KEY
    if (!apiKey) {
      throw new BadRequestError('GEMINI_API_KEY is not defined in .env')
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  /**
   * @desc Sử dụng Singleton Pattern để đảm bảo chỉ có một instance của GeminiHelper trong toàn bộ ứng dụng
   */
  public static getInstance(): GeminiHelper {
    if (!GeminiHelper.instance) {
      GeminiHelper.instance = new GeminiHelper()
    }
    return GeminiHelper.instance
  }

  /**
   * @desc Hàm gọi API Gemini để tạo phản hồi dựa trên prompt đầu vào. Trả về nội dung phản hồi dạng text.
   * @param prompt - Chuỗi đầu vào để gửi đến API Gemini
   * @returns Promise<string> - Nội dung phản hồi từ Gemini dưới dạng text
   */
  // Trong GeminiHelper.ts
  async generateResponse(prompt: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.model.generateContent(prompt)
        return result.response.text()
      } catch (error: any) {
        // Nếu là lỗi 503 và vẫn còn lượt retry
        if (error.status === 503 && i < retries - 1) {
          const delay = Math.pow(2, i) * 1000 // Đợi 1s, 2s...
          console.warn(`⚠️ Gemini Busy (503). Retrying in ${delay}ms...`)
          await new Promise((res) => setTimeout(res, delay))
          continue
        }
        throw error // Nếu lỗi khác hoặc hết lượt retry thì quăng lỗi
      }
    }
    return 'Hệ thống đang bận, vui lòng thử lại sau.'
  }
}

// Export instance duy nhất
export default GeminiHelper.getInstance()
