export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024
export const MAX_DOCUMENTS_PER_BATCH = 10
export const DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number]

export const DOCUMENT_EXTENSIONS: Record<DocumentContentType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
