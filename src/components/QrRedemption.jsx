import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Wifi, WifiOff, Copy, Check, Clock, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { invokeFunction } from "@/api/functions";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useI18n } from "@/i18n/I18nContext";

const DEFAULT_TTL = 180; // 3 minutes

export default function QrRedemption({ offer, onClose }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const money = useCurrencies();
  const [started, setStarted] = useState(false);
  const [allowWallet, setAllowWallet] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [code, setCode] = useState("");
  const [redemptionId, setRedemptionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_TTL);
  const [ttl, setTtl] = useState(DEFAULT_TTL);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const createRedemption = async () => {
    if (!user?.id || !offer?.id) return;
    setLoading(true);
    setExpired(false);
    setError("");
    try {
      const res = await invokeFunction("generate-redemption", { offer_id: offer.id, allow_wallet_payment: allowWallet });
      const d = res.data || {};
      if (!d.ok || !d.code) throw new Error(d.error || t("mb.qr.genFailed"));
      if (!mounted.current) return;
      setCode(d.code);
      setRedemptionId(d.redemption_id);
      setTtl(d.ttl || DEFAULT_TTL);
      setSecondsLeft(d.ttl || DEFAULT_TTL);
    } catch (e) {
      if (mounted.current) setError(e.message || t("mb.qr.genCodeFailed"));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const start = () => {
    setStarted(true);
    createRedemption();
  };

  useEffect(() => {
    if (!code || loading) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setExpired(true);
          if (redemptionId) {
            supabase.rpc("expire_my_redemption", { p_id: redemptionId }).then(() => {}, () => {});
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [code, loading, redemptionId]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const minsLabel = (ttl / 60) | 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{offer.title}</h3>
          <button onClick={onClose} aria-label={t("mb.common.close")} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm">
          {online ? (
            <span className="flex items-center gap-1.5 text-emerald-600"><Wifi className="h-4 w-4" /> {t("mb.qr.online")}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600"><WifiOff className="h-4 w-4" /> {t("mb.qr.offline")}</span>
          )}
          <span className={`ml-auto flex items-center gap-1 ${expired ? "text-rose-500" : "text-slate-500"}`}>
            <Clock className="h-4 w-4" /> {expired ? t("mb.qr.expiredShort") : `${minutes}:${secs.toString().padStart(2, "0")}`}
          </span>
        </div>

        {!started ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{t("mb.qr.intro")}</p>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
              <input type="checkbox" checked={allowWallet} onChange={(e) => setAllowWallet(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
              <span>
                <span className="font-medium text-slate-900">{t("mb.qr.payWallet")}</span>
                <span className="block text-xs text-slate-500">{t("mb.qr.payWalletDesc", { balance: money.format(user?.wallet_balance, user?.wallet_currency || "USD") })}</span>
              </span>
            </label>
            <button onClick={start} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600">{t("mb.qr.generate")}</button>
          </div>
        ) : (<>
        <div className="mb-4 flex flex-col items-center rounded-xl bg-slate-50 p-6">
          {loading ? (
            <div className="flex h-40 w-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : error ? (
            <div className="flex h-40 w-40 flex-col items-center justify-center text-center">
              <p className="px-4 text-sm text-rose-500">{error}</p>
            </div>
          ) : expired ? (
            <div className="flex h-40 w-40 flex-col items-center justify-center text-center">
              <Clock className="h-10 w-10 text-rose-400" />
              <p className="mt-2 text-sm text-slate-500">{t("mb.qr.codeExpired")}</p>
            </div>
          ) : online ? (
            <>
              <div className="relative mb-3 flex h-40 w-40 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                <QRCodeSVG value={code} size={144} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#0F172A" />
              </div>
              <p className="text-center font-mono text-xs text-slate-400 break-all">{code}</p>
            </>
          ) : (
            <>
              <div className="mb-3 rounded-xl bg-brand px-6 py-4">
                <p className="font-mono text-3xl font-bold tracking-widest text-emerald-400">{code}</p>
              </div>
              <p className="text-center text-xs text-slate-500">{t("mb.qr.showMerchant")}</p>
            </>
          )}
        </div>

        {error ? (
          <button
            onClick={createRedemption}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" /> {t("mb.qr.retry")}
          </button>
        ) : expired ? (
          <button
            onClick={createRedemption}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" /> {t("mb.qr.regenerate")}
          </button>
        ) : (
          <button
            onClick={copyCode}
            disabled={loading || !code}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("mb.qr.copied") : t("mb.qr.copy")}
          </button>
        )}

        <p className="mt-3 text-center text-xs text-slate-400">
          {online ? t("mb.qr.validOnline", { min: minsLabel }) : t("mb.qr.validOffline", { min: minsLabel })}
        </p>
        </>)}
      </motion.div>
    </motion.div>
  );
}