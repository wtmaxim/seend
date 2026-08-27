"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { Heartbeat } from "@/components/view/heartbeat"

export function DocumentViewer({
  token,
  documentId,
  pageCount,
  documentName,
}: {
  token: string
  documentId: string
  pageCount: number
  documentName: string
}) {
  const t = useTranslations("view")
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)

  const pageElements = useRef<Map<number, HTMLDivElement>>(new Map())
  const visibleRatios = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    // The page attributed the visitor's time is whichever one is most
    // visible on screen, not necessarily page 1 — long documents get
    // scrolled, and the heartbeat needs to follow where attention actually
    // is.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.page)
          visibleRatios.current.set(pageNumber, entry.intersectionRatio)
        }
        let bestPage: number | null = null
        let bestRatio = 0
        for (const [pageNumber, ratio] of visibleRatios.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestPage = pageNumber
          }
        }
        if (bestPage !== null) setCurrentPage(bestPage)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    for (const element of pageElements.current.values()) observer.observe(element)
    return () => observer.disconnect()
  }, [pageCount])

  return (
    <div
      className="space-y-4 select-none"
      onContextMenu={(event) => event.preventDefault()}
    >
      <Heartbeat token={token} documentId={documentId} pageNumber={currentPage} />
      {pages.map((pageNumber) => (
        <div
          key={pageNumber}
          data-page={pageNumber}
          ref={(element) => {
            if (element) pageElements.current.set(pageNumber, element)
            else pageElements.current.delete(pageNumber)
          }}
          className="overflow-hidden rounded-2xl border border-border bg-muted/30"
        >
          {failed[pageNumber] ? (
            <p className="p-10 text-center text-xs text-muted-foreground">
              {t("pageFailed")}
            </p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/view/${token}/documents/${documentId}/page/${pageNumber}`}
              alt={t("pageAlt", { name: documentName, page: pageNumber, total: pageCount })}
              // The first page is the one the visitor is waiting on; the
              // rest load as they scroll toward them, so a long document
              // doesn't trigger dozens of renders at once.
              loading={pageNumber === 1 ? "eager" : "lazy"}
              draggable={false}
              onError={() => setFailed((current) => ({ ...current, [pageNumber]: true }))}
              className="w-full"
            />
          )}
        </div>
      ))}
    </div>
  )
}
