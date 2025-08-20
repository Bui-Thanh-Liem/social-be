export interface IQuery<T> {
  limit?: string
  page?: string
  sort?: Partial<Record<keyof T, 1 | -1>>
  q?: string
  f?: string // media type
  pf?: string // people follow

  // Profile
  profile_id?: string
  ishl?: '1' | '0'
}
