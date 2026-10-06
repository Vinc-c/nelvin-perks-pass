import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updateMe } from "@/api/auth";

/**
 * The user's preferred display currency (stored on their profile as
 * wallet_currency). Amounts are always stored in USD; this only changes how
 * they are shown and the default currency proposed for payments.
 */
export function useDisplayCurrency() {
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState(user?.wallet_currency || "USD");

  useEffect(() => {
    if (user?.wallet_currency) setCode(user.wallet_currency);
  }, [user?.wallet_currency]);

  const change = useCallback(
    (next) => {
      setCode(next);
      if (user && next !== user.wallet_currency) {
        updateMe({ wallet_currency: next }).then(() => refreshUser()).catch(() => {});
      }
    },
    [user, refreshUser]
  );

  return [code, change];
}
