import { useTranslations } from "next-intl"

export function TooManyRequests() {
  const t = useTranslations("view")

  return (
    <main className="flex min-h-svh items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-foreground">{t("tooManyTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("tooManyDescription")}</p>
      </div>
    </main>
  )
}
