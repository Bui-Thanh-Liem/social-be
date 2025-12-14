export const CONSTANT_REGEX = {
  ID_MONGO: /^[0-9a-fA-F]{24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^@?([A-Za-z0-9_]{4,20})$/,
  FIND_KEYWORD: /\b[A-Z][a-zA-Z0-9]*\b/g,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
} as const
