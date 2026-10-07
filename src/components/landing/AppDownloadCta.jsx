import React from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Image } from "@/components/ui/image";
import InstallAppButton from "@/components/InstallAppButton";
import PhoneMock from "@/components/landing/PhoneMock";
import { usePublicContent, imageByKey } from "@/hooks/usePublicContent";

const SAVANNA = "/images/savanna.webp";

function Phone({ src, className }) {
  return src
    ? <Image src={src} fittingType="fit" className={`${className} object-contain`} />
    : <PhoneMock className="mx-auto max-w-[260px]" />;
}

export default function AppDownloadCta() {
  const content = usePublicContent();
  // A real screenshot uploaded in the CMS replaces the drawn phone.
  const screenshot = imageByKey(content?.images, "app_phone_mockup", null);
  const appUrl = `${window.location.origin}/app`;
  return (
    <section className="relative mt-8 md:mt-[184px] lg:mt-[192px]">
      <div className="absolute inset-0 overflow-hidden">
        <Image src={SAVANNA} fittingType="fill" className="h-full w-full animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 md:min-h-[276px] md:grid-cols-2 lg:min-h-[288px] lg:py-10">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:pr-6">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            No app store needed
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Start the good life now.</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Scan the code with your phone's camera to open Nelvin, then add it to your home screen in one tap.
          </p>
          <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-100" title="Open Nelvin on your phone">
              <QRCodeSVG value={appUrl} size={80} level="M" fgColor="#0E1A3B" aria-label="QR code that opens Nelvin on your phone" />
            </div>
            <InstallAppButton />
          </div>
        </motion.div>
        <div className="hidden md:block" aria-hidden />
      </div>

      <div className="relative flex justify-center px-4 pb-10 md:hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="w-60">
          <Phone src={screenshot} className="h-[420px] w-full" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute bottom-6 right-4 hidden w-60 md:block lg:right-16 lg:w-64"
      >
        <Phone src={screenshot} className="h-[480px] w-full" />
      </motion.div>
    </section>
  );
}
