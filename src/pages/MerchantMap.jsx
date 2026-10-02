import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import DealsMap from "@/components/DealsMap";
import { mockMerchants, mockOffers } from "@/data/mockData";
import { useCategories } from "@/hooks/useCategories";
import { Navigation, Star, MapPin, ShieldCheck } from "lucide-react";

export default function MerchantMap() {
  const [selected, setSelected] = useState(null);
  const { meta } = useCategories();

  return (
    <PortalLayout title="Partner Store Map" theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Find nearby partners</h1>
        <p className="text-sm text-slate-500">Geolocation map of merchants where you can redeem your offers.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DealsMap merchants={mockMerchants} onSelect={setSelected} />
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Navigation className="h-5 w-5 text-emerald-600" /> Nearby merchants</h3>
          {mockMerchants.map((m, i) => {
            const offer = mockOffers.find((o) => o.merchant_id === m.id);
            const active = selected?.id === m.id;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(m)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-emerald-500/40 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">{meta(m.category).emoji}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{m.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" /> {m.city}, {m.country}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-amber-500"><Star className="h-3 w-3" /> {m.rating}</span>
                    {m.verified_status === "VERIFIED" && <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3 w-3" /> Verified</span>}
                  </div>
                  {offer && <p className="mt-1 text-xs text-emerald-600">{offer.discount_type === "BOGO" ? "2-for-1" : `${offer.discount_value}% off`} · {offer.cashback_rate}% cashback</p>}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </PortalLayout>
  );
}