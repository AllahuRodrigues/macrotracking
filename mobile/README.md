# MacroTrack — iOS (Expo)

The native companion to the MacroTrack web app. It talks to the **same Supabase
data** through the deployed Next.js API, so meals, workouts, body metrics,
supplements and photos stay perfectly in sync between web and phone.

- **Framework:** Expo (SDK 54) + Expo Router + React Native
- **Data:** the existing `/api/*` routes on `https://macrotracking-coral.vercel.app`
- **Shared code:** types, timezone, workout program and InBody data are imported
  directly from `../src/lib` (via the `@shared/*` alias) so web and mobile never drift.
- **Auth:** the same access code as web (`2003`) — sent as the `x-macro-access-code`
  header and stored securely on-device with `expo-secure-store`.

## 1. Install

```bash
cd mobile
npm install
npx expo install --fix   # aligns all native deps to the installed Expo SDK
```

## 2. Run on your iPhone 13 Pro (fastest path — Expo Go / dev client)

```bash
npx expo start
```

Then scan the QR code with the Camera app. It connects to the **production API**
by default, so you can use real data immediately.

To point at a local Next.js server instead, create `mobile/.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://<your-computer-LAN-ip>:3000
```

## 3. Ship to TestFlight

You need a free [Expo account](https://expo.dev) and an Apple Developer account.

```bash
npm install -g eas-cli
eas login

# One-time: create the EAS project (writes the projectId into app.json)
eas init

# Build a signed .ipa in the cloud
eas build --platform ios --profile production

# Upload the finished build to App Store Connect → TestFlight
eas submit --platform ios --latest
```

Before submitting, fill in the placeholders in **`eas.json`** (`appleId`,
`ascAppId`, `appleTeamId`) and the `projectId` in **`app.json`**. EAS handles the
signing certificates and provisioning profiles for you.

Once the build shows up in TestFlight, install **TestFlight** from the App Store
on your iPhone and accept the invite — you'll get every new build automatically.

## Features

- Dashboard with macro rings, training/rest goal switch, and quick water logging
- Meals: add/delete food entries per day, grouped by meal
- Workout: today's session, full weekly program, and history
- Supplements: daily checklist with one-tap toggles
- Body: latest metrics, full InBody 580 report, EGYM strength, and journey to Aug 1
- Photos: browse and capture progress pictures straight from the camera
- Stats: 30-day calorie, protein and weight charts
- Profile: **one-tap full data export** (JSON) via the iOS share sheet

## Project layout

```
mobile/
  app/                 # expo-router screens
    _layout.tsx        # providers (React Query, Auth, SafeArea)
    index.tsx          # boot → gate or tabs
    gate.tsx           # access-code screen
    (tabs)/            # the 8 main tabs
  src/
    api/               # typed API client + React Query hooks
    components/         # UI kit, rings, date nav
    lib/               # config, theme, auth, image URLs
  metro.config.js      # watches ../src/lib for shared code
```
