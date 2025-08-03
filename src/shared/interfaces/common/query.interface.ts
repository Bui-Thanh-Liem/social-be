export interface IQuery<T> {
  limit?: string
  page?: string
  sort?: Partial<Record<keyof T, 1 | -1>>
}
