# WI-FI SECURITY ANALYZER

## Overview

Wi-Fi Security Analyzer is a small, beginner-friendly web dashboard that scans
Wi-Fi networks visible to your computer, shows their signal strength, and
analyzes their advertised security configuration (WPA3 / WPA2 / WPA/WPA2 /
WEP / OPEN). It flags networks that look risky so you can make more informed
decisions about which Wi-Fi networks to trust.

This is a **defensive, read-only** tool. It only reads publicly broadcast
Wi-Fi information — it never attempts to crack passwords, brute-force
anything, deauthenticate devices, attack routers, or connect automatically to
any network. See [Ethical Use](#ethical-use) below.

## Features

- 🔍 One-click Wi-Fi scan (no page reload)
- 📶 Signal strength shown in dBm (approximate) with Excellent / Good / Fair /
  Weak classification
- 🔐 Security classification: SAFE / CAUTION / HIGH RISK / RISK, with a
  plain-language reason for each network
- 📊 Live dashboard stats: networks found, secure networks, risky networks,
  strongest signal
- 🧭 Filter networks by name and sort by signal strength or security status
- 🧪 Automatic **simulation/demo mode** when real scanning isn't possible
  (e.g. inside Docker or on a cloud host), clearly labeled as demo data
- 🐳 Docker-ready and easy to deploy to Render

## Technologies

```text
Python
Flask
HTML
CSS
JavaScript
Docker
```

## Project Structure

```text
wifi-security-analyzer/
│
├── app.py
├── wifi_scanner.py
├── requirements.txt
├── Dockerfile
├── run.bat
├── .gitignore
├── README.md
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

## Requirements

- Windows 10/11 (for real Wi-Fi scanning via `netsh`)
- Python 3.9 or newer
- Wi-Fi adapter enabled and turned on

> Real scanning is currently implemented for **Windows only**. On other
> platforms, or when the real scan fails for any reason, the app
> automatically switches to simulation/demo mode instead of crashing.

## Installation

Clone the repository, then either use `run.bat` (easiest) or run it manually.

```text
git clone <YOUR_GITHUB_REPOSITORY>
cd wifi-security-analyzer
```

## Run Using run.bat

On Windows, simply double-click `run.bat`, or run it from Command Prompt:

```text
run.bat
```

This will:

1. Check that Python is installed
2. Create a virtual environment (if one doesn't already exist)
3. Activate the virtual environment
4. Install dependencies from `requirements.txt`
5. Start the Flask server at `http://127.0.0.1:5000`

## Manual Run

```text
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000` in your browser.

## Docker

Build and run the container locally:

```text
docker build -t wifi-security-analyzer .
docker run -p 5000:5000 wifi-security-analyzer
```

Then open `http://127.0.0.1:5000` in your browser.

> Note: Docker containers cannot access your host machine's physical Wi-Fi
> adapter, so the app will automatically show simulation/demo data when run
> in Docker.

## Render Deployment

```text
GitHub
   ↓
Create repository
   ↓
Push project
   ↓
Render
   ↓
New Web Service
   ↓
Deploy using Dockerfile
   ↓
Public URL
```

Steps:

1. Push this project to a new GitHub repository (see [GitHub](#github) below).
   **Push the *contents* of this folder to the repo root** — `app.py`,
   `Dockerfile`, `requirements.txt`, etc. should sit directly at the top
   level of the repo, not inside an extra subfolder. If GitHub shows
   `wifi-security-analyzer/app.py` instead of just `app.py`, you've pushed
   one level too deep.
2. In Render, click **New → Web Service**.
3. Connect your GitHub repository.
4. Render will detect the `Dockerfile` automatically — select "Docker" as the
   environment.
5. **If your repo does have the project inside a subfolder**, set Render's
   **Root Directory** setting (under the service's Settings → Build) to that
   subfolder name (e.g. `wifi-security-analyzer`) so Render's build context
   actually contains `requirements.txt` and `Dockerfile`. This is the most
   common cause of the error:
   `failed to calculate checksum of ref ...: "/requirements.txt": not found`
   — it means Render is building from a folder that doesn't directly contain
   `requirements.txt`.
6. Deploy. Render provides the `PORT` environment variable automatically; the
   app already listens on it.
7. Once deployed, your dashboard is publicly accessible at the Render URL,
   with no username/password required.

## API

### `GET /`

Serves the main HTML dashboard.

### `GET /api/scan`

Runs a Wi-Fi scan and returns JSON results.

Example response:

```json
{
  "success": true,
  "simulation": false,
  "networks": [
    {
      "ssid": "Home_WiFi",
      "signal": -42,
      "signal_percent": 84,
      "signal_quality": "Excellent",
      "security": "WPA2",
      "status": "SAFE",
      "reason": "No obvious security weakness detected from the advertised Wi-Fi security type (WPA2)."
    }
  ]
}
```

If scanning fails, the API still returns JSON (with `simulation: true` and a
`note` explaining what happened) rather than crashing.

## Security Classification

```text
WPA3              → SAFE
WPA2              → SAFE
WPA/WPA2          → CAUTION
WEP               → HIGH RISK
OPEN              → RISK
Unknown           → CAUTION
```

A **SAFE** label only means no obvious weakness was detected from the
network's *advertised* security type — it does not guarantee the network is
completely secure. Always use judgment, especially on unfamiliar networks.

## Signal Classification

```text
-30 to -50 dBm → Excellent
-51 to -60 dBm → Good
-61 to -70 dBm → Fair
Below -70 dBm  → Weak
```

Signal strength is reported in dBm, approximated from Windows' percentage
reading using `dBm ≈ (signal_percent / 2) - 100`. This is an estimate, not a
precise RF measurement.

## Important Limitation

- **Local execution** (`run.bat` or `python app.py` on your Windows laptop)
  can scan the Wi-Fi networks actually visible to *that* computer.
- **Cloud deployment** (e.g. on Render) runs on a remote server that has no
  physical Wi-Fi adapter and cannot see the networks around any visitor's
  laptop or phone. In that case, the app automatically shows clearly-labeled
  simulation/demo data instead.

```text
Local execution                      Render deployment
----------------                     ------------------
run.bat                              Browser
  ↓                                    ↓
Python Flask                         Render
  ↓                                    ↓
Local Wi-Fi adapter                  Cloud server
  ↓                                    ↓
Real nearby Wi-Fi networks           Simulation/demo data
```

## Ethical Use

This tool is intended **only** for defensive network visibility and security
awareness — for example, checking your own home or office Wi-Fi environment.

It may:

- Detect visible Wi-Fi networks
- Read publicly broadcast Wi-Fi information
- Analyze signal strength
- Analyze advertised security configuration

It must **not** be used to:

- Crack Wi-Fi passwords
- Perform brute-force attacks
- Capture passwords
- Deauthenticate users
- Attack routers
- Intercept private traffic
- Capture network packets for unauthorized purposes
- Attempt unauthorized access to any network
- Connect automatically to detected networks

Only use this tool on networks and devices you own or have explicit
permission to analyze.

## Future Improvements

- Linux support (e.g. via `nmcli` or `iwlist`)
- macOS support (e.g. via `airport` or `CoreWLAN`)
- Wi-Fi channel analysis
- Channel congestion detection
- Historical signal graphs
- Export scan results (CSV/JSON)
- Local agent + cloud dashboard architecture
- Better Wi-Fi security detection (e.g. WPA2 vs WPA2-Enterprise)

## GitHub

```text
git init
git add .
git commit -m "Initial Wi-Fi Security Analyzer project"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY>
git push -u origin main
```
