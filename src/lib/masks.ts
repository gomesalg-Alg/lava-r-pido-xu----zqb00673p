export {
  validateCPF,
  validateCNPJ,
  validateCNPJAlphanumeric,
  validateCPFCNPJ,
} from '@/lib/document-validation'

export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export function maskCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskPlaca(value: string): string {
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (upper.length <= 3) return upper
  if (upper.length <= 7) {
    const letters = upper.slice(0, 3)
    const rest = upper.slice(3)
    if (rest.length <= 1) return `${letters}-${rest}`
    return `${letters}-${rest.slice(0, 1)}${rest.slice(1, 4)}`
  }
  return upper.slice(0, 7)
}

export function maskCPFCNPJ(value: string): string {
  if (/[A-Za-z]/.test(value)) {
    return maskCNPJAlphanumeric(value)
  }
  const d = value.replace(/\D/g, '')
  if (d.length <= 11) return maskCPF(d)
  return maskCNPJ(d)
}

export function maskCNPJAlphanumeric(value: string): string {
  const d = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}
