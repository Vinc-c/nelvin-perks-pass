import { useEffect, useState } from "react";
import { entities } from "@/api/entities";

// Every balance in the platform is stored in USD. Rates (units per USD) are
// managed by super admins in Admin → Devises; these defaults only cover the
// first paint or an offline load.
export const DEFAULT_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", rate_per_usd: 1 },
  { code: "EUR", name: "Euro", symbol: "€", rate_per_usd: 0.92 },
  { code: "XOF", name: "Franc CFA (BCEAO)", symbol: "CFA", rate_per_usd: 605 },
  { code: "XAF", name: "Franc CFA (BEAC)", symbol: "FCFA", rate_per_usd: 605 },
  { code: "NGN", name: "Naira nigérian", symbol: "₦", rate_per_usd: 1580 },
  { code: "KES", name: "Shilling kényan", symbol: "KSh", rate_per_usd: 128 },
  { code: "EGP", name: "Livre égyptienne", symbol: "E£", rate_per_usd: 48 },
  { code: "AED", name: "Dirham des EAU", symbol: "AED", rate_per_usd: 3.67 },
];

let cache = null;
let inflight = null;
const listeners = new Set();

export function loadCurrencies(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = entities.Currency.filter({ active: true }, "sort_order")
      .then((rows) => {
        cache = rows.length ? rows : DEFAULT_CURRENCIES;
        listeners.forEach((fn) => fn(cache));
        return cache;
      })
      .catch(() => cache || DEFAULT_CURRENCIES)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

const NO_DECIMALS = new Set(["XOF", "XAF", "NGN", "KES", "UGX", "RWF", "TZS"]);

export function makeMoney(list) {
  const byCode = new Map(list.map((c) => [c.code, c]));
  const get = (code) => byCode.get(code) || byCode.get("USD") || DEFAULT_CURRENCIES[0];
  const fromUsd = (usd, code) => Number(usd || 0) * Number(get(code).rate_per_usd || 1);
  const toUsd = (amount, code) => Number(amount || 0) / Number(get(code).rate_per_usd || 1);
  const format = (usd, code = "USD") => {
    const c = get(code);
    const v = fromUsd(usd, c.code);
    const digits = NO_DECIMALS.has(c.code) ? 0 : 2;
    const n = v.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return c.symbol.length > 1 ? `${n} ${c.symbol}` : `${c.symbol}${n}`;
  };
  /** Formats an amount already expressed in `code` (no conversion). */
  const formatIn = (amount, code = "USD") => {
    const c = get(code);
    const digits = NO_DECIMALS.has(c.code) ? 0 : 2;
    const n = Number(amount || 0).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return c.symbol.length > 1 ? `${n} ${c.symbol}` : `${c.symbol}${n}`;
  };
  return { currencies: list, get, fromUsd, toUsd, format, formatIn };
}

/** Currencies + converters. `format(usd, code)` renders a USD amount in `code`. */
export function useCurrencies() {
  const [list, setList] = useState(cache || DEFAULT_CURRENCIES);
  useEffect(() => {
    listeners.add(setList);
    loadCurrencies().then(setList);
    return () => listeners.delete(setList);
  }, []);
  return makeMoney(list);
}
