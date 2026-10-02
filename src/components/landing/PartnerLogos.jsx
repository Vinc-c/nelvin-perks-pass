import React, { useState } from "react";
import { usePublicContent } from "@/hooks/usePublicContent";

const partners = [
  { name: "MTN", category: "Telecoms", domain: "mtn.com" },
  { name: "Safaricom", category: "Telecoms", domain: "safaricom.co.ke" },
  { name: "Airtel", category: "Telecoms", domain: "airtel.com" },
  { name: "Vodacom", category: "Telecoms", domain: "vodacom.co.za" },
  { name: "Telkom", category: "Telecoms", domain: "telkom.co.za" },
  { name: "Maroc Telecom", category: "Telecoms", domain: "iam.ma" },
  { name: "Orange", category: "Telecoms", domain: "orange.com" },
  { name: "Etisalat", category: "Telecoms", domain: "etisalat.ae" },
  { name: "du", category: "Telecoms", domain: "du.ae" },
  { name: "Ooredoo", category: "Telecoms", domain: "ooredoo.com" },
  { name: "Zain", category: "Telecoms", domain: "zain.com" },
  { name: "Moov Africa", category: "Telecoms", domain: "moov-africa.com" },
  { name: "Globacom", category: "Telecoms", domain: "gloworld.com" },
  { name: "9mobile", category: "Telecoms", domain: "9mobile.com.ng" },
  { name: "Vodafone Egypt", category: "Telecoms", domain: "vodafone.com.eg" },
  { name: "Mobilis", category: "Telecoms", domain: "mobilis.dz" },
  { name: "Djezzy", category: "Telecoms", domain: "djezzy.dz" },
  { name: "Cell C", category: "Telecoms", domain: "cellc.co.za" },
  { name: "Ecobank", category: "Banking", domain: "ecobank.com" },
  { name: "Access Bank", category: "Banking", domain: "accessbankplc.com" },
  { name: "Zenith Bank", category: "Banking", domain: "zenithbank.com" },
  { name: "GTBank", category: "Banking", domain: "gtbank.com" },
  { name: "Equity Bank", category: "Banking", domain: "equitybankgroup.com" },
  { name: "KCB", category: "Banking", domain: "kcbgroup.com" },
  { name: "Standard Bank", category: "Banking", domain: "standardbank.com" },
  { name: "Attijariwafa", category: "Banking", domain: "attijariwafa.com" },
  { name: "BCP", category: "Banking", domain: "groupebcp.com" },
  { name: "National Bank of Egypt", category: "Banking", domain: "nbe.com.eg" },
  { name: "FirstBank", category: "Banking", domain: "firstbanknigeria.com" },
  { name: "UBA", category: "Banking", domain: "ubagroup.com" },
  { name: "Nedbank", category: "Banking", domain: "nedbank.co.za" },
  { name: "Absa", category: "Banking", domain: "absa.africa" },
  { name: "Bank of Africa", category: "Banking", domain: "bankofafrica-group.com" },
  { name: "QNB", category: "Banking", domain: "qnb.com" },
  { name: "Emirates NBD", category: "Banking", domain: "emiratesnbd.com" },
  { name: "Mashreq", category: "Banking", domain: "mashreq.com" },
  { name: "ADCB", category: "Banking", domain: "adcb.com" },
  { name: "FAB", category: "Banking", domain: "bankfab.com" },
  { name: "Al Rajhi Bank", category: "Banking", domain: "alrajhibank.com.sa" },
  { name: "Sterling Bank", category: "Banking", domain: "sterling.ng" },
  { name: "M-Pesa", category: "Fintech", domain: "mpesa.co.ke" },
  { name: "Flutterwave", category: "Fintech", domain: "flutterwave.com" },
  { name: "Paystack", category: "Fintech", domain: "paystack.com" },
  { name: "Paga", category: "Fintech", domain: "paga.com" },
  { name: "Cellulant", category: "Fintech", domain: "cellulant.com" },
  { name: "MFS Africa", category: "Fintech", domain: "mfs.africa" },
  { name: "Wave", category: "Fintech", domain: "wave.com" },
  { name: "Kuda", category: "Fintech", domain: "kuda.com" },
  { name: "Opay", category: "Fintech", domain: "opay.com" },
  { name: "Yoco", category: "Fintech", domain: "yoco.com" },
  { name: "Jumia", category: "E-commerce", domain: "jumia.com" },
  { name: "Konga", category: "E-commerce", domain: "konga.com" },
  { name: "Takealot", category: "E-commerce", domain: "takealot.com" },
  { name: "Kilimall", category: "E-commerce", domain: "kilimall.com" },
  { name: "Jumia Food", category: "E-commerce", domain: "food.jumia.com" },
  { name: "Glovo", category: "E-commerce", domain: "glovoapp.com" },
  { name: "Yassir", category: "E-commerce", domain: "yassir.com" },
  { name: "Carrefour", category: "Retail", domain: "carrefour.com" },
  { name: "Shoprite", category: "Retail", domain: "shoprite.co.za" },
  { name: "Pick n Pay", category: "Retail", domain: "picknpay.co.za" },
  { name: "Massmart", category: "Retail", domain: "massmart.co.za" },
  { name: "Spinneys", category: "Retail", domain: "spinneys.com" },
  { name: "Majid Al Futtaim", category: "Retail", domain: "majidalfuttaim.com" },
  { name: "Woolworths", category: "Retail", domain: "woolworths.co.za" },
  { name: "Checkers", category: "Retail", domain: "checkers.co.za" },
  { name: "Decathlon", category: "Retail", domain: "decathlon.com" },
  { name: "LC Waikiki", category: "Retail", domain: "lcwaikiki.com" },
  { name: "Dangote", category: "Conglomerate", domain: "dangote.com" },
  { name: "Bidco Africa", category: "Manufacturing", domain: "bidcoafrica.com" },
  { name: "Sasol", category: "Energy", domain: "sasol.com" },
  { name: "OCP Group", category: "Mining", domain: "ocpgroup.ma" },
  { name: "Sonatrach", category: "Oil & Gas", domain: "sonatrach.com" },
  { name: "Sonangol", category: "Oil & Gas", domain: "sonangol.co.ao" },
  { name: "TotalEnergies", category: "Energy", domain: "totalenergies.com" },
  { name: "Engen", category: "Energy", domain: "engen.co.za" },
  { name: "Vivo Energy", category: "Energy", domain: "vivoenergy.com" },
  { name: "Bidvest", category: "Conglomerate", domain: "bidvest.com" },
  { name: "Nampak", category: "Packaging", domain: "nampak.com" },
  { name: "Nando's", category: "Food", domain: "nandos.co.za" },
  { name: "Tiger Brands", category: "Food", domain: "tigerbrands.com" },
  { name: "Nestlé", category: "Food", domain: "nestle.com" },
  { name: "Coca-Cola", category: "Beverage", domain: "coca-cola.com" },
  { name: "KFC", category: "Food", domain: "kfc.com" },
  { name: "Debonairs Pizza", category: "Food", domain: "debonairspizza.co.za" },
  { name: "Steers", category: "Food", domain: "steers.co.za" },
  { name: "Emirates", category: "Travel", domain: "emirates.com" },
  { name: "Ethiopian Airlines", category: "Travel", domain: "ethiopianairlines.com" },
  { name: "Kenya Airways", category: "Travel", domain: "kenya-airways.com" },
  { name: "South African Airways", category: "Travel", domain: "flysaa.com" },
  { name: "Royal Air Maroc", category: "Travel", domain: "royalairmaroc.com" },
  { name: "EgyptAir", category: "Travel", domain: "egyptair.com" },
  { name: "qatar airways", category: "Travel", domain: "qatarairways.com" },
  { name: "Marriott", category: "Hospitality", domain: "marriott.com" },
  { name: "Radisson", category: "Hospitality", domain: "radissonhotels.com" },
  { name: "Protea Hotels", category: "Hospitality", domain: "proteahotels.com" },
  { name: "Accor", category: "Hospitality", domain: "accor.com" },
  { name: "Hilton", category: "Hospitality", domain: "hilton.com" },
  { name: "MultiChoice", category: "Media", domain: "multichoice.com" },
  { name: "MBC Group", category: "Media", domain: "mbc.net" },
  { name: "Naspers", category: "Media", domain: "naspers.com" },
  { name: "Showmax", category: "Media", domain: "showmax.com" },
  { name: "Trace", category: "Media", domain: "trace.tv" },
  { name: "Andela", category: "Technology", domain: "andela.com" },
];

const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

function LogoImg({ domain, name }) {
  const sources = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-12 w-12 items-center justify-center text-sm font-bold text-slate-400">
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={sources[idx]}
      alt={`${name} logo`}
      loading="lazy"
      className="h-12 w-12 object-contain"
      onError={() => (idx < sources.length - 1 ? setIdx(idx + 1) : setFailed(true))}
    />
  );
}

export default function PartnerLogos() {
  const content = usePublicContent();
  const cmsLogos = (content?.logos || []).filter((l) => l.active !== false);
  const list = cmsLogos.length > 0 ? cmsLogos : partners;
  const loop = [...list, ...list];
  return (
    <section className="bg-white/60 py-10">
      <h2 className="px-4 text-center text-2xl font-bold text-slate-900 sm:px-6 sm:text-3xl">Your favorites are already in</h2>
      <p className="mt-2 px-4 text-center text-slate-500">Trusted by {list.length}+ leading African & MENA brands.</p>
      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max animate-marquee gap-4">
          {loop.map((p, i) => (
            <div key={`${p.name}-${i}`} className="flex h-20 w-56 flex-shrink-0 items-center gap-3 px-4">
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} loading="lazy" className="h-12 w-12 object-contain" />
              ) : (
                <LogoImg domain={p.domain} name={p.name} />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="truncate text-xs text-slate-400">{p.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}