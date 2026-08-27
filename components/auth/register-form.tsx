"use client"

import * as React from "react"
import { AlertCircle, ArrowRight, Building2, LoaderCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"

import { PasswordInput } from "@/components/auth/password-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient, signUp } from "@/lib/auth-client"
import { isValidOrganizationSlug, toOrganizationSlug } from "@/lib/organization-slug"

type RegisterStage = "account" | "organization"

type RegisterFormProps = {
  initialStage: RegisterStage
}

export function RegisterForm({ initialStage }: RegisterFormProps) {
  const t = useTranslations("auth")
  const router = useRouter()
  const [stage, setStage] = React.useState<RegisterStage>(initialStage)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [organizationName, setOrganizationName] = React.useState("")
  const [organizationSlug, setOrganizationSlug] = React.useState("")
  const [slugWasEdited, setSlugWasEdited] = React.useState(false)

  function updateOrganizationName(value: string) {
    setOrganizationName(value)
    if (!slugWasEdited) {
      setOrganizationSlug(toOrganizationSlug(value))
    }
  }

  async function createOrganization() {
    const name = organizationName.trim()
    const slug = organizationSlug.trim()

    if (!name) {
      setError(t("register.organizationNameRequired"))
      return false
    }

    if (!isValidOrganizationSlug(slug)) {
      setError(
        t("register.invalidSlug")
      )
      return false
    }

    try {
      const result = await authClient.organization.create({ name, slug })

      if (result.error) {
        setError(
          result.error.message ||
            t("register.organizationCreatedFailedShort")
        )
        setStage("organization")
        return false
      }

      return true
    } catch {
      setError(
        t("register.organizationFailed")
      )
      setStage("organization")
      return false
    }
  }

  async function handleAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? ""
    )

    if (password !== passwordConfirmation) {
      setError(t("reset.mismatch"))
      return
    }

    if (password.length < 8 || password.length > 128) {
      setError(t("reset.length"))
      return
    }

    if (!organizationName.trim() || !isValidOrganizationSlug(organizationSlug.trim())) {
      setError(t("register.invalidOrganization"))
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signUp.email({ name, email, password })

      if (result.error) {
        setError(result.error.message || t("register.failed"))
        return
      }

      setStage("organization")
      const organizationCreated = await createOrganization()

      if (organizationCreated) {
        router.replace("/")
        router.refresh()
      }
    } catch {
      setError(t("serviceUnreachable"))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOrganizationSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const organizationCreated = await createOrganization()

    if (organizationCreated) {
      router.replace("/")
      router.refresh()
    }

    setIsSubmitting(false)
  }

  if (stage === "organization") {
    return (
      <form className="space-y-4" onSubmit={handleOrganizationSubmit}>
        <Alert>
          <Building2 />
          <AlertTitle>{t("register.accountCreated")}</AlertTitle>
          <AlertDescription>
            {t("register.finishOrganization")}
          </AlertDescription>
        </Alert>

        {error ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <OrganizationFields
          disabled={isSubmitting}
          name={organizationName}
          slug={organizationSlug}
          onNameChange={updateOrganizationName}
          onSlugChange={(value) => {
            setSlugWasEdited(true)
            setOrganizationSlug(toOrganizationSlug(value))
          }}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              {t("register.creatingOrganization")}
            </>
          ) : (
            <>
              {t("register.createOrganization")}
              <ArrowRight data-icon="inline-end" />
            </>
          )}
        </Button>
      </form>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleAccountSubmit}>
      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">{t("register.fullName")}</Label>
          <Input
            id="name"
            name="name"
            placeholder={t("register.namePlaceholder")}
            autoComplete="name"
            autoFocus
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder={t("register.passwordPlaceholder")}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirmation">{t("register.confirmPassword")}</Label>
          <PasswordInput
            id="passwordConfirmation"
            name="passwordConfirmation"
            placeholder={t("register.confirmPlaceholder")}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 font-heading text-xs font-medium">
          {t("register.yourOrganization")}
        </p>
        <OrganizationFields
          disabled={isSubmitting}
          name={organizationName}
          slug={organizationSlug}
          onNameChange={updateOrganizationName}
          onSlugChange={(value) => {
            setSlugWasEdited(true)
            setOrganizationSlug(toOrganizationSlug(value))
          }}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" />
            {t("register.submitting")}
          </>
        ) : (
          <>
            {t("register.submit")}
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        {t("register.termsPrefix")}{" "}
        <Link href="/cgu" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
          {t("register.terms")}
        </Link>{" "}
        {t("register.termsMiddle")}{" "}
        <Link href="/confidentialite" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
          {t("register.privacy")}
        </Link>
        .
      </p>
    </form>
  )
}

type OrganizationFieldsProps = {
  disabled: boolean
  name: string
  onNameChange: (value: string) => void
  onSlugChange: (value: string) => void
  slug: string
}

function OrganizationFields({
  disabled,
  name,
  onNameChange,
  onSlugChange,
  slug,
}: OrganizationFieldsProps) {
  const t = useTranslations("auth")

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="organizationName">{t("register.organizationName")}</Label>
        <Input
          id="organizationName"
          name="organizationName"
          placeholder={t("register.organizationPlaceholder")}
          autoComplete="organization"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organizationSlug">{t("register.organizationSlug")}</Label>
        <Input
          id="organizationSlug"
          name="organizationSlug"
          placeholder={t("register.slugPlaceholder")}
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          title={t("register.slugHint")}
          required
          disabled={disabled}
        />
      </div>
    </div>
  )
}
