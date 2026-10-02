import React from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { QrCode, Smartphone } from "lucide-react";
import StoreBadges from "@/components/landing/StoreBadges";
import { usePublicContent, imageByKey } from "@/hooks/usePublicContent";

const SAVANNA = "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/1a09b4fa8_generated_image.png";
const PHONE_FALLBACK = "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/2c61026fb_generated_image.png";

export default function AppDownloadCta() {
  const content = usePublicContent();
  const phoneMockup = imageByKey(content?.images, "app_phone_mockup", PHONE_FALLBACK);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src={SAVANNA} fittingType="fill" className="h-full w-full animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Smartphone className="h-3.5 w-3.5" /> Download the app
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Start the good life now.</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">Scan to download the app and start saving today. Offline-ready QR redemption everywhere you go.</p>
          <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-100">
              <QrCode className="h-full w-full text-slate-900" />
            </div>
            <StoreBadges />
          </div>
        </motion.div>

        <div className="flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, rotate: -6, y: 20 }}
            whileInView={{ opacity: 1, rotate: -6, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="not-pill relative w-64 overflow-hidden rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl sm:w-72"
          >
            <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
            <Image src={phoneMockup} fittingType="fill" className="h-[480px] w-full object-cover sm:h-[520px]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}