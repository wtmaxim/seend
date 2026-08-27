import type { Metadata } from "next"

import { Link } from "@/i18n/navigation"

import { LegalLayout, LegalSection } from "@/components/legal/legal-layout"
import { LAST_UPDATED, LEGAL_ENTITY, SUBPROCESSORS } from "@/lib/legal-info"

export const metadata: Metadata = { title: "Mentions légales · Seend" }

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" lastUpdated={LAST_UPDATED}>
      <LegalSection title="Éditeur du site">
        <p>
          Le service Seend est édité par {LEGAL_ENTITY.companyName}, {LEGAL_ENTITY.legalForm} au capital de{" "}
          {LEGAL_ENTITY.shareCapital}, immatriculée au RCS de {LEGAL_ENTITY.rcs} sous le numéro SIRET{" "}
          {LEGAL_ENTITY.siret}, dont le siège social est situé {LEGAL_ENTITY.address}.
        </p>
        <p>Responsable de la publication : {LEGAL_ENTITY.publicationDirector}.</p>
        <p>Contact : {LEGAL_ENTITY.contactEmail}</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          L&apos;application et les fichiers déposés par les utilisateurs sont hébergés par Vercel Inc.
          (États-Unis). La base de données est hébergée par Neon Inc. Le détail des sous-traitants techniques
          utilisés pour fournir le service, ainsi que leurs coordonnées complètes, figurent dans la{" "}
          <Link href="/confidentialite" className="underline underline-offset-4 hover:text-foreground">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          La structure générale du site Seend, ainsi que les textes, marques, logos et éléments graphiques qui le
          composent, sont la propriété de {LEGAL_ENTITY.companyName}, sauf mention contraire. Toute reproduction,
          représentation ou diffusion, totale ou partielle, sans autorisation préalable est interdite.
        </p>
        <p>
          Les documents déposés par les utilisateurs sur la plateforme restent leur entière propriété. Seend
          n&apos;en revendique aucun droit, hormis ceux strictement nécessaires à la fourniture du service (voir les{" "}
          <Link href="/cgu" className="underline underline-offset-4 hover:text-foreground">
            CGU
          </Link>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement des données personnelles réalisé dans le cadre du service est décrit dans la{" "}
          <Link href="/confidentialite" className="underline underline-offset-4 hover:text-foreground">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Sous-traitants techniques">
        <ul className="list-disc space-y-1 pl-5">
          {SUBPROCESSORS.map((sub) => (
            <li key={sub.name}>
              <span className="text-foreground">{sub.name}</span> — {sub.purpose} ({sub.location})
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Crédits">
        <p>Conception et développement : {LEGAL_ENTITY.companyName}.</p>
      </LegalSection>
    </LegalLayout>
  )
}
