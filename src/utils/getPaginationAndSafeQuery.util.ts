import { IQuery } from '~/shared/interfaces/common/query.interface'

export function getPaginationAndSafeQuery<T>({ page = '1', limit = '10', sort, q, f, pf, sd, ed }: IQuery<T>) {
  const safePage = Math.max(Number(page), 1)
  const safeLimit = Math.max(Number(limit), 1)
  const skip = (safePage - 1) * safeLimit
  const safeQ = q || ''
  const safePf = pf ? pf : undefined

  const safeSort: Partial<Record<keyof T, 1 | -1>> = sort ?? ({ created_at: -1 } as any)

  return { skip, limit: safeLimit, sort: safeSort, q: safeQ, f: Number(f), pf: safePf, sd, ed }
}
