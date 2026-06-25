export function maskPassportIc(value) {
  const s = String(value ?? '').trim()
  if (!s || s === '—') return s
  if (s.length <= 4) return '*'.repeat(s.length)
  if (s.length <= 8) {
    return `${s[0]}${'*'.repeat(s.length - 2)}${s[s.length - 1]}`
  }
  const headLen = 3
  const tailLen = 3
  const maskLen = s.length - headLen - tailLen
  return `${s.slice(0, headLen)}${'*'.repeat(maskLen)}${s.slice(-tailLen)}`
}
