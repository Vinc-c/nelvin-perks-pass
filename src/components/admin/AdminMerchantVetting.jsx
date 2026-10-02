import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Store } from "lucide-react";
import AdminMerchantRow from "./AdminMerchantRow";

const FILTERS = [
  { k: "PENDING", l: "En attente" },
  { k: "VERIFIED", l: "Validés" },
  { k: "REJECTED", l: "Rejetés" },
  { k: "ALL", l: "Tous" },
];

export default function AdminMerchantVetting() {
  const { toast } = useToast();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    base44.entities.Merchant.list("-created_date", 200).then(setMerchants).finally(() => setLoading(false));
  }, []);

  const setStatus = async (m, status) => {
    await base44.entities.Merchant.update(m.id, { verified_status: status });
    setMerchants((list) => list.map((x) => (x.id === m.id ? { ...x, verified_status: status } : x)));
    toast({ title: status === "VERIFIED" ? "Marchand validé" : "Marchand rejeté", description: m.name });
  };

  const count = (k) => (k === "ALL" ? merchants.length : merchants.filter((m) => m.verified_status === k).length);
  const shown = filter === "ALL" ? merchants : merchants.filter((m) => m.verified_status === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f.k ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {f.l} <span className="ml-1 opacity-60">{count(f.k)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          <Store className="mx-auto mb-2 h-8 w-8 text-slate-300" /> Aucun marchand dans cette catégorie.
        </div>
      ) : (
        shown.map((m) => <AdminMerchantRow key={m.id} merchant={m} onStatus={setStatus} />)
      )}
    </motion.div>
  );
}