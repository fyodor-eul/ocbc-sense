// Turns typed digits into "DD / MM / YYYY".
export function formatDob(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join(' / ')
}

// Returns a Date, or null if the text is not a real past date.
export function parseDob(text) {
  const m = /^(\d{2}) \/ (\d{2}) \/ (\d{4})$/.exec(text)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  const date = new Date(year, month - 1, day)
  const real = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  if (!real || year < 1900 || date > new Date()) return null
  return date
}

export function ageFrom(date, today = new Date()) {
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age -= 1
  return age
}