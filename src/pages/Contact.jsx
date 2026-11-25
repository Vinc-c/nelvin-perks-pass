import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, CheckCircle2, Clock, Copy, Handshake, Headphones, LifeBuoy, Receipt, Send, Target } from "lucide-react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { callRpc } from "@/api/rpc";
import { usePlans } from "@/hooks/usePlans";
import { useI18n } from "@/i18n/I18nContext";
import PhoneInput from "@/components/PhoneInput";

// One form, four reasons to write. Each topic shows the fields that matter for it.
const TOPICS = {
  DEMO: { icon: CalendarCheck, fields: ["company", "role", "size", "country", "phone", "preferred_time"], required: ["company"], sizeKey: "ct.size.COMPANY" },
  PARTNER: { icon: Handshake, fields: ["company", "business_type", "website_url", "country", "size", "phone"], required: ["company"], sizeKey: "ct.size.MERCHANT" },
  QUOTE: { icon: Receipt, fields: ["audience", "plan", "company", "size", "country", "phone"], required: [], sizeKey: null },
  SUPPORT: { icon: LifeBuoy, fields: ["order_reference", "urgency", "phone"], required: ["message"], sizeKey: null },
};
const LEGACY = { company: "QUOTE", merchant: "QUOTE" };
const TIMES = ["morning", "afternoon", "evening"];
const BUSINESS = ["restaurant", "wellness", "retail", "travel", "services", "other"];
const input = "nv-focus mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900";

export default function Contact() {
  const { t, lang } = useI18n();
  const { plans } = usePlans();
  const reduced = useReducedMotion();
  const [params] = useSearchParams();
  const fromUrl = (params.get("topic") || "").toUpperCase();
  const legacy = LEGACY[(params.get("type") || "").toLowerCase()];
  const [topic, setTopic] = useState(TOPICS[fromUrl] ? fromUrl : legacy || "DEMO");
  const [form, setForm] = useState({ audience: (params.get("type") || "").toLowerCase() === "merchant" ? "MERCHANT" : "COMPANY", plan_code: params.get("plan") || "", full_name: "", email: "", phone: "", company: "", country: "", size: "", message: "", website: "", role: "", preferred_time: "", business_type: "", website_url: "", order_reference: "", urgency: "normal" });
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState(false);
  const cfg = TOPICS[topic];
  const has = (f) => cfg.fields.includes(f);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const audiencePlans = plans.filter((p) => p.audience === (form.audience === "COMPANY" ? "B2B" : "MERCHANT"));

  useEffect(() => { document.title = t("ct.pageTitle"); }, [t]);

  const submit = async (e) => {
    e.preventDefault();
    setState("sending"); setError("");
    try {
      const res = await callRpc("submit_contact", {
        p_topic: topic, p_audience: form.audience, p_full_name: form.full_name, p_email: form.email, p_phone: form.phone || null,
        p_company: form.company || null, p_country: form.country || null, p_size: form.size || null, p_message: form.message || null,
        p_plan_code: topic === "QUOTE" ? form.plan_code || null : null, p_lang: lang, p_website: form.website,
        p_details: { role: form.role, preferred_time: form.preferred_time, business_type: form.business_type, website_url: form.website_url, order_reference: form.order_reference, urgency: topic === "SUPPORT" ? form.urgency : "" },
      });
      setRef(res?.reference || ""); setState("sent");
    } catch (err) {
      setError(err.message || t("ct.err")); setState("error");
    }
  };
  const copyRef = async () => { try { await navigator.clipboard.writeText(ref); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ } };

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
          <motion.div initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {state === "sent" ? (
              <div role="status" className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <h2 className="mt-4 text-2xl font-bold text-slate-900">{t("ct.okTitle")}</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-600">{t("ct.okBody")}</p>
                {ref && (
                  <div className="mx-auto mt-5 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-left"><p className="text-xs text-slate-500">{t("ct.refLabel")}</p><p className="font-mono text-lg font-bold tracking-wide text-slate-900">{ref}</p></div>
                    <button type="button" onClick={copyRef} aria-label={t("ct.copy")} className="nv-focus rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900"><Copy className="h-4 w-4" /></button>
                    {copied && <span className="text-xs font-medium text-[#15803d]">{t("ct.copied")}</span>}
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-500">{t("ct.emailSent", { email: form.email })}</p>
                <div><button type="button" onClick={() => { setForm((f) => ({ ...f, message: "", order_reference: "" })); setState("idle"); }} className="nv-focus mt-6 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50">{t("ct.again")}</button></div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">{t("ct.topic")}</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup">
                    {Object.entries(TOPICS).map(([id, { icon: Icon }]) => (
                      <label key={id} className={`nv-focus relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${topic === id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                        <input type="radio" name="topic" value={id} checked={topic === id} onChange={() => setTopic(id)} className="sr-only" />
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${topic === id ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-[18px] w-[18px]" /></span>
                        <span><span className="block text-sm font-semibold text-slate-900">{t(`ct.t.${id}`)}</span><span className="block text-xs text-slate-500">{t(`ct.t.${id}.d`)}</span></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={topic} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="space-y-5">
                    {has("audience") && (
                      <fieldset>
                        <legend className="text-sm font-medium text-slate-700">{t("ct.iAm")}</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["COMPANY", "MERCHANT"].map((a) => (
                            <label key={a} className={`nv-focus cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${form.audience === a ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                              <input type="radio" name="audience" value={a} checked={form.audience === a} onChange={() => setForm((f) => ({ ...f, audience: a, plan_code: "" }))} className="sr-only" />{t(`ct.a.${a}`)}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-slate-700">{t("ct.name")}<input required minLength={2} maxLength={120} autoComplete="name" value={form.full_name} onChange={set("full_name")} className={input} /></label>
                      <label className="text-sm font-medium text-slate-700">{t("ct.email")}<input required type="email" maxLength={200} autoComplete="email" value={form.email} onChange={set("email")} className={input} /></label>
                      {has("company") && <label className="text-sm font-medium text-slate-700">{t(topic === "PARTNER" ? "ct.businessName" : "ct.company")}<input required={cfg.required.includes("company")} maxLength={160} autoComplete="organization" value={form.company} onChange={set("company")} className={input} /></label>}
                      {has("role") && <label className="text-sm font-medium text-slate-700">{t("ct.role")}<input maxLength={80} autoComplete="organization-title" value={form.role} onChange={set("role")} className={input} /></label>}
                      {has("business_type") && <label className="text-sm font-medium text-slate-700">{t("ct.businessType")}<select value={form.business_type} onChange={set("business_type")} className={input}><option value="">—</option>{BUSINESS.map((b) => <option key={b} value={b}>{t(`ct.bt.${b}`)}</option>)}</select></label>}
                      {has("website_url") && <label className="text-sm font-medium text-slate-700">{t("ct.website")}<input type="url" inputMode="url" maxLength={200} placeholder="https://" value={form.website_url} onChange={set("website_url")} className={input} /></label>}
                      {has("country") && <label className="text-sm font-medium text-slate-700">{t("ct.country")}<input maxLength={80} autoComplete="country-name" value={form.country} onChange={set("country")} className={input} /></label>}
                      {has("size") && <label className="text-sm font-medium text-slate-700">{t(cfg.sizeKey || `ct.size.${form.audience}`)}<input maxLength={40} value={form.size} onChange={set("size")} className={input} /></label>}
                      {has("order_reference") && <label className="text-sm font-medium text-slate-700">{t("ct.orderRef")}<input maxLength={80} value={form.order_reference} onChange={set("order_reference")} className={input} /></label>}
                      {has("urgency") && <label className="text-sm font-medium text-slate-700">{t("ct.urgency")}<select value={form.urgency} onChange={set("urgency")} className={input}><option value="normal">{t("ct.urg.normal")}</option><option value="urgent">{t("ct.urg.urgent")}</option></select></label>}
                      {has("preferred_time") && <label className="text-sm font-medium text-slate-700">{t("ct.time")}<select value={form.preferred_time} onChange={set("preferred_time")} className={input}><option value="">—</option>{TIMES.map((x) => <option key={x} value={x}>{t(`ct.time.${x}`)}</option>)}</select></label>}
                      {has("phone") && <div className="text-sm font-medium text-slate-700 sm:col-span-2"><span>{t("ct.phone")}</span><div className="mt-1"><PhoneInput value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} /></div></div>}
                    </div>
                    {has("plan") && audiencePlans.length > 0 && (
                      <label className="block text-sm font-medium text-slate-700">{t("ct.plan")}
                        <select value={form.plan_code} onChange={set("plan_code")} className={input}><option value="">—</option>{audiencePlans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select>
                      </label>
                    )}
                    <label className="block text-sm font-medium text-slate-700">{t(topic === "SUPPORT" ? "ct.messageSupport" : "ct.message")}<textarea required={cfg.required.includes("message")} rows={4} maxLength={3000} value={form.message} onChange={set("message")} className={input} /></label>
                  </motion.div>
                </AnimatePresence>
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
            {side.map(([Icon, k], i) => (
              <motion.div key={k} initial={reduced ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <p className="text-sm font-medium text-slate-800">{t(k)}</p>
              </motion.div>
            ))}
            <p className="px-1 text-xs text-slate-500">{t("ct.directEmail")} <a className="font-medium text-primary hover:underline" href="mailto:support@nelvinbenefits.com">support@nelvinbenefits.com</a></p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
