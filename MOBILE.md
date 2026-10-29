# Nelvin mobile app

Two delivery paths share the same codebase.

## 1. Installable PWA (already live)
`public/manifest.json` + `public/sw.js`. Users install from the browser
(Android: "Install app", iOS: Share → Add to Home Screen). Offline shell,
English-first offline page, maskable icon, shortcuts (Offers / Map / Wallet).

## 2. Native Android / iOS wrapper (Capacitor 7)
App id `com.nelvinbenefits.app` (`capacitor.config.json`). The native shell loads
the built web app (`dist`); `src/lib/native.js` handles status bar, splash,
Android back button and deep links, and is a no-op in the browser.

First time, on your machine:

```bash
npm install
npx cap add android      # needs Android Studio + JDK 17
npx cap add ios          # needs macOS + Xcode + CocoaPods
npm run cap:android      # build, sync and open Android Studio
npm run cap:ios          # build, sync and open Xcode
```

Re-run `npm run cap:sync` after each web change.

### Before publishing to the stores
1. **Accounts**: Google Play Console (25 USD one-off) and Apple Developer (99 USD/year).
2. **Icons and splash**: `npx @capacitor/assets generate` from a 1024×1024 icon (`public/images/nelvin-icon-512.png` is the source today; export a 1024 version).
3. **Signing**: create the Android keystore (keep it safe) / Apple certificates.
4. **Supabase Auth redirects**: add `com.nelvinbenefits.app://login-callback` to the redirect URL allow-list, and register the same URL scheme in `AndroidManifest.xml` / `Info.plist`, so email links and Google sign-in return to the app.
5. **Universal / App Links**: host `/.well-known/assetlinks.json` (Android) and `/.well-known/apple-app-site-association` (iOS) on nelvinbenefits.com for `https://nelvinbenefits.com/...` deep links.
6. **Store listing**: privacy policy URL (`/privacy`), data-safety / App Privacy forms, screenshots, and a test account for reviewers (the app requires login; Apple rejects apps whose reviewers cannot sign in).
7. **Payments**: card / mobile-money checkouts open the PSP page; Apple may require in-app-purchase rules for digital goods; check the guideline for membership subscriptions before submitting to the App Store.
