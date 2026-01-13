import { createLogger, transports, format } from 'winston'

export const logger = createLogger({
  level: 'info', // mặc định log từ info trở lên
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`
    })
  ),
  transports: [
    new transports.Console(), // log ra console
    new transports.File({ filename: 'logs/error.log', level: 'warn' }) // log vào file
  ]
})
