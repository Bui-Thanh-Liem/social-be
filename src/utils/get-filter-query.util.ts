import { IQf } from '~/shared/interfaces/query.interface'

export function getFilterQuery<T>(qf: IQf<T>[], filter: Partial<Record<keyof T, any>>) {
  //
  if (qf.length > 0) {
    for (const el of qf) {
      console.log('el:::', { el })
      if (el.v && el.v !== 'undefined' && el.v !== 'null') {
        filter[el.f] = {
          [el.o]: el.v
        }
      }
    }
  }

  return filter
}
