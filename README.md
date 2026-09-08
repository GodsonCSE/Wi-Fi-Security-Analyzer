# 📡 Wi-Fi Security Analyzer

A beginner-friendly cybersecurity project that scans nearby Wi-Fi networks, analyzes their signal strength and security type, and identifies potentially risky networks through a simple web-based dashboard.

## 🚀 Features

* 📡 Scan nearby Wi-Fi networks
* 📶 Display signal strength in dBm
* 🔐 Detect Wi-Fi security type such as WPA2, WPA3, WEP, and OPEN
* 🛡️ Classify networks as SAFE, CAUTION, or RISK
* 📊 Display network statistics
* 🔄 Dynamic scanning without page refresh
* 💻 Windows Wi-Fi scanning using `netsh`
* 🎭 Simulation mode when real scanning is unavailable
* 🌐 Web dashboard using Flask
* 🐳 Docker support
* ☁️ Ready for Render deployment
* ▶️ Easy Windows startup using `run.bat`

---

## 🖥️ Dashboard

Example:

```text
              WI-FI SECURITY ANALYZER

     Scan nearby Wi-Fi networks and analyze
       their signal strength and security.

                 [ 🔍 SCAN WI-FI ]

 Networks Found: 4     Secure: 2     Risky: 2

 Network       Signal       Security       Status
 ------------------------------------------------------
 Home_WiFi     -42 dBm     WPA2           SAFE
 JioFiber      -58 dBm     WPA3           SAFE
 Guest_WiFi    -75 dBm     OPEN           ⚠️ RISK
 Unknown       -82 dBm     OPEN           ⚠️ RISK
```

---

## 🛠️ Technologies Used

* **Python**
* **Flask**
* **HTML5**
* **CSS3**
* **JavaScript**
* **Docker**
* **Windows `netsh`**

---

## 📁 Project Structure

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

---

## ⚙️ Requirements

For local execution on Windows:

* Python 3.10+
* Wi-Fi adapter
* Windows operating system
* Internet connection for installing Python dependencies

Check Python:

```bash
python --version
```

---

## ▶️ Run the Project Easily

The easiest way to start the project on Windows is:

```bash
run.bat
```

The script automatically:

1. Checks for Python.
2. Creates a virtual environment.
3. Activates the virtual environment.
4. Installs required dependencies.
5. Starts the Flask server.

Then open:

```text
http://127.0.0.1:5000
```

---

## 🔧 Manual Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY>
cd wifi-security-analyzer
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the application:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

---

## 📡 How Wi-Fi Scanning Works

On Windows, the project uses:

```bash
netsh wlan show networks mode=bssid
```

The Python backend processes the command output and extracts information such as:

* SSID
* Signal percentage
* Security/authentication type
* Encryption information when available

The application then analyzes the information and displays the results on the dashboard.

---

## 📶 Signal Strength

Windows commonly provides signal strength as a percentage. The project converts it to an approximate dBm value.

Approximate classification:

| Signal         | Quality   |
| -------------- | --------- |
| -30 to -50 dBm | Excellent |
| -51 to -60 dBm | Good      |
| -61 to -70 dBm | Fair      |
| Below -70 dBm  | Weak      |

The dBm conversion is an approximation and should not be considered a precise measurement.

---

## 🔐 Security Analysis

The project analyzes the advertised Wi-Fi security configuration.

| Security | Status       |
| -------- | ------------ |
| WPA3     | 🟢 SAFE      |
| WPA2     | 🟢 SAFE      |
| WPA/WPA2 | 🟡 CAUTION   |
| WEP      | 🔴 HIGH RISK |
| OPEN     | ⚠️ RISK      |
| Unknown  | 🟡 CAUTION   |

**Note:** SAFE means that no obvious weakness was detected from the advertised security type. It does not guarantee that the network itself is completely secure.

---

## 🎭 Simulation Mode

Real Wi-Fi scanning depends on the operating system, Wi-Fi adapter, permissions, and execution environment.

When real scanning is unavailable, the application can use demonstration data such as:

```text
Home_WiFi     -42 dBm    WPA2    SAFE
JioFiber      -58 dBm    WPA3    SAFE
Guest_WiFi    -75 dBm    OPEN    ⚠️ RISK
Unknown       -82 dBm    OPEN    ⚠️ RISK
```

The dashboard clearly indicates when **Simulation/Demo Mode** is active.

Simulated networks are never presented as real detected networks.

---

## 🌐 API

### Get Dashboard

```text
GET /
```

Returns the web dashboard.

### Scan Wi-Fi Networks

```text
GET /api/scan
```

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
      "status": "SAFE"
    }
  ]
}
```

---

## 🐳 Docker

Build the Docker image:

```bash
docker build -t wifi-security-analyzer .
```

Run it:

```bash
docker run -p 5000:5000 wifi-security-analyzer
```

Open:

```text
http://localhost:5000
```

The application listens on `0.0.0.0` and supports the `PORT` environment variable for cloud deployment.

---

## ☁️ Render Deployment

This project includes a `Dockerfile`, making it suitable for deployment on Render.

General deployment process:

```text
GitHub Repository
        ↓
      Render
        ↓
   Dockerfile
        ↓
   Web Service
        ↓
   Public URL
```

### Important limitation

A cloud server cannot access the Wi-Fi adapter of every visitor's computer.

Therefore:

**Local execution:**

```text
Your Computer
     ↓
Python + Flask
     ↓
Wi-Fi Adapter
     ↓
Nearby Wi-Fi Networks
```

**Cloud deployment:**

```text
User Browser
     ↓
Render Server
     ↓
Simulation/Demo Mode
```

The Render version is therefore intended primarily for demonstrating the web application unless a separate local scanning agent is added.

---

## 🛡️ Security & Ethical Use

This project is designed for **defensive cybersecurity and network awareness**.

It only analyzes publicly visible Wi-Fi information.

It does **not**:

* Crack Wi-Fi passwords
* Perform brute-force attacks
* Capture Wi-Fi passwords
* Deauthenticate devices
* Attack routers
* Intercept private traffic
* Attempt unauthorized access
* Automatically connect to networks

Only use the project on systems and networks you are authorized to analyze.

---

## 🔮 Future Improvements

Possible future features:

* 📊 Wi-Fi signal history graphs
* 📡 Wi-Fi channel analysis
* 🚦 Channel congestion detection
* 🐧 Linux support
* 🍎 macOS support
* 📄 Export scan results
* 📈 Historical network monitoring
* 🔔 Security alerts
* 🖥️ Local scanning agent
* 🌐 Local agent + cloud dashboard

---

## 👨‍💻 Project Purpose

The **Wi-Fi Security Analyzer** was developed as a beginner-friendly cybersecurity project to demonstrate:

* Python programming
* Network information gathering
* Wi-Fi security analysis
* Flask web development
* Frontend development
* REST API usage
* Docker containerization
* Cloud deployment

---

## 📜 License

This project is intended for educational and defensive cybersecurity purposes.
