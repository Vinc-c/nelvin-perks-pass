// Native (Capacitor) shell integration. A no-op in the browser: Capacitor
// plugins are loaded only when the app runs inside the Android/iOS wrapper,
// so the web bundle does not pay for them.
import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

export async function initNative() {
  if (!isNative()) return;
  document.documentElement.classList.add("is-native", `is-${Capacitor.getPlatform()}`);
  try {
    const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
      import("@capacitor/app"),
    ]);
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (Capacitor.getPlatform() === "android") await StatusBar.setBackgroundColor({ color: "#08261D" }).catch(() => {});
    await SplashScreen.hide().catch(() => {});

    // Android back button: navigate back, exit only from the root screen.
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack || window.history.length > 1) window.history.back();
      else App.exitApp();
    });
    // Deep links (nelvinbenefits.com/... universal/app links) -> in-app route.
    App.addListener("appUrlOpen", ({ url }) => {
      try {
        const u = new URL(url);
        const path = `${u.pathname}${u.search}${u.hash}`;
        if (path && path !== "/") window.location.assign(path);
      } catch { /* ignore malformed URL */ }
    });
  } catch { /* plugin unavailable: the web app still works */ }
}
