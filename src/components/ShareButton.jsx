import React from "react";
import { MessageCircle } from "lucide-react";

/** Shares a page on WhatsApp (the main channel for word of mouth in Africa). */
export default function ShareButton({ title, path, className = "" }) {
  const url = `${window.location.origin}${path}`;
  const text = `${title} — à découvrir avec Nelvin : ${url}`;
  const share = async (e) => {
    // Native share sheet on phones (WhatsApp, SMS, Telegram...), wa.me otherwise.
    if (navigator.share) {
      e.preventDefault();
      try { await navigator.share({ title, text, url }); } catch { /* cancelled */ }
    }
  };
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={share}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-5 py-3 text-sm font-medium text-green-700 hover:bg-green-50 ${className}`}
    >
      <MessageCircle className="h-4 w-4" /> Partager sur WhatsApp
    </a>
  );
}
