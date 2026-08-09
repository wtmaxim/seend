/**
 * The text burned across each rendered page. Kept in one place so the
 * viewer, the renderer and any future export all label a document the same
 * way.
 */
export function buildWatermarkLabel(visit: {
  visitorEmail: string | null
  visitorName: string | null
}): string {
  const identity = visit.visitorEmail || visit.visitorName || "Confidentiel"
  return `${identity} · ${new Date().toLocaleDateString("fr-FR")}`
}
