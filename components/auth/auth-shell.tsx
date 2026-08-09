import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthShellProps = {
  children: React.ReactNode
  description: string
  footerHref: string
  footerLabel: string
  footerText: string
  title: string
}

export function AuthShell({
  children,
  description,
  footerHref,
  footerLabel,
  footerText,
  title,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)] bg-[size:32px_32px] opacity-35"
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase"
        >
          <span className="flex size-6 items-center justify-center border border-foreground bg-foreground font-heading text-[10px] text-background">
            S
          </span>
          Seend
        </Link>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <div className="border-t px-4 pt-3 text-center text-xs text-muted-foreground">
            {footerText}{" "}
            <Link
              href={footerHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {footerLabel}
            </Link>
          </div>
        </Card>

        <p className="mt-4 text-center font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          Secure access · Press D to toggle theme
        </p>
      </div>
    </main>
  )
}
