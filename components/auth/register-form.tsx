"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Building2, LoaderCircle } from "lucide-react"

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
      setError("Enter an organization name.")
      return false
    }

    if (!isValidOrganizationSlug(slug)) {
      setError(
        "Use lowercase letters, numbers, and single hyphens for the slug."
      )
      return false
    }

    try {
      const result = await authClient.organization.create({ name, slug })

      if (result.error) {
        setError(
          result.error.message ||
            "Your account is ready, but the organization could not be created."
        )
        setStage("organization")
        return false
      }

      return true
    } catch {
      setError(
        "Your account is ready, but the organization could not be created. Try again."
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
      setError("Passwords do not match.")
      return
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.")
      return
    }

    if (!organizationName.trim() || !isValidOrganizationSlug(organizationSlug.trim())) {
      setError("Enter a valid organization name and slug.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signUp.email({ name, email, password })

      if (result.error) {
        setError(result.error.message || "Unable to create your account.")
        return
      }

      setStage("organization")
      const organizationCreated = await createOrganization()

      if (organizationCreated) {
        router.replace("/")
        router.refresh()
      }
    } catch {
      setError("Unable to reach the authentication service. Try again.")
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
          <AlertTitle>Account created</AlertTitle>
          <AlertDescription>
            Finish setting up your organization to continue.
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
              Creating organization
            </>
          ) : (
            <>
              Create organization
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
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Jane Smith"
            autoComplete="name"
            autoFocus
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="8–128 characters"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirmation">Confirm password</Label>
          <PasswordInput
            id="passwordConfirmation"
            name="passwordConfirmation"
            placeholder="Repeat password"
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
          Your organization
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
            Creating account
          </>
        ) : (
          <>
            Create account
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        By creating an account, you agree to our{" "}
        <a href="/cgu" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
          CGU
        </a>{" "}
        and{" "}
        <a href="/confidentialite" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
          privacy policy
        </a>
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
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input
          id="organizationName"
          name="organizationName"
          placeholder="Acme Inc."
          autoComplete="organization"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organizationSlug">Organization slug</Label>
        <Input
          id="organizationSlug"
          name="organizationSlug"
          placeholder="acme-inc"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          title="Use lowercase letters, numbers, and single hyphens."
          required
          disabled={disabled}
        />
      </div>
    </div>
  )
}
