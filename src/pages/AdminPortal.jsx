import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { useI18n } from "@/i18n/I18nContext";
import { mockCurrencies } from "@/data/mockData";
import AdminMerchantVetting from "@/components/admin/AdminMerchantVetting";
import { routePayment, PSPS } from "@/lib/paymentRouter";
import { AFRICAN_COUNTRIES } from "@/data/africanCountries";
import { Route, Zap } from "lucide-react";
import AdminCompanyManagement from "@/components/admin/AdminCompanyManagement";
import AdminSalesCodes from "@/components/admin/AdminSalesCodes";
import AdminStaffManagement from "@/components/admin/AdminStaffManagement";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminCmsLogos from "@/components/admin/AdminCmsLogos";
import AdminCmsImages from "@/components/admin/AdminCmsImages";
import AdminCmsCopy from "@/components/admin/AdminCmsCopy";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPortal() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const tab = params.get("section") || "overview";

  const [audience, setAudience] = useState("B2C");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [country, setCountry] = useState("Cameroun");
  const route = routePayment({ audience, method, country });

  return (
    <PortalLayout title={t("portal.admin.title")} theme="light">
      <RoleWelcomeHeader />

      {tab === "overview" && <AdminOverview />}
      {tab === "cms_logos" && <AdminCmsLogos />}
      {tab === "cms_images" && <AdminCmsImages />}
      {tab === "cms_copy" && <AdminCmsCopy />}

      {/* Company management */}
      {tab === "companies" && <AdminCompanyManagement />}

      {/* Sales / commercial codes */}
      {tab === "sales" && <AdminSalesCodes />}

      {/* Super admin staff management */}
      {tab === "staff" && <AdminStaffManagement />}

      {/* PSP Router */}
      {tab === "psp" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-emerald-700">
              <Route className="h-5 w-5" /> Routeur de paiement intelligent — routage en direct
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-slate-500">
                Audience
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                  <option value="B2B">B2B (Entreprise)</option>
                  <option value="B2C">B2C (Particulier)</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Moyen de paiement
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                  <option value="CARD">Carte</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="APPLE_PAY">Apple Pay</option>
                  <option value="GOOGLE_PAY">Google Pay</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Pays
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                  {AFRICAN_COUNTRIES.map((c) => <option key={c.iso} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-emerald-100">
              <Zap className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-slate-500">Passerelle sélectionnée</p>
                <p className="text-lg font-bold text-emerald-600">{route.primary.name}</p>
                <p className="mt-1 text-xs text-slate-500">{route.reason}</p>
                {route.fallback.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">Chaîne de secours : {route.fallback.map((f) => f.name).join(" → ")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PSPS.map((psp, i) => {
              const active = route.primary.id === psp.id;
              return (
                <motion.div key={psp.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-2xl border bg-white p-5 shadow-sm ${active ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{psp.name}</span>
                    {active
                      ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Sélectionné</span>
                      : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Disponible</span>}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{psp.region}</p>
                  <p className="mt-2 text-xs text-slate-500">{psp.useCase}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {psp.methods.map((m) => (
                      <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{m}</span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* KYC pipeline */}
      {tab === "kyc" && <AdminMerchantVetting />}

      {/* Currency engine */}
      {tab === "currency" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="p-4 font-medium">Devise</th>
                <th className="p-4 font-medium">Symbole</th>
                <th className="p-4 font-medium">Taux (par USD)</th>
                <th className="p-4 font-medium">Région</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {mockCurrencies.map((c) => (
                <tr key={c.code} className="border-b border-slate-50">
                  <td className="p-4"><span className="font-medium text-slate-900">{c.code}</span> <span className="text-slate-400">{c.name}</span></td>
                  <td className="p-4 text-slate-600">{c.symbol}</td>
                  <td className="p-4 font-mono text-slate-700">{c.rate}</td>
                  <td className="p-4 text-slate-500">{["XAF", "XOF"].includes(c.code) ? "Zone CFA" : c.code === "NGN" ? "Afrique de l'Ouest" : c.code === "KES" ? "Afrique de l'Est" : c.code === "EGP" ? "MENA" : c.code === "AED" ? "Golfe" : "Mondial"}</td>
                  <td className="p-4 text-right"><button onClick={() => toast({ title: "Modifier devise", description: `Taux ${c.code} bientôt éditable.` })} className="text-emerald-600 hover:underline">Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </PortalLayout>
  );
}