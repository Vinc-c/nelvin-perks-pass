import React from "react";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      updated="2 octobre 2026"
      intro="La protection de vos données personnelles est une priorité chez Nelvin. Cette politique explique quelles données nous collectons, comment nous les utilisons et quels droits vous exercer."
    >
      <LegalSection title="1. Données que nous collectons">
        <p><strong>Données de compte :</strong> nom, e-mail, numéro de téléphone, pays, type de compte.</p>
        <p><strong>Données de transaction :</strong> historique des offres, remboursements, cashback et paiements traités via nos PSP partenaires.</p>
        <p><strong>Données d'entreprise :</strong> pour les comptes RH, informations sur l'entreprise, les employés invités et les allocations.</p>
        <p><strong>Données techniques :</strong> adresse IP, type d'appareil, cookies et données d'utilisation (voir notre Politique relative aux cookies).</p>
      </LegalSection>
      <LegalSection title="2. Comment nous utilisons vos données">
        <p>Nous traitons vos données pour : fournir et gérer votre compte, afficher et valider les offres, créditer le cashback, traiter les paiements, communiquer avec vous, prévenir la fraude et respecter nos obligations légales.</p>
      </LegalSection>
      <LegalSection title="3. Partage avec des tiers">
        <p>Nous partageons vos données uniquement lorsque cela est nécessaire : avec les marchands partenaires (pour la validation des offres), les prestataires de paiement (pour traiter les transactions), et les autorités légales lorsque la loi l'exige. Nous ne vendons jamais vos données personnelles.</p>
      </LegalSection>
      <LegalSection title="4. Conservation des données">
        <p>Nous conservons vos données aussi longtemps que votre compte est actif, ou selon les obligations légales de conservation. À la suppression de votre compte, vos données sont supprimées ou anonymisées dans un délai raisonnable.</p>
      </LegalSection>
      <LegalSection title="5. Sécurité">
        <p>Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données, notamment le chiffrement, le contrôle d'accès et la sécurité au niveau des lignes (RLS) pour isoler les données entre entreprises.</p>
      </LegalSection>
      <LegalSection title="6. Vos droits (RGPD et lois locales)">
        <p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition au traitement. Pour exercer ces droits, contactez-nous via le Centre de support. Les entreprises peuvent gérer les données de leurs employés conformément à leur politique interne.</p>
      </LegalSection>
      <LegalSection title="7. Transferts internationaux">
        <p>Vos données peuvent être traitées dans des pays autres que le vôtre. Dans ce cas, nous nous assurons qu'un niveau de protection adéquat est garanti, conformément à la loi applicable.</p>
      </LegalSection>
      <LegalSection title="8. Contact">
        <p>Pour toute question relative à vos données personnelles, ouvrez un ticket via le Centre de support de l'application.</p>
      </LegalSection>
    </LegalLayout>
  );
}