import React, { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import CurrencySelect from "@/components/CurrencySelect";
import SectionCard from "@/components/dashboard/SectionCard";
import { ArrowLeftRight, Wallet, Globe } from "lucide-react";

export default function CurrencyExchange() {
  const { user } = useAuth();
  const money = useCurrencies();
  const [display, setDisplay] = useDisplayCurrency();
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState(display === "USD" ? "XOF" : display);

  const usd = money.toUsd(Number(amount) || 0, from);
  const converted = money.fromUsd(usd, to);
  const updated = money.currencies.map((c) => c.updated_date).filter(Boolean).sort().pop();

  return (
    <PortalLayout title="Devises" theme="light">
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={ArrowLeftRight} title="Convertisseur">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Montant" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-500" />
              <CurrencySelect value={from} onChange={setFrom} />
            </div>
            <button onClick={() => { setFrom(to); setTo(from); }} className="mx-auto flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"><ArrowLeftRight className="h-3 w-3" /> Inverser</button>
            <div className="flex items-center gap-2">
              <p className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-lg font-bold text-slate-900">{money.formatIn(converted, to)}</p>
              <CurrencySelect value={to} onChange={setTo} />
            </div>
            <p className="text-xs text-slate-500">
              1 {from} = {money.formatIn(money.fromUsd(money.toUsd(1, from), to), to)} · taux Nelvin{updated ? ` mis à jour le ${new Date(updated).toLocaleDateString("fr-FR")}` : ""}
            </p>
          </div>
        </SectionCard>

        <SectionCard icon={Wallet} title="Mon wallet">
          <p className="text-sm text-slate-500">Votre solde est conservé en USD et converti au taux du jour.</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{money.format(user?.wallet_balance, display)}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            Devise d'affichage par défaut : <CurrencySelect value={display} onChange={setDisplay} />
          </div>
        </SectionCard>
      </div>

      <SectionCard icon={Globe} title="Taux appliqués (pour 1 USD)" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Devise</th>
                <th className="pb-3 font-medium">Région</th>
                <th className="pb-3 text-right font-medium">Taux</th>
                <th className="pb-3 text-right font-medium">Votre solde</th>
              </tr>
            </thead>
            <tbody>
              {money.currencies.map((c) => (
                <tr key={c.code} className="border-b border-slate-50">
                  <td className="py-3"><span className="font-medium text-slate-900">{c.code}</span> <span className="text-slate-400">{c.name}</span></td>
                  <td className="py-3 text-slate-500">{c.region || "—"}</td>
                  <td className="py-3 text-right font-mono text-slate-700">{Number(c.rate_per_usd).toLocaleString("fr-FR")}</td>
                  <td className="py-3 text-right text-slate-700">{money.format(user?.wallet_balance, c.code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </PortalLayout>
  );
}
