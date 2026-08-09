import { Resend } from "resend"

// resend.dev works with no domain setup, so email sending has a default
// that works immediately in a fresh checkout; production deployments should
// override this with a verified sending domain.
const DEFAULT_FROM = "Seend <onboarding@resend.dev>"

// The Resend constructor throws synchronously when the API key is missing.
// Constructing it lazily, inside sendEmail, keeps a missing key a
// send-time failure instead of crashing every module that imports this file
// (lib/auth.ts is one) as soon as the app boots without one configured.
function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set")
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { error } = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to,
    subject,
    html,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
}

export async function sendResetPasswordEmail({ to, name, url }: { to: string; name: string; url: string }) {
  await sendEmail({
    to,
    subject: "Réinitialise ton mot de passe Seend",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <p>Bonjour ${escapeHtml(name)},</p>
        <p>Tu as demandé à réinitialiser ton mot de passe Seend. Ce lien expire dans une heure.</p>
        <p>
          <a href="${url}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
      </div>
    `,
  })
}

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterEmail,
  url,
}: {
  to: string
  organizationName: string
  inviterEmail: string
  url: string
}) {
  await sendEmail({
    to,
    subject: `${inviterEmail} t'invite à rejoindre ${organizationName} sur Seend`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <p>Bonjour,</p>
        <p>${escapeHtml(inviterEmail)} t'invite à rejoindre <strong>${escapeHtml(organizationName)}</strong> sur Seend.</p>
        <p>
          <a href="${url}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">
            Voir l'invitation
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">Si tu ne t'attendais pas à cette invitation, ignore cet email.</p>
      </div>
    `,
  })
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      default: return "&#39;"
    }
  })
}
