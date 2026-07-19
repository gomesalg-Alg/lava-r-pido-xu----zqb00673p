export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function formatDuration(entryAt: string, exitAt: string): string {
  if (!entryAt || !exitAt) return '--'
  const entry = new Date(entryAt).getTime()
  const exit = new Date(exitAt).getTime()
  if (isNaN(entry) || isNaN(exit)) return '--'
  if (exit < entry) return 'Inválido'
  const diffMs = exit - entry
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

export function toDatetimeLocal(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function toDateInput(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0].split(' ')[0]
}
