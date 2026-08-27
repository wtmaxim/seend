/**
 * Human-readable file size. The unit labels are passed in rather than
 * hardcoded, because they're translated copy ("Ko" in French, "KB" in
 * English) and live in the message catalogues under `common.bytes`.
 */
export function formatBytes(bytes: number, units: string[]) {
  if (bytes <= 0) return `0 ${units[1] ?? units[0]}`
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}
