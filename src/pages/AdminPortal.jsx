import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { homeFor, isStaff, staffSections } from "@/lib/roles";
import PortalLayout from "@/components/PortalLayout";
import { useI18n } from "@/i18n/I18nContext";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminCmsLogos from "@/components/admin/AdminCmsLogos";
import AdminCmsImages from "@/components/admin/AdminCmsImages";
import AdminCmsCopy from "@/components/admin/AdminCmsCopy";
import AdminCmsCategories from "@/components/admin/AdminCmsCategories";
import AdminCompanyManagement from "@/components/admin/AdminCompanyManagement";
import AdminMerchantVetting from "@/components/admin/AdminMerchantVetting";
import AdminMarketing from "@/components/admin/AdminMarketing";
import AdminBranding from "@/components/admin/AdminBranding";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminPromotions from "@/components/admin/AdminPromotions";
import AdminOffers from "@/components/admin/AdminOffers";
import AdminSalesCodes from "@/components/admin/AdminSalesCodes";
import AdminLegalPages from "@/components/admin/AdminLegalPages";
import AdminStaffManagement from "@/components/admin/AdminStaffManagement";
import AdminPspSettings from "@/components/admin/AdminPspSettings";
import AdminCurrencies from "@/components/admin/AdminCurrencies";
import AdminPlans from "@/components/admin/AdminPlans";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminPlatformSettings from "@/components/admin/AdminPlatformSettings";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminIndividuals from "@/components/admin/AdminIndividuals";
import AdminContactRequests from "@/components/admin/AdminContactRequests";
import AdminIntegrations from "@/components/admin/AdminIntegrations";

const SECTIONS = {
  overview: AdminOverview,
  cms_logos: AdminCmsLogos,
  cms_images: AdminCmsImages,
  cms_copy: AdminCmsCopy,
  cms_categories: AdminCmsCategories,
  legal: AdminLegalPages,
  companies: AdminCompanyManagement,
  individuals: AdminIndividuals,
  kyc: AdminMerchantVetting,
  offers: AdminOffers,
  reviews: AdminReviews,
  promotions: AdminPromotions,
  branding: AdminBranding,
  marketing: AdminMarketing,
  sales: AdminSalesCodes,
  leads: AdminContactRequests,
  staff: AdminStaffManagement,
  psp: AdminPspSettings,
  integrations: AdminIntegrations,
  currency: AdminCurrencies,
  plans: AdminPlans,
  payments: AdminPayments,
  settings: AdminPlatformSettings,
  audit: AdminAuditLog,
};

/** Super admin back-office. Each section is a self-contained module. */
export default function AdminPortal() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const wanted = params.get("section");
  // Agents only open the sections of their role (the database refuses the rest anyway).
  if (isStaff(user) && !staffSections(user).includes(wanted)) return <Navigate to={homeFor(user)} replace />;
  const Section = SECTIONS[wanted] || AdminOverview;

  return (
    <PortalLayout title={t("portal.admin.title")} theme="light">
      <RoleWelcomeHeader />
      <Section />
    </PortalLayout>
  );
}
