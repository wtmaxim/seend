"use client"

import { useEffect, useRef } from "react"

export function Heartbeat({
  token,
  documentId,
  pageNumber,
}: {
  token: string
  documentId?: string | null
  pageNumber?: number | null
}) {
  // A ref so the ping functions (registered once, see the effect below)
  // always read the latest page instead of closing over a stale one — the
  // interval isn't torn down and rebuilt every time the visible page
  // changes, which would reset the visibility/pagehide listeners for no
  // reason and could double up on rapid page scrolling. documentId doesn't
  // change during this component's life (a different document remounts the
  // whole tree), so it's fine to close over directly below.
  const pageNumberRef = useRef<number | null>(pageNumber ?? null)
  useEffect(() => {
    pageNumberRef.current = pageNumber ?? null
  }, [pageNumber])

  useEffect(() => {
    const url = `/api/view/${token}/heartbeat`
    const beacon = () => {
      const payload = JSON.stringify({ documentId, pageNumber: pageNumberRef.current })
      const blob = new Blob([payload], { type: "application/json" })
      if (!navigator.sendBeacon?.(url, blob)) {
        void fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        })
      }
    }
    const pingIfVisible = () => {
      if (document.visibilityState === "visible") beacon()
    }

    pingIfVisible()
    const interval = setInterval(pingIfVisible, 10_000)

    // Fires on every visibility flip, not just "became visible": if the tab
    // is backgrounded and never comes back (app killed from the multitasking
    // view, no pagehide), this is the only chance to record an accurate
    // lastSeenAt instead of leaving it stale by up to 10s.
    document.addEventListener("visibilitychange", beacon)
    window.addEventListener("pagehide", beacon)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", beacon)
      window.removeEventListener("pagehide", beacon)
    }
  }, [token, documentId])

  return null
}
