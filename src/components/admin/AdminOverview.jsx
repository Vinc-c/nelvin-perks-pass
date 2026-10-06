import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { Building2, Shield, Users, Image as ImageIcon, Type, Store, Crown } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Promise.all([
      entities.Company.list(),
      entities.Merchant.list("-created_date", 500),
      entities.User.list(),
      entities.PartnerLogo.list(),
      entities.SiteImage.list(),
      entities.SiteCopy.list(),
    ]).then(([companies, merchants, users, logos, images, copy]) => {
      setStats({
        companies: companies.length,
        merchantsPending: merchants.filter((m) => m.verified_status === "PENDING").length,
        merchantsVerified: merchants.filter((m) => m.verified_status === "VERIFIED").length,
        users: users.length,
        logos: logos.length,
        images: images.length,
        copy: copy.length,
      });
    });
  }, []);

  const cards = [
    { icon: Users, label: "Utilisateurs", value: stats?.users, tone: "blue" },
    { icon: Building2, label: "Entreprises", value: stats?.companies, tone: "emerald" },
    { icon: Shield, label: "Marchands à valider", value: stats?.merchantsPending, tone: "amber" },
    { icon: Store, label: "Marchands actifs", value: stats?.merchantsVerified, tone: "rose" },
    { icon: ImageIcon, label: "Images CMS", value: stats?.images, tone: "purple" },
    { icon: Crown, label: "Logos partenaires", value: stats?.logos, tone: "blue" },
    { icon: Type, label: "Textes marketing", value: stats?.copy, tone: "emerald" },
  ];

  const tone = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Vue d'ensemble</h2>
        <p className="text-sm text-slate-500">Aperçu en temps réel de la plateforme Nelvin.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone[c.tone]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{stats ? c.value : "…"}</p>
              <p className="text-sm text-slate-500">{c.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}