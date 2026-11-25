import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Headphones, Send, Target } from "lucide-react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { callRpc } from "@/api/rpc";
import { usePlans } from "@/hooks/usePlans";
import { useI18n } from "@/i18n/I18nContext";

const AUDIENCES = ["COMPANY", "MERCHANT", "OTHER"];
const input = "nv-focus mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900";

/** "Contact sales": where every company / merchant pricing button lands. */
export default function Contact() {
  const { t, lang } = useI18n();
  const { plans } = usePlans();
  const [params] = useSearchParams();
  const initialType = { company: "COMPANY", merchant: "MERCHANT" }[(params.get("type") || "").toLowerCase()] || "COMPANY";
  const [form, setForm] = useState({ audience: initialType, plan_code: params.get("plan") || "", full_name: "", email: "", phone: "", company: "", country: "", size: "", message: "", website: "" });
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const audiencePlans = plans.filter((p) => p.audience === (form.audience === "COMPANY" ? "B2B" : form.audience === "MERCHANT" ? "MERCHANT" : "-"));

  useEffect(() => { document.title = t("ct.pageTitle"); }, [t]);

  const submit = async (e) => {
    e.preventDefault();
    setState("sending"); setError("");
    try {
      await callRpc("submit_contact_request", {
        p_audience: form.audience, p_full_name: form.full_name, p_email: form.email, p_phone: form.phone || null,
        p_company: form.company || null, p_country: form.country || null, p_size: form.size || null,
        p_message: form.message || null, p_plan_code: form.plan_code || null, p_lang: lang, p_website: form.website,
      });
      setState("sent");
    } catch (err) {
      setError(err.message || t("ct.err")); setState("error");
    }
  };

  const side = [[Clock, "ct.side1"], [Target, "ct.side2"], [Headphones, "ct.side3"]];
  return (
    <div className="nv-body min-h-screen bg-slate-50 text-[#1A2060]">
      <SiteHeader />
      <main>
        <section className="bg-[#1A2060] text-white">
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6">
            <h1 className="nv-display max-w-[20ch] text-4xl font-semibold leading-tight sm:text-5xl">{t("ct.h1")}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">{t("ct.lead")}</p>
          </div>
        </section>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_20rem]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {state === "sent" ? (
              <div role="status" className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-nv-emerald" />
                <h2 className="mt-4 text-2xl font-bold text-slate-900">{t("ct.okTitle")}</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-600">{t("ct.okBody")}</p>
                <button type="button" onClick={() => { setForm((f) => ({ ...f, message: "" })); setState("idle"); }} className="nv-focus mt-6 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50">{t("ct.again")}</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5" noValidate={false}>
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">{t("ct.iAm")}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {AUDIENCES.map((a) => (
                      <label key={a} className={`nv-focus cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${form.audience === a ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                        <input type="radio" name="audience" value={a} checked={form.audience === a} onChange={() => setForm((f) => ({ ...f, audience: a, plan_code: "" }))} className="sr-only" />
                        {t(`ct.a.${a}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">{t("ct.name")}<input required minLength={2} maxLength={120} autoComplete="name" value={form.full_name} onChange={set("full_name")} className={input} /></label>
                  <label className="text-sm font-medium text-slate-700">{t("ct.email")}<input required type="email" maxLength={200} autoComplete="email" value={form.email} onChange={set("email")} className={input} /></label>
                  <label className="text-sm font-medium text-slate-700">{t("ct.company")}<input maxLength={160} autoComplete="organization" value={form.company} onChange={set("company")} className={input} /></label>
                  <label className="text-sm font-medium text-slate-700">{t("ct.phone")}<input type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={set("phone")} className={input} /></label>
                  <label className="text-sm font-medium text-slate-700">{t("ct.country")}<input maxLength={80} autoComplete="country-name" value={form.country} onChange={set("country")} className={input} /></label>
                  <label className="text-sm font-medium text-slate-700">{t(`ct.size.${form.audience}`)}<input maxLength={40} value={form.size} onChange={set("size")} className={input} /></label>
                </div>
                {audiencePlans.length > 0 && (
                  <label className="block text-sm font-medium text-slate-700">{t("ct.plan")}
                    <select value={form.plan_code} onChange={set("plan_code")} className={input}>
                      <option value="">—</option>
                      {audiencePlans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="block text-sm font-medium text-slate-700">{t("ct.message")}<textarea rows={4} maxLength={3000} value={form.message} onChange={set("message")} className={input} /></label>
                {/* Honeypot: invisible to people, bots fill it. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label></div>
                {state === "error" && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error || t("ct.err")}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{t("ct.privacy")}</p>
                  <button type="submit" disabled={state === "sending"} className="nv-focus inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
                    <Send className="h-4 w-4 rtl:-scale-x-100" /> {state === "sending" ? t("ct.sending") : t("ct.send")}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
          <aside className="space-y-3 self-start">
            {side.map(([Icon, k]) => (
              <div key={k} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nv-emerald/10 text-nv-emerald"><Icon className="h-5 w-5" /></span>
                <p className="text-sm font-medium text-slate-800">{t(k)}</p>
              </div>
            ))}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
