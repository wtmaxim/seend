import { get, put } from "@vercel/blob"
import * as mupdf from "mupdf"
import { after } from "next/server"

import { prisma } from "@/lib/prisma"

/**
 * Renders documents to page images so the original file is never handed to
 * a visitor. Sharing the source blob would leak full resolution, embedded
 * metadata (EXIF, including GPS on photos), and let anyone bypass every
 * protection applied in the viewer, so visitor-facing routes only ever
 * serve output from here.
 */

/** Long edge of a rendered page, in pixels. Caps render cost and file size. */
const MAX_EDGE = 1600
const JPEG_QUALITY = 75

/** Watermark tiling, in pixels of the rendered page. */
const WATERMARK_FONT_SIZE = 16
const WATERMARK_STEP_X = 340
const WATERMARK_STEP_Y = 170
const WATERMARK_OPACITY = 0.18
const WATERMARK_ANGLE = -30

async function loadSource(pathname: string): Promise<Uint8Array> {
  const result = await get(pathname, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN })
  if (!result?.stream) throw new Error(`Blob introuvable: ${pathname}`)
  return new Uint8Array(await new Response(result.stream).arrayBuffer())
}

/** Deterministic path for the cached, unwatermarked render of one page. */
function baseRenderCachePathname(organizationId: string, documentId: string, pageNumber: number): string {
  return `organizations/${organizationId}/documents/${documentId}/render-cache/${pageNumber}.jpg`
}

async function loadCachedBase(cachePathname: string): Promise<Uint8Array | null> {
  const result = await get(cachePathname, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN })
  if (!result?.stream) return null
  return new Uint8Array(await new Response(result.stream).arrayBuffer())
}

async function storeCachedBase(cachePathname: string, jpeg: Uint8Array): Promise<void> {
  await put(cachePathname, Buffer.from(jpeg), {
    access: "private",
    contentType: "image/jpeg",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
}

function openDocument(source: Uint8Array, contentType: string) {
  // mupdf reads images as single-page documents, so PDFs and images share
  // one code path.
  return mupdf.Document.openDocument(source, contentType || "application/pdf")
}

/**
 * Number of pages, cached on the document after the first call so repeated
 * views don't re-download and re-parse the source.
 */
export async function getDocumentPageCount(document: {
  id: string
  pathname: string
  contentType: string
  pageCount: number | null
}): Promise<number> {
  if (document.pageCount != null) return document.pageCount

  const pageCount = document.contentType.startsWith("image/")
    ? 1
    : openDocument(await loadSource(document.pathname), document.contentType).countPages()

  await prisma.document.update({ where: { id: document.id }, data: { pageCount } })
  return pageCount
}

/** Renders one page from the source file, at final resolution, no watermark. */
async function renderBaseJpeg(pathname: string, contentType: string, pageNumber: number): Promise<Uint8Array> {
  const doc = openDocument(await loadSource(pathname), contentType)

  const totalPages = doc.countPages()
  if (pageNumber < 1 || pageNumber > totalPages) {
    throw new Error(`Page ${pageNumber} hors limites (1-${totalPages})`)
  }

  const page = doc.loadPage(pageNumber - 1)
  const [ulx, uly, lrx, lry] = page.getBounds()
  const width = Math.abs(lrx - ulx)
  const height = Math.abs(lry - uly)
  if (width <= 0 || height <= 0) throw new Error("Dimensions de page invalides")

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const pixmap = page.toPixmap(
    mupdf.Matrix.scale(scale, scale),
    mupdf.ColorSpace.DeviceRGB,
    false,
    true
  )

  return pixmap.asJPEG(JPEG_QUALITY)
}

/** Burns `label` into an already-rendered page JPEG and re-encodes it. */
function burnWatermarkOntoJpeg(jpeg: Uint8Array, label: string): Uint8Array {
  const doc = openDocument(jpeg, "image/jpeg")
  const page = doc.loadPage(0)
  const pixmap = page.toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false, true)
  burnWatermark(pixmap, label)
  return pixmap.asJPEG(JPEG_QUALITY)
}

/**
 * Renders one page to JPEG, optionally burning `watermarkLabel` into the
 * pixels. Burning rather than overlaying in the DOM means the watermark
 * survives saving or screenshotting the image, at the cost of the render
 * being specific to one viewer and therefore not shareable between them.
 *
 * The unwatermarked base render is cached in blob storage after the first
 * request for a given page: the source PDF is only ever downloaded and
 * parsed once, and every later view (watermarked or not) reuses that base
 * image, whether the viewer is the same visitor or someone else entirely.
 * The cache write happens after the response is sent (see `after()` below)
 * so the visitor who triggers the first render never pays for it.
 */
export async function renderDocumentPage({
  documentId,
  organizationId,
  pathname,
  contentType,
  pageNumber,
  watermarkLabel,
}: {
  documentId: string
  organizationId: string
  pathname: string
  contentType: string
  pageNumber: number
  watermarkLabel?: string | null
}): Promise<Uint8Array> {
  const cachePathname = baseRenderCachePathname(organizationId, documentId, pageNumber)

  let baseJpeg = await loadCachedBase(cachePathname)
  if (!baseJpeg) {
    baseJpeg = await renderBaseJpeg(pathname, contentType, pageNumber)
    const freshBase = baseJpeg
    after(() =>
      storeCachedBase(cachePathname, freshBase).catch((error) => {
        console.error("[document-render] cache write failed", error)
      })
    )
  }

  if (!watermarkLabel) return baseJpeg

  return burnWatermarkOntoJpeg(baseJpeg, watermarkLabel)
}

function burnWatermark(pixmap: mupdf.Pixmap, label: string) {
  const font = new mupdf.Font("Helvetica")
  const device = new mupdf.DrawDevice(mupdf.Matrix.identity, pixmap)
  const width = pixmap.getWidth()
  const height = pixmap.getHeight()

  // A negative Y scale flips the PDF text convention (Y up) to the pixmap's
  // raster convention (Y down); without it the text renders mirrored.
  const glyphMatrix = mupdf.Matrix.concat(
    mupdf.Matrix.scale(WATERMARK_FONT_SIZE, -WATERMARK_FONT_SIZE),
    mupdf.Matrix.rotate(WATERMARK_ANGLE)
  )

  // Start a full page off-canvas so rotated text still covers the corners.
  for (let y = -height; y < height * 2; y += WATERMARK_STEP_Y) {
    for (let x = -width; x < width * 2; x += WATERMARK_STEP_X) {
      const text = new mupdf.Text()
      text.showString(font, mupdf.Matrix.concat(glyphMatrix, mupdf.Matrix.translate(x, y)), label)
      device.fillText(text, mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, [0, 0, 0], WATERMARK_OPACITY)
    }
  }

  device.close()
}
