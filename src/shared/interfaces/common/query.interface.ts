export interface IQuery<T> {
  limit?: string
  page?: string
  sort?: Partial<Record<keyof T, 1 | -1>>
  q?: string
  f?: '1' // trả về những tweet có media
  pf?: string // people follow
  sd?: Date
  ed?: Date

  // Profile
  profile_id?: string
  ishl?: '1' | '0'
}
