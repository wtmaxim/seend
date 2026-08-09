// Central place to fill in the operating company's real details. Every
// legal page pulls from here, so updating a placeholder only has to happen
// once. Review with a lawyer before removing the [À COMPLÉTER] markers.
export const LEGAL_ENTITY = {
  companyName: "CRAFTBASE",
  legalForm: "SASU (société par actions simplifiée unipersonnelle)",
  siret: "994 760 445 00019",
  rcs: "Nantes",
  shareCapital: "100 €",
  address: "3 rue de la Poste, 44140 Montbert",
  publicationDirector: "Maxime Déramé",
  contactEmail: "contact@craftbase.fr",
  domain: "seend.co",
}

export const SUBPROCESSORS = [
  {
    name: "Vercel Inc.",
    purpose: "Hébergement de l'application et stockage des fichiers (Vercel Blob)",
    location: "États-Unis",
  },
  {
    name: "Neon Inc.",
    purpose: "Base de données (PostgreSQL)",
    location: "Union européenne / États-Unis selon la région choisie",
  },
  {
    name: "Resend",
    purpose: "Envoi des emails transactionnels (invitations, réinitialisation de mot de passe)",
    location: "États-Unis",
  },
  {
    name: "Stripe Payments Europe, Ltd.",
    purpose: "Traitement des paiements et de la facturation des abonnements",
    location: "Irlande / États-Unis",
  },
]

export const LAST_UPDATED = "6 août 2026"
