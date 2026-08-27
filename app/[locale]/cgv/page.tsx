import type { Metadata } from "next"

import { Link } from "@/i18n/navigation"

import { LegalLayout, LegalSection } from "@/components/legal/legal-layout"
import { LAST_UPDATED, LEGAL_ENTITY } from "@/lib/legal-info"

export const metadata: Metadata = { title: "CGV · Seend" }

export default function CgvPage() {
  return (
    <LegalLayout title="Conditions générales de vente" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales de vente (« CGV ») s&apos;appliquent à la souscription des offres
          payantes du service Seend, édité par {LEGAL_ENTITY.companyName}, par toute organisation cliente («
          Client »). Elles complètent les{" "}
          <Link href="/cgu" className="underline underline-offset-4 hover:text-foreground">
            CGU
          </Link>{" "}
          et priment sur celles-ci en cas de contradiction sur les aspects tarifaires et de facturation.
        </p>
      </LegalSection>

      <LegalSection title="2. Offres et tarifs">
        <p>Seend propose, à la date des présentes, les plans suivants par organisation :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><span className="text-foreground">Free</span> — gratuit, fonctionnalités limitées (1 membre, 50 documents, aucune dataroom).</li>
          <li><span className="text-foreground">Pro</span> — 29 € HT/mois, ou 24 € HT/mois facturé annuellement.</li>
          <li><span className="text-foreground">Business</span> — 79 € HT/mois, ou 59 € HT/mois facturé annuellement.</li>
        </ul>
        <p>
          Les tarifs en vigueur sont ceux affichés dans l&apos;application au moment de la souscription. {LEGAL_ENTITY.companyName}{" "}
          se réserve le droit de faire évoluer ses tarifs ; toute modification sera communiquée au Client avant son
          entrée en vigueur et ne s&apos;appliquera qu&apos;au renouvellement suivant de son abonnement.
        </p>
      </LegalSection>

      <LegalSection title="3. Essai gratuit">
        <p>
          La première souscription d&apos;une organisation à un plan payant ouvre droit à une période d&apos;essai
          gratuite de 14 jours. Un moyen de paiement est requis dès la souscription. Sauf résiliation avant la fin de
          la période d&apos;essai, l&apos;abonnement se poursuit automatiquement au tarif du plan choisi et le
          premier prélèvement intervient à l&apos;issue de l&apos;essai.
        </p>
      </LegalSection>

      <LegalSection title="4. Paiement et facturation">
        <p>
          Le paiement est géré par notre prestataire Stripe et s&apos;effectue par prélèvement automatique récurrent
          sur le moyen de paiement enregistré par le Client, selon la périodicité choisie (mensuelle ou annuelle).{" "}
          {LEGAL_ENTITY.companyName}
          {" "}n&apos;a pas accès aux coordonnées bancaires complètes du Client, exclusivement détenues par Stripe.
        </p>
        <p>
          En cas d&apos;échec de prélèvement,{" "}
          {LEGAL_ENTITY.companyName}
          {" "}peut suspendre l&apos;accès aux fonctionnalités payantes de l&apos;organisation concernée
          jusqu&apos;à régularisation.
        </p>
      </LegalSection>

      <LegalSection title="5. Durée et résiliation">
        <p>
          L&apos;abonnement est souscrit pour la périodicité choisie (mensuelle ou annuelle) et se renouvelle
          automatiquement par tacite reconduction pour une durée identique, sauf résiliation par le Client avant la
          fin de la période en cours.
        </p>
        <p>
          Le Client peut résilier son abonnement à tout moment depuis l&apos;espace de facturation de son
          organisation (paramètres → facturation → gérer la facturation). La résiliation prend effet à la fin de la
          période de facturation en cours ; aucun remboursement au prorata n&apos;est effectué pour la période
          entamée, sauf disposition légale contraire.
        </p>
        <p>
          À l&apos;issue de la résiliation, l&apos;organisation repasse automatiquement au plan Free et les
          fonctionnalités excédant les limites de ce plan (membres, documents, datarooms) deviennent inaccessibles
          sans que les données correspondantes soient supprimées.
        </p>
      </LegalSection>

      <LegalSection title="6. Droit de rétractation">
        <p>
          Conformément à l&apos;article L. 221-28 du Code de la consommation, le droit de rétractation ne
          s&apos;applique pas aux contrats conclus entre professionnels dans le cadre de leur activité. Les présentes
          CGV s&apos;adressent à des organisations agissant à des fins professionnelles.
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          La responsabilité de {LEGAL_ENTITY.companyName}
          {" "}au titre des présentes CGV est limitée aux sommes effectivement versées par le Client au titre des
          douze derniers mois d&apos;abonnement, sauf faute lourde ou dolosive.
        </p>
      </LegalSection>

      <LegalSection title="8. Droit applicable">
        <p>
          Les présentes CGV sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents
          du ressort du siège social de {LEGAL_ENTITY.companyName}, sauf disposition légale impérative contraire.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Pour toute question relative à la facturation : {LEGAL_ENTITY.contactEmail}</p>
      </LegalSection>
    </LegalLayout>
  )
}
