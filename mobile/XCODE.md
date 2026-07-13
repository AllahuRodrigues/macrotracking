# Install MacroTrack on your iPhone with Xcode (no $99 Apple Developer needed)

Your phone: **Rodrigues Iphone**  
Signing: free **Personal Team** for `allahu.rodrigues@icloud.com`  
App expires every **7 days** — reopen Xcode and press Run to renew.

---

## One-time Mac setup (do this once)

In Terminal:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

Enter your Mac password when asked.

---

## Install / update the app (every time, or every 7 days)

### 1. Unlock your iPhone and plug it into the Mac
- Trust This Computer if asked
- Keep the phone unlocked

### 2. Open the project in Xcode

```bash
cd /Users/allahurodrigues/Desktop/Desktop/My-Desk/PROJECT/macro-tracking/mobile
open ios/MacroTrack.xcworkspace
```

**Use `.xcworkspace`, not `.xcodeproj`.**

### 3. Sign with your Personal Team (not Vault Kinetics)

1. In the left sidebar, click the blue **MacroTrack** project
2. Select the **MacroTrack** target
3. Open the **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. **Team** → pick **Allahurodrigues (Personal Team)** / your iCloud  
   - **Do NOT** pick **Vault Kinetics Inc.**
6. Bundle Identifier should be: `com.rodrigues.macrotrack`  
   - If Xcode says the ID is taken, change it to something unique like:  
     `com.allahu.macrotrack`

### 4. Select your phone and Run

1. Top toolbar device menu → **Rodrigues Iphone**
2. Press the **▶ Play** button (or `Cmd + R`)
3. Wait for build + install (first time: several minutes)

### 5. Trust the developer on your iPhone (first time only)

If the app icon appears but won’t open:

1. iPhone → **Settings → General → VPN & Device Management**  
   (or **Device Management**)
2. Under **Developer App**, tap your Apple ID / email
3. Tap **Trust** → **Trust**
4. Open **MacroTrack** again

### 6. Sign in inside the app

- Rodrigues → code **`2003`**
- Uses live data from `https://macrotracking-coral.vercel.app`
- **No Mac terminal needed** while you use the app

---

## Important limits (free Apple ID)

| Thing | Reality |
|-------|---------|
| Works with Mac off? | **Yes** — app is installed on the phone |
| How long? | **~7 days**, then it won’t launch |
| Fix when it expires | Plug phone in → Xcode → ▶ Run again |
| App Store / TestFlight? | No — needs paid Apple Developer ($99/yr) |

---

## Use the app with Mac / Terminal OFF (Release build)

**Debug** (default ▶ Run) needs Metro on your Mac (`npx expo start`) — phone talks to `laptop:8081`.

**Release** embeds the JavaScript inside the app. After install you can quit Terminal, sleep the Mac, leave home Wi‑Fi — the app still works (API calls go to Vercel on the internet).

### Option A — Xcode (easiest)

1. Menu **Product → Scheme → Edit Scheme…**
2. Left: **Run**
3. **Build Configuration** → change **Debug** to **Release**
4. Close → unlock phone → ▶ **Run**
5. Wait for install. Then you can quit Terminal / close the laptop.

To develop again later, switch Build Configuration back to **Debug** and start Metro.

### Option B — Terminal

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
cd /Users/allahurodrigues/Desktop/Desktop/My-Desk/PROJECT/macro-tracking/mobile
npx expo run:ios --device "Rodrigues Iphone" --configuration Release
```

No Metro needed after that install finishes.

### Still true on free Apple ID

- App still expires ~**7 days** — plug in and ▶ Run again (Release) to renew
- Phone needs **internet** for logging meals/body (talks to Vercel), but **not** your laptop

---

## Rebuild from Terminal (Debug — needs Metro)

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
cd /Users/allahurodrigues/Desktop/Desktop/My-Desk/PROJECT/macro-tracking/mobile
# Terminal 1:
npx expo start --dev-client --lan
# Terminal 2 (or Xcode ▶ Run):
npx expo run:ios --device "Rodrigues Iphone"
```

---

## If build fails

| Error | Fix |
|-------|-----|
| Vault Kinetics / 403 | Team must be **Personal Team**, not Vault |
| Untrusted developer | Settings → VPN & Device Management → Trust |
| Bundle ID unavailable | Change to `com.allahu.macrotrack` |
| codesign / keychain popup | Click **Always Allow** on the Mac |
| Phone not listed | Unlock phone, unplug/replug USB, trust computer |
| Cannot find native module ExpoPushTokenManager | Notifications were added in JS but not in the binary. Run `npx expo prebuild --clean`, then Xcode ▶ Run again |
| Personal Team / Push Notifications / aps-environment | Free Apple IDs **cannot** use remote Push. MacroTrack only needs **local** reminders. Remove **Push Notifications** capability in Xcode if it appears (Signing & Capabilities → −), and keep `plugins/withLocalNotificationsOnly.js` so prebuild does not re-add `aps-environment`. |
