import type { Metadata } from "next"

import { LegalLayout, LegalSection } from "@/components/legal/legal-layout"
import { LAST_UPDATED, LEGAL_ENTITY, SUBPROCESSORS } from "@/lib/legal-info"

export const metadata: Metadata = { title: "Politique de confidentialité · Seend" }

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Responsable de traitement">
        <p>
          {LEGAL_ENTITY.companyName}, {LEGAL_ENTITY.address}, est responsable du traitement des données
          personnelles décrit dans la présente politique. Pour toute question ou pour exercer vos droits :{" "}
          {LEGAL_ENTITY.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>Nous collectons les données suivantes :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><span className="text-foreground">Compte</span> — nom, adresse email, mot de passe (stocké sous forme hachée, jamais en clair).</li>
          <li><span className="text-foreground">Organisation</span> — nom de l&apos;organisation et rôle de chaque membre.</li>
          <li><span className="text-foreground">Documents</span> — fichiers déposés par les utilisateurs et leurs métadonnées (nom, taille, type, date).</li>
          <li>
            <span className="text-foreground">Visites de liens de partage</span>{" "}
            — lorsqu&apos;un lien de partage exige une identification, le nom et/ou l&apos;email renseignés par le
            visiteur, ainsi que l&apos;adresse IP, les pages consultées et la durée de consultation, à des fins de
            suivi d&apos;audience du document partagé.
          </li>
          <li><span className="text-foreground">Facturation</span> — pour les organisations abonnées à un plan payant, les données de facturation (nom, email) transmises à Stripe ; les coordonnées bancaires ne transitent jamais par nos serveurs.</li>
          <li><span className="text-foreground">Techniques</span> — adresse IP et horodatage des requêtes, utilisés à des fins de sécurité (limitation de débit contre les abus, journaux d&apos;erreur).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités et bases légales">
        <ul className="list-disc space-y-1 pl-5">
          <li>Fourniture du service (création de compte, stockage et partage de documents) — exécution du contrat.</li>
          <li>Facturation des abonnements — exécution du contrat.</li>
          <li>Sécurité du service (limitation de débit, détection d&apos;abus) — intérêt légitime.</li>
          <li>Suivi des consultations de liens de partage, pour le compte de l&apos;organisation qui partage le document — exécution du contrat / intérêt légitime de l&apos;organisation émettrice.</li>
          <li>Envoi d&apos;emails transactionnels (invitations, réinitialisation de mot de passe) — exécution du contrat.</li>
        </ul>
        <p>Nous n&apos;utilisons vos données à aucune fin de prospection commerciale sans consentement préalable.</p>
      </LegalSection>

      <LegalSection title="4. Destinataires des données">
        <p>
          Les données sont hébergées et traitées par les sous-traitants suivants, dans le cadre strict de la
          fourniture du service :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {SUBPROCESSORS.map((sub) => (
            <li key={sub.name}>
              <span className="text-foreground">{sub.name}</span> — {sub.purpose} ({sub.location})
            </li>
          ))}
        </ul>
        <p>
          Certains de ces sous-traitants sont situés hors de l&apos;Union européenne (États-Unis). Les transferts de
          données correspondants sont encadrés par les clauses contractuelles types de la Commission européenne ou
          un mécanisme équivalent proposé par chaque prestataire.
        </p>
      </LegalSection>

      <LegalSection title="5. Durée de conservation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Données de compte et documents : conservés tant que le compte ou l&apos;organisation est actif, puis supprimés dans un délai raisonnable après suppression du compte ou de l&apos;organisation.</li>
          <li>Données de visite des liens de partage : conservées pendant la durée d&apos;activité du lien, puis archivées à des fins statistiques pour l&apos;organisation émettrice.</li>
          <li>Données de facturation : conservées pendant la durée légale de conservation des documents comptables (10 ans).</li>
          <li>Journaux techniques et compteurs de limitation de débit : conservés quelques jours à quelques semaines, à des fins de sécurité uniquement.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Vos droits">
        <p>
          Conformément au Règlement général sur la protection des données (RGPD), vous disposez d&apos;un droit
          d&apos;accès, de rectification, d&apos;effacement, de portabilité et d&apos;opposition sur vos données
          personnelles, ainsi que du droit d&apos;introduire une réclamation auprès de la CNIL (www.cnil.fr).
        </p>
        <p>
          Vous pouvez modifier votre mot de passe ou supprimer votre compte directement depuis les paramètres de
          votre compte. Pour toute autre demande relative à vos données, contactez-nous à {LEGAL_ENTITY.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies">
        <p>
          Seend utilise uniquement un cookie de session strictement nécessaire à l&apos;authentification. Aucun
          cookie de mesure d&apos;audience ou publicitaire tiers n&apos;est déposé.
        </p>
      </LegalSection>

      <LegalSection title="8. Sécurité">
        <p>
          Les mots de passe sont stockés sous forme hachée. Les échanges avec l&apos;application sont chiffrés
          (HTTPS). L&apos;accès aux documents partagés via un lien peut être restreint par une exigence
          d&apos;identification du visiteur, et fait l&apos;objet d&apos;une limitation de débit pour prévenir les
          tentatives d&apos;accès automatisées.
        </p>
      </LegalSection>

      <LegalSection title="9. Modification de la politique">
        <p>
          Cette politique peut être mise à jour pour refléter des évolutions du service ou de la réglementation. La
          date de dernière mise à jour figure en haut de cette page.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
