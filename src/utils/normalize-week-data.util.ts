const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7, 8] // T2 -> CN
const DAY_NAME = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function normalizeWeekData(data: any[]) {
  const map = new Map<number, any>()
  data.forEach((item) => map.set(item.day, item))

  return DAY_ORDER.map((day) => ({
    name: DAY_NAME[day - 1],
    tt: map.get(day)?.tt || 0,
    tn: map.get(day)?.tn || 0
  }))
}
