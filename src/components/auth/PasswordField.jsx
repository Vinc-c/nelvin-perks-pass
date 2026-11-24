import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/I18nContext";

/** 0-4 score: length, upper+lower, digit, symbol. Display only: the server rule stays the source of truth. */
export function passwordScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return pw.length < 8 ? Math.min(s, 1) : s;
}
const LEVELS = [["auth.pw.weak", "bg-rose-500"], ["auth.pw.weak", "bg-rose-500"], ["auth.pw.fair", "bg-amber-500"], ["auth.pw.good", "bg-[#65a30d]"], ["auth.pw.strong", "bg-[#16a34a]"]];

/** Password input with show/hide, Caps Lock warning and an optional strength meter. */
export default function PasswordField({ id, value, onChange, autoComplete = "current-password", autoFocus, showStrength = false, onBlur, invalid = false }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const score = passwordScore(value);
  const [labelKey, color] = LEVELS[score];
  return (
    <div>
      <div className="relative">
        <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input id={id} type={shown ? "text" : "password"} autoComplete={autoComplete} autoFocus={autoFocus} placeholder="••••••••" value={value}
          onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
          onKeyUp={(e) => setCaps(!!e.getModifierState?.("CapsLock"))} onKeyDown={(e) => setCaps(!!e.getModifierState?.("CapsLock"))}
          aria-invalid={invalid || undefined} aria-describedby={`${id}-hint`} className="h-12 ps-10 pe-11" required />
        <button type="button" onClick={() => setShown((v) => !v)} aria-pressed={shown} aria-label={shown ? t("auth.hide") : t("auth.show")}
          className="nv-focus absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-slate-100 hover:text-foreground">
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div id={`${id}-hint`} aria-live="polite">
        {caps && <p className="mt-1.5 text-xs font-medium text-amber-600">{t("auth.caps")}</p>}
        {showStrength && value && (
          <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${score >= n ? color : "bg-slate-200"}`} />)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t(labelKey)} · {t("auth.pw.hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
