import React from "react";
import { useSearchParams } from "react-router-dom";
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
import AdminSalesCodes from "@/components/admin/AdminSalesCodes";
import AdminStaffManagement from "@/components/admin/AdminStaffManagement";
import AdminPspSettings from "@/components/admin/AdminPspSettings";
import AdminCurrencies from "@/components/admin/AdminCurrencies";
import AdminPlans from "@/components/admin/AdminPlans";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminPlatformSettings from "@/components/admin/AdminPlatformSettings";
import AdminAuditLog from "@/components/admin/AdminAuditLog";

const SECTIONS = {
  overview: AdminOverview,
  cms_logos: AdminCmsLogos,
  cms_images: AdminCmsImages,
  cms_copy: AdminCmsCopy,
  cms_categories: AdminCmsCategories,
  companies: AdminCompanyManagement,
  kyc: AdminMerchantVetting,
  sales: AdminSalesCodes,
  staff: AdminStaffManagement,
  psp: AdminPspSettings,
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
  const Section = SECTIONS[params.get("section")] || AdminOverview;

  return (
    <PortalLayout title={t("portal.admin.title")} theme="light">
      <RoleWelcomeHeader />
      <Section />
    </PortalLayout>
  );
}
