import { useEffect } from "react";

/**
 * Global Escape key for hand-built modals: closes the topmost overlay marked with
 * data-modal-overlay by triggering its own close handler (the overlay click).
 */
export default function useModalEscape() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const overlays = document.querySelectorAll("[data-modal-overlay]");
      const top = overlays[overlays.length - 1];
      if (top) top.click();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
