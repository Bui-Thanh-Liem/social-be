import { IQuery } from '~/shared/interfaces/common/query.interface'

export function getPaginationAndSafeQuery<T>({ page = '1', limit = '10', sort, q, qe, t, f, pf, sd, ed }: IQuery<T>) {
  const safe_q = q || ''
  const safe_qe = qe || ''
  const safe_page = Math.max(Number(page), 1)
  const safe_limit = Math.max(Number(limit), 1)
  const skip = (safe_page - 1) * safe_limit
  const safe_pf = pf ? pf : undefined
  const safe_sort: Partial<Record<keyof T, 1 | -1>> = sort ?? ({ created_at: -1 } as any)

  return { skip, limit: safe_limit, sort: safe_sort, q: safe_q, qe: safe_qe, f: f, pf: safe_pf, sd, ed, t: t }
}
