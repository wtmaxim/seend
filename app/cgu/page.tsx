import type { Metadata } from "next"

import { LegalLayout, LegalSection } from "@/components/legal/legal-layout"
import { LAST_UPDATED, LEGAL_ENTITY } from "@/lib/legal-info"

export const metadata: Metadata = { title: "CGU · Seend" }

export default function CguPage() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (« CGU ») régissent l&apos;accès et l&apos;usage du
          service Seend, une plateforme de partage sécurisé de documents (envoi de documents individuels, datarooms,
          liens de partage avec suivi de consultation), édité par {LEGAL_ENTITY.companyName}.
        </p>
        <p>
          Toute création de compte implique l&apos;acceptation pleine et entière des présentes CGU. Si vous
          n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.
        </p>
      </LegalSection>

      <LegalSection title="2. Création de compte et organisations">
        <p>
          L&apos;accès au service nécessite la création d&apos;un compte utilisateur associé à une organisation.
          Vous vous engagez à fournir des informations exactes lors de l&apos;inscription et à maintenir la
          confidentialité de vos identifiants de connexion. Vous êtes responsable de toute activité effectuée depuis
          votre compte.
        </p>
        <p>
          Le premier membre d&apos;une organisation en devient le propriétaire (« owner »). Le propriétaire peut
          inviter d&apos;autres membres, leur attribuer un rôle (administrateur, membre) et gérer l&apos;abonnement
          de l&apos;organisation. Le nombre de membres pouvant rejoindre une organisation dépend du plan souscrit
          (voir les{" "}
          <a href="/cgv" className="underline underline-offset-4 hover:text-foreground">
            CGV
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection title="3. Description du service">
        <p>Selon le plan souscrit, le service permet notamment :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>le dépôt et l&apos;organisation de documents ;</li>
          <li>la création de datarooms regroupant plusieurs documents ;</li>
          <li>la génération de liens de partage, avec ou sans exigence d&apos;identification du visiteur, et avec un filigrane optionnel apposé sur les documents consultés ;</li>
          <li>le suivi des consultations (visites, pages vues, durée) sur les liens de partage ;</li>
          <li>la gestion d&apos;une équipe au sein d&apos;une organisation.</li>
        </ul>
        <p>
          {LEGAL_ENTITY.companyName}{" "}
          se réserve le droit de faire évoluer, ajouter ou retirer des fonctionnalités du service à tout moment,
          notamment pour des raisons techniques ou de sécurité.
        </p>
      </LegalSection>

      <LegalSection title="4. Obligations de l'utilisateur">
        <p>Vous vous engagez à :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ne déposer et ne partager que des contenus dont vous détenez les droits ou l&apos;autorisation de diffusion ;</li>
          <li>ne pas utiliser le service pour diffuser des contenus illicites, diffamatoires, ou portant atteinte aux droits de tiers ;</li>
          <li>ne pas tenter de contourner les mesures de sécurité du service (limitation de débit, contrôle d&apos;accès aux liens de partage, filigrane) ;</li>
          <li>ne pas utiliser le service à des fins d&apos;extraction automatisée massive ou de perturbation de son fonctionnement.</li>
        </ul>
        <p>
          Tout manquement à ces obligations peut entraîner la suspension ou la suppression du compte concerné, sans
          préjudice d&apos;éventuelles poursuites.
        </p>
      </LegalSection>

      <LegalSection title="5. Propriété des contenus">
        <p>
          Les documents et contenus déposés sur la plateforme restent la propriété exclusive de l&apos;utilisateur
          ou de son organisation. {LEGAL_ENTITY.companyName}
          {" "}n&apos;acquiert aucun droit de propriété sur ces contenus et ne les utilise que dans la mesure
          strictement nécessaire à la fourniture du service (stockage, affichage, application du filigrane, etc.).
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilité et responsabilité">
        <p>
          {LEGAL_ENTITY.companyName}
          {" "}met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service, sans
          garantir une disponibilité continue et sans interruption. Le service est fourni « en l&apos;état », et{" "}
          {LEGAL_ENTITY.companyName}
          {" "}ne saurait être tenue responsable des dommages indirects résultant de son utilisation (perte
          d&apos;exploitation, perte de données consécutive à une mauvaise utilisation, etc.).
        </p>
        <p>
          Il appartient à l&apos;utilisateur de conserver une copie de ses documents en dehors de la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="7. Suspension et résiliation">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre compte. La suppression
          d&apos;un compte entraîne la perte d&apos;accès aux organisations dont vous étiez membre ; si vous en
          étiez l&apos;unique membre, l&apos;organisation et ses documents subsistent mais restent sans propriétaire.
        </p>
        <p>
          {LEGAL_ENTITY.companyName}
          {" "}se réserve le droit de suspendre ou de résilier l&apos;accès d&apos;un compte en cas de manquement
          grave aux présentes CGU, après notification lorsque cela est possible.
        </p>
      </LegalSection>

      <LegalSection title="8. Modification des CGU">
        <p>
          {LEGAL_ENTITY.companyName}
          {" "}peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute
          modification substantielle. La poursuite de l&apos;utilisation du service après notification vaut
          acceptation des nouvelles CGU.
        </p>
      </LegalSection>

      <LegalSection title="9. Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou leur
          exécution relève de la compétence des tribunaux français, sauf disposition légale impérative contraire.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>Pour toute question relative aux présentes CGU : {LEGAL_ENTITY.contactEmail}</p>
      </LegalSection>
    </LegalLayout>
  )
}
