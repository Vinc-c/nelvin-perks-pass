import React from "react";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Politique de remboursement et d'annulation"
      updated="2 octobre 2026"
      intro="Cette politique précise les conditions d'annulation des abonnements Nelvin et les modalités de remboursement."
    >
      <LegalSection title="1. Abonnements Particulier et Employé">
        <p>Les abonnements (Pass Basic, Premium, VIP) sont facturés par avance selon le cycle choisi. Vous pouvez annuler à tout moment depuis les Paramètres de facturation. L'annulation prend effet à la fin de la période en cours ; aucun remboursement rétroactif n'est dû pour la période entamée.</p>
      </LegalSection>
      <LegalSection title="2. Abonnements Entreprise (RH)">
        <p>Les entreprises sont facturées selon le nombre de sièges actifs. L'annulation est possible avec un préavis indiqué dans votre contrat. Les frais déjà facturés pour la période en cours ne sont pas remboursés.</p>
      </LegalSection>
      <LegalSection title="3. Période d'essai">
        <p>Si une période d'essai est proposée, aucune somme n'est prélevée durant l'essai. À la fin de l'essai, l'abonnement est facturé automatiquement sauf annulation préalable.</p>
      </LegalSection>
      <LegalSection title="4. Cashback et offres marchands">
        <p>Le cashback crédité ne constitue pas un paiement remboursable. Les remboursements liés à un produit ou service acheté auprès d'un marchand relèvent de la politique du marchand concerné.</p>
      </LegalSection>
      <LegalSection title="5. Demandes de remboursement exceptionnelles">
        <p>Toute demande exceptionnelle doit être soumise via le Centre de support dans un délai de 14 jours après la transaction. Nous examinerons chaque demande au cas par cas.</p>
      </LegalSection>
      <LegalSection title="6. Méthodes de remboursement">
        <p>Lorsqu'un remboursement est accordé, il est effectué via le même moyen de paiement que celui utilisé pour la transaction initiale, dans un délai de 5 à 10 jours ouvrés.</p>
      </LegalSection>
    </LegalLayout>
  );
}