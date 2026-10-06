import React from "react";
import CheckoutModal from "@/components/CheckoutModal";

/** Wallet top-up through the PSP router (see CheckoutModal). */
export default function RechargeWalletModal({ open, onClose }) {
  return <CheckoutModal open={open} onClose={onClose} purpose="RECHARGE" />;
}
