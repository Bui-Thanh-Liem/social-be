export const CONSTANT_REGEX = {
  USERNAME: /^@?([A-Za-z0-9_]{4,15})$/,
  ID_MONGO: /^[0-9a-fA-F]{24}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
}
