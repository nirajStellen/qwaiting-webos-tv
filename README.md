# Qwaiting Display — LG webOS TV Application

Demo **Qwaiting For Display** queue dashboard for **LG Smart TVs** (webOS). HTML5, CSS3, vanilla JavaScript, and **webOSTV.js**.

**App ID:** `com.demo.helloworld`  
**Version:** `1.1.1`

---

## Test URLs

| Environment | URL |
|-------------|-----|
| **GitHub Pages (browser test)** | https://nirajStellen.github.io/qwaiting-webos-tv/ |
| **GitHub repo** | https://github.com/nirajStellen/qwaiting-webos-tv |
| **Actions (download .ipk)** | https://github.com/nirajStellen/qwaiting-webos-tv/actions |
| **Local preview** | `npm start` → http://localhost:8765 |

### Enable GitHub Pages (one-time)

1. Open https://github.com/nirajStellen/qwaiting-webos-tv/settings/pages  
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**  
3. Re-run workflow: **Actions** → **Deploy test preview** → **Run workflow**

After ~1 minute the live test URL will work: **https://nirajStellen.github.io/qwaiting-webos-tv/**

> GitHub Pages is for **browser/UI testing** only. Install the `.ipk` on an LG TV for full remote + webOS APIs.

---

## Features

- TV-optimized full-screen UI (1920×1080 safe area)
- Live clock updating every second
- Animated welcome text
- Device information (TV model, webOS version, screen resolution)
- Full remote control support (OK, Back, Arrow keys)
- Focus-based navigation demo
- Double-press BACK to exit
- App lifecycle logging (`onLaunch`, `onPause`, `onResume`, `onClose`)

---

## Project Structure

```
hello-world-webos/
│
├── appinfo.json              # App metadata (required for packaging)
├── index.html                # Main entry page
├── icon.png                  # App icon (130×130, required)
├── largeIcon.png             # Large icon (400×400, required)
├── css/
│   └── style.css             # TV-optimized styles
├── js/
│   └── app.js                # Application logic
├── assets/
│   └── logo.png              # In-app logo
├── webOSTVjs-1.2.12/
│   ├── webOSTV.js            # LG webOS TV library
│   └── webOSTV-dev.js        # Dev extensions
└── README.md
```

---

## Prerequisites (macOS)

### 1. Install Node.js

Download and install from [https://nodejs.org](https://nodejs.org) (LTS recommended).

Verify:

```bash
node --version
npm --version
```

### 2. Install webOS CLI

```bash
npm install -g @webos-tools/cli
```

Verify:

```bash
ares --version
```

### 3. Install VS Code (recommended)

Download from [https://code.visualstudio.com](https://code.visualstudio.com)

Useful extensions:

- **webOS TV** (LG official)
- **Live Server** (for quick browser preview — limited, not a TV substitute)

---

## LG TV Developer Mode Setup

Before installing apps on a physical TV, enable Developer Mode:

### Step 1 — Install Developer Mode App

1. On your LG TV, open the **LG Content Store**.
2. Search for **Developer Mode**.
3. Install the **Developer Mode** app.

### Step 2 — Enable Developer Mode

1. Launch **Developer Mode** on the TV.
2. Sign in with your LG Developer account ([https://webostv.developer.lge.com](https://webostv.developer.lge.com)).
3. Toggle **Dev Mode Status** to **ON**.
4. The TV will reboot.

### Step 3 — Enable Key Server

1. After reboot, open **Developer Mode** again.
2. Enable **Key Server** (required for `ares-install` and `ares-inspect`).
3. Note the **Passphrase** shown on screen — you will need it when adding the device.

### Step 4 — Get TV IP Address

1. On the TV: **Settings → Network → Wi-Fi Connection** (or Wired).
2. Note the **IP Address** (e.g. `192.168.1.100`).

### Step 5 — Connect from Mac

```bash
ares-setup-device
```

Follow the prompts:

| Prompt | Example Value |
|--------|---------------|
| Device name | `my-lg-tv` |
| Host | `192.168.1.100` |
| Port | `9922` |
| Username | `prisoner` |
| Password | *(passphrase from Developer Mode app)* |
| Private key | *(press Enter for default)* |

List configured devices:

```bash
ares-setup-device --list
```

Test connection:

```bash
ares-device-info --device my-lg-tv
```

---

## Build & Package (.ipk)

Navigate to the project root:

```bash
cd hello-world-webos
```

Package the app:

```bash
ares-package .
```

This generates:

```
com.demo.helloworld_1.0.0_all.ipk
```

> **Note:** `ares-package` validates `appinfo.json`, `icon.png`, `largeIcon.png`, and `index.html` exist before packaging.

---

## Install on TV

### Install the .ipk

```bash
ares-install --device my-lg-tv com.demo.helloworld_1.0.0_all.ipk
```

Or install directly from source (without creating .ipk first):

```bash
ares-install --device my-lg-tv .
```

### Launch the App

```bash
ares-launch --device my-lg-tv com.demo.helloworld
```

### Close the App

```bash
ares-launch --device my-lg-tv --close com.demo.helloworld
```

### Uninstall

```bash
ares-install --device my-lg-tv --remove com.demo.helloworld
```

---

## Debugging

### Inspect (Chrome DevTools)

Opens a remote debugging session in Chrome:

```bash
ares-inspect --device my-lg-tv --app com.demo.helloworld
```

A Chrome window opens with DevTools connected to the running app. Use the **Console** tab to see lifecycle logs.

### View Logs

Stream app/system logs from the TV:

```bash
ares-log --device my-lg-tv
```

Filter for your app:

```bash
ares-log --device my-lg-tv | grep -i helloworld
```

### Launch with Logging

```bash
ares-launch --device my-lg-tv com.demo.helloworld
ares-log --device my-lg-tv
```

---

## Remote Control Reference

| Key | Key Code | Action in App |
|-----|----------|---------------|
| OK / Enter | 13 | Activate focused nav item |
| Back | 461 (or 27) | Press twice to exit |
| Left | 37 | Move focus left |
| Right | 39 | Move focus right |
| Up | 38 | Reserved |
| Down | 40 | Reserved |

Pressed keys are displayed on screen as e.g. `Pressed Key: ENTER`.

---

## Lifecycle Events

The app logs these events to the TV console (visible via `ares-inspect` or `ares-log`):

| Event | Trigger |
|-------|---------|
| `onLaunch` | App starts (`webOSLaunch`) |
| `onPause` | App hidden (`visibilitychange`) |
| `onResume` | App visible again |
| `onClose` | App terminating (`beforeunload`) |

---

## Emulator (Optional)

LG provides a webOS TV Emulator via the [webOS TV SDK](https://webostv.developer.lge.com/develop/tools/sdk-introduction).

```bash
# After SDK install
ares-launch --device emulator com.demo.helloworld
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ares-package` fails — missing icon | Ensure `icon.png` and `largeIcon.png` exist in project root |
| Cannot connect to TV | Verify TV and Mac are on the same network; re-check IP and passphrase |
| Key Server error | Re-enable Key Server in Developer Mode app |
| App not visible on TV | Launch via `ares-launch` or find it in the TV app list |
| Device info shows N/A | Normal in browser; real values appear on physical TV or emulator |
| Back button doesn't exit | Press BACK twice within 2 seconds |

---

## webOS Version Compatibility

Tested and compatible with:

- webOS TV 5.0+
- webOS 22 / 23 / 24 / 25 / 26

Uses `webOSTV.js` v1.2.12 with `webOSSystem` (webOS 5.0+) and `PalmSystem` fallback.

---

## License

Demo application — free to use and modify for learning and development.

---

## Quick Command Reference

```bash
# Setup
npm install -g @webos-tools/cli
ares-setup-device

# Build
cd hello-world-webos
ares-package .

# Deploy
ares-install --device my-lg-tv com.demo.helloworld_1.0.0_all.ipk
ares-launch --device my-lg-tv com.demo.helloworld

# Debug
ares-inspect --device my-lg-tv --app com.demo.helloworld
ares-log --device my-lg-tv
```
