import React from "react";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";

export default function CookiePolicy() {
  return (
    <LegalLayout
      title="Politique relative aux cookies"
      updated="2 octobre 2026"
      intro="Cette politique décrit comment Nelvin utilise les cookies et technologies similaires pour améliorer votre expérience sur la plateforme."
    >
      <LegalSection title="1. Qu'est-ce qu'un cookie ?">
        <p>Un cookie est un petit fichier stocké sur votre appareil lors de votre visite sur un site web. Il permet de mémoriser vos préférences et de mesurer l'utilisation du service.</p>
      </LegalSection>
      <LegalSection title="2. Types de cookies que nous utilisons">
        <p><strong>Cookies essentiels :</strong> nécessaires au fonctionnement de la plateforme (authentification, sécurité).</p>
        <p><strong>Cookies de préférences :</strong> mémorisent votre langue et vos réglages d'affichage.</p>
        <p><strong>Cookies analytiques :</strong> nous aident à comprendre comment vous utilisez l'application afin de l'améliorer.</p>
        <p><strong>Cookies marketing :</strong> utilisés, avec votre consentement, pour personnaliser les offres affichées.</p>
      </LegalSection>
      <LegalSection title="3. Gestion de votre consentement">
        <p>À votre première visite, vous pouvez accepter ou refuser les cookies non essentiels. Vous pouvez modifier votre choix à tout moment dans les Paramètres de l'application.</p>
      </LegalSection>
      <LegalSection title="4. Cookies tiers">
        <p>Certains cookies sont déposés par des tiers (ex. prestataires de paiement, outils d'analyse). Ces tiers utilisent les cookies conformément à leurs propres politiques.</p>
      </LegalSection>
      <LegalSection title="5. Durée de conservation">
        <p>Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants sont conservés selon la durée définie ou jusqu'à leur suppression par vos soins.</p>
      </LegalSection>
    </LegalLayout>
  );
}