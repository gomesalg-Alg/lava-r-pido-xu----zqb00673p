import pb from '@/lib/pocketbase/client'

export interface BankMapAccount {
  id: string
  name: string
  code: string
}

export interface BankMapData {
  accounts: BankMapAccount[]
  months: string[]
  revenue: Record<string, Record<string, number>>
  received: Record<string, number>
}

export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-')
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const idx = parseInt(monthNum, 10) - 1
  return `${names[idx]}/${year.slice(2)}`
}

export const getBankMap = (start: string, end: string) =>
  pb.send(
    `/backend/v1/bank-map?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { method: 'GET' },
  ) as Promise<BankMapData>
