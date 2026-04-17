import { IQf } from '~/shared/interfaces/common/query.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

interface IGetFilterQueryParams<T> {
  qf: IQf<T>[]
  filter: Partial<Record<keyof T, any>>
  sd?: Date | undefined
  ed?: Date | undefined
}

export function getFilterQuery<T extends BaseSchema>({ qf, filter, sd, ed }: IGetFilterQueryParams<T>) {
  // lọc theo qf
  if (qf?.length > 0) {
    for (const el of qf) {
      if (el.v && el.v !== 'undefined' && el.v !== 'null') {
        filter[el.f] = {
          [el.o]: el.v
        }
      }
    }
  }

  // lọc theo ngày tháng nếu có
  if (sd || ed) {
    filter.created_at = {}

    if (sd) {
      const startDate = new Date(sd)
      startDate.setHours(0, 0, 0, 0) // Đầu ngày
      filter.created_at.$gte = startDate
    }

    if (ed) {
      const endDate = new Date(ed)
      endDate.setHours(23, 59, 59, 999) // Cuối ngày
      filter.created_at.$lte = endDate
    }
  }

  return filter
}
