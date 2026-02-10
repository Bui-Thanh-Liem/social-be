export interface IQuery<T> {
  limit?: string
  page?: string
  sort?: Partial<Record<keyof T, 1 | -1>>
  q?: string
  qe?: string // q extra
  qf?: {
    f: keyof T // field
    v: string // value
    o?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin'
  }
  t?: 'top'
  f?: 'media' // trả về những tweet có media
  pf?: string // people follow
  sd?: Date
  ed?: Date

  // Profile
  user_id?: string
  community_id?: string
  ishl?: '1' | '0'
  isMedia?: '1' | '0'
  ids?: string[]

  top?: string
}
