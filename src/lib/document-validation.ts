export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  if (rev !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  return rev === parseInt(d[10])
}

export function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false
  let size = d.length - 2
  let nums = d.substring(0, size)
  const digits = d.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  size = size + 1
  nums = d.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return result === parseInt(digits.charAt(1))
}

export function validateCNPJAlphanumeric(cnpj: string): boolean {
  const d = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (d.length !== 14) return false
  if (!/^[A-Z0-9]+$/.test(d)) return false
  if (/^([A-Z0-9])\1{13}$/.test(d)) return false

  const charVal = (c: string) => c.charCodeAt(0) - 48
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += charVal(d[i]) * weights1[i]
  let d1 = sum % 11
  d1 = d1 < 2 ? 0 : 11 - d1

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) sum += charVal(d[i]) * weights2[i]
  let d2 = sum % 11
  d2 = d2 < 2 ? 0 : 11 - d2

  return d1 === charVal(d[12]) && d2 === charVal(d[13])
}

export function validateCPFCNPJ(value: string): boolean {
  const d = value.replace(/\D/g, '')
  if (d.length === 11) return validateCPF(d)
  if (d.length === 14) return validateCNPJ(d)
  return false
}
