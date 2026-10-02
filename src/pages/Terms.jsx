import React from "react";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      title="Conditions d'utilisation"
      updated="2 octobre 2026"
      intro="Bienvenue sur Nelvin Benefits. En accédant à nos services, vous acceptez les présentes conditions d'utilisation. Veuillez les lire attentivement."
    >
      <LegalSection title="1. Acceptation des conditions">
        <p>En créant un compte, en vous connectant ou en utilisant la plateforme Nelvin (application web et mobile), vous acceptez d'être lié par les présentes Conditions d'utilisation ainsi que par notre Politique de confidentialité et notre Politique relative aux cookies.</p>
        <p>Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.</p>
      </LegalSection>
      <LegalSection title="2. Définitions des services">
        <p>Nelvin est une plateforme d'avantages corporatifs et de réductions B2C opérant en Afrique et au Moyen-Orient. Nos services incluent : les avantages employés, les offres membres (Particulier), la marketplace marchands, le cashback multi-PSP, et la validation de codes de remboursement (QR/alphnumérique) hors-ligne.</p>
      </LegalSection>
      <LegalSection title="3. Éligibilité des comptes">
        <p>Vous devez avoir au moins 18 ans pour créer un compte. Les types de comptes sont : Particulier, Marchand et Entreprise/RH. Les employés sont invités par leur entreprise via un code d'invitation. Vous êtes responsable de l'exactitude des informations fournies lors de l'inscription.</p>
      </LegalSection>
      <LegalSection title="4. Offres et remboursement">
        <p>Les offres sont fournies par des marchands partenaires et peuvent être modifiées ou retirées à tout moment. Le cashback est crédité selon les conditions de chaque offre et peut être soumis à des délais de traitement. Les codes de remboursement générés ont une date d'expiration et ne sont valables qu'auprès des marchands participants.</p>
        <p>Nelvin n'est pas responsable de la qualité des produits ou services fournis par les marchands.</p>
      </LegalSection>
      <LegalSection title="5. Paiements et abonnements">
        <p>Les paiements sont traités via plusieurs prestataires de paiement (PSP) selon votre région. En souscrivant un abonnement, vous autorisez Nelvin à facturer le montant indiqué selon le cycle choisi (mensuel ou annuel). Voir notre Politique de remboursement pour les conditions d'annulation.</p>
      </LegalSection>
      <LegalSection title="6. Obligations de l'utilisateur">
        <p>Vous vous engagez à ne pas : utiliser le service à des fins illégales, créer de faux comptes, abuser du système de cashback, revendre des offres, ou tenter de compromettre la sécurité de la plateforme. Tout manquement peut entraîner la suspension de votre compte.</p>
      </LegalSection>
      <LegalSection title="7. Limitation de responsabilité">
        <p>Nelvin fournit les services « tels quels ». Dans la mesure permise par la loi, Nelvin ne saurait être tenu responsable des dommages indirects, pertes de revenus ou préjudices résultant de l'utilisation de la plateforme ou de l'indisponibilité du service.</p>
      </LegalSection>
      <LegalSection title="8. Modifications des conditions">
        <p>Nous pouvons mettre à jour ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication. La poursuite de l'utilisation des services vaut acceptation des conditions modifiées.</p>
      </LegalSection>
      <LegalSection title="9. Loi applicable">
        <p>Les présentes conditions sont régies par les lois applicables dans votre juridiction de résidence. Tout litige sera porté devant les tribunaux compétents.</p>
      </LegalSection>
    </LegalLayout>
  );
}