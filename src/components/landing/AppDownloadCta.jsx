import React from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { QrCode, Smartphone } from "lucide-react";
import StoreBadges from "@/components/landing/StoreBadges";
import { usePublicContent, imageByKey } from "@/hooks/usePublicContent";

const SAVANNA = "/images/savanna.webp";
const PHONE_FALLBACK = "/images/app-phone.webp";

export default function AppDownloadCta() {
  const content = usePublicContent();
  const phoneMockup = imageByKey(content?.images, "app_phone_mockup", PHONE_FALLBACK);
  return (
    <section className="relative mt-8 md:mt-[184px] lg:mt-[192px]">
      {/* Background clipped to the (short) section box */}
      <div className="absolute inset-0 overflow-hidden">
        <Image src={SAVANNA} fittingType="fill" className="h-full w-full animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60" />
      </div>

      {/* Short content row — the right column is a spacer so the phone
          never overlaps the text. Section height is fixed to 60% of the
          phone so the phone overflows the top by exactly 40%. */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 md:min-h-[276px] md:grid-cols-2 lg:min-h-[288px] lg:py-10">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:pr-6">
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
        <div className="hidden md:block" aria-hidden />
      </div>

      {/* Mobile — inline phone below the text, no overflow */}
      <div className="relative flex justify-center pb-10 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative w-60 drop-shadow-2xl"
        >
          <Image src={phoneMockup} fittingType="fit" className="h-[420px] w-full object-contain" />
        </motion.div>
      </div>

      {/* md+ — phone anchored to the bottom, overflowing the top by 40% */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute bottom-0 right-4 hidden h-[460px] w-72 drop-shadow-2xl md:block lg:right-10 lg:h-[480px] lg:w-80"
      >
        <Image src={phoneMockup} fittingType="fit" className="h-full w-full object-contain" />
      </motion.div>
    </section>
  );
}