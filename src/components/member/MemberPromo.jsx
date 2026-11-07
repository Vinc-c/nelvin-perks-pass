import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";

export default function MemberPromo() {
  const { t } = useI18n();
  return (
    <div className="mt-6 rounded-[20px] bg-nv-emerald p-6 text-center text-white">
      <p className="text-[11px] uppercase tracking-[0.2em] text-nv-gold-light">{t("rd.promo.eyebrow")}</p>
      <h2 className="mt-2 text-2xl font-medium leading-tight">{t("rd.promo.title")}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/75">{t("rd.promo.desc")}</p>
      <Link to="/membership-plans" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-nv-emerald transition hover:bg-slate-100">{t("rd.explorePasses")} →</Link>
    </div>
  );
}
