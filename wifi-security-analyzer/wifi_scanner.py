"""
wifi_scanner.py
----------------
Beginner-friendly Wi-Fi scanning module for the Wi-Fi Security Analyzer.

This module is STRICTLY DEFENSIVE. It only reads publicly broadcast
Wi-Fi information (SSID, signal strength, advertised security type)
using the operating system's own network tools. It never attempts to:
    - crack passwords
    - brute-force anything
    - deauthenticate devices
    - connect to any network
    - capture or inspect network traffic

On Windows, it uses the built-in command:
    netsh wlan show networks mode=bssid

On any other platform (Linux, macOS, or inside Docker/cloud where there
is no real Wi-Fi adapter), it automatically falls back to SIMULATION
MODE using clearly-labeled sample data.
"""

import platform
import re
import subprocess


# ---------------------------------------------------------------------------
# Sample / simulation data
# ---------------------------------------------------------------------------
# Used whenever real scanning is not possible (wrong OS, no adapter,
# running inside Docker, running on a cloud host like Render, etc).
SIMULATED_NETWORKS = [
    {"ssid": "Home_WiFi", "signal_percent": 84, "security": "WPA2"},
    {"ssid": "JioFiber", "signal_percent": 58, "security": "WPA3"},
    {"ssid": "Guest_WiFi", "signal_percent": 50, "security": "OPEN"},
    {"ssid": "Unknown", "signal_percent": 36, "security": "OPEN"},
]


# ---------------------------------------------------------------------------
# Signal helpers
# ---------------------------------------------------------------------------
def percent_to_dbm(signal_percent: int) -> int:
    """
    Convert a Windows-style signal percentage (0-100) into an
    APPROXIMATE dBm value.

    Windows does not report real dBm values through netsh, only a
    percentage. This formula is a common, simple approximation:

        dBm ≈ (signal_percent / 2) - 100

    This is NOT a precise measurement, just a reasonable estimate
    for display purposes.
    """
    return round((signal_percent / 2) - 100)


def classify_signal(dbm: int) -> str:
    """Classify signal strength (in dBm) into a human-friendly label."""
    if dbm >= -50:
        return "Excellent"
    elif dbm >= -60:
        return "Good"
    elif dbm >= -70:
        return "Fair"
    else:
        return "Weak"


# ---------------------------------------------------------------------------
# Security classification
# ---------------------------------------------------------------------------
def classify_security(security_type: str):
    """
    Classify the advertised Wi-Fi security/authentication type.

    Returns a tuple of (status, reason) where status is one of:
        SAFE, CAUTION, HIGH RISK, RISK

    IMPORTANT: A "SAFE" label only means no obvious weakness was
    detected from the advertised security type. It does NOT guarantee
    the network is completely secure.
    """
    security_type = (security_type or "").upper().strip()

    if "WPA3" in security_type:
        return "SAFE", (
            "No obvious security weakness detected from the advertised "
            "Wi-Fi security type (WPA3)."
        )
    if "WPA2" in security_type and "WPA/WPA2" not in security_type:
        return "SAFE", (
            "No obvious security weakness detected from the advertised "
            "Wi-Fi security type (WPA2)."
        )
    if "WPA/WPA2" in security_type or ("WPA" in security_type and "WPA2" in security_type):
        return "CAUTION", (
            "This network advertises mixed WPA/WPA2 support. Older WPA "
            "encryption is weaker than WPA2/WPA3. Prefer networks that "
            "use WPA2 or WPA3 only."
        )
    if "WEP" in security_type:
        return "HIGH RISK", (
            "WEP encryption is outdated and can be broken quickly with "
            "widely available tools. Avoid connecting to WEP networks."
        )
    if security_type in ("OPEN", "NONE", ""):
        return "RISK", (
            "OPEN network: No wireless authentication/encryption "
            "detected. Avoid transmitting sensitive information over "
            "unsecured Wi-Fi."
        )

    # Anything else we don't recognize
    return "CAUTION", (
        "The advertised security type could not be clearly identified. "
        "Treat this network with caution until its security is confirmed."
    )


# ---------------------------------------------------------------------------
# Building a single network result
# ---------------------------------------------------------------------------
def build_network_entry(ssid: str, signal_percent: int, security_type: str) -> dict:
    """Combine raw scan data into the final JSON-friendly network entry."""
    dbm = percent_to_dbm(signal_percent)
    status, reason = classify_security(security_type)

    return {
        "ssid": ssid or "(hidden network)",
        "signal": dbm,
        "signal_percent": signal_percent,
        "signal_quality": classify_signal(dbm),
        "security": security_type or "Unknown",
        "status": status,
        "reason": reason,
    }


# ---------------------------------------------------------------------------
# Windows scanning (real hardware)
# ---------------------------------------------------------------------------
def scan_windows():
    """
    Run `netsh wlan show networks mode=bssid` on Windows and parse the
    output into a list of network entries.

    Returns a list of dicts, or raises RuntimeError if scanning fails.
    """
    try:
        result = subprocess.run(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except FileNotFoundError:
        raise RuntimeError("The 'netsh' command was not found on this system.")
    except subprocess.TimeoutExpired:
        raise RuntimeError("Wi-Fi scan timed out.")

    if result.returncode != 0:
        raise RuntimeError(
            "netsh returned an error. Make sure Wi-Fi is turned on and "
            "you are running with sufficient permissions."
        )

    return parse_netsh_output(result.stdout)


def parse_netsh_output(output: str):
    """
    Parse the raw text output of:
        netsh wlan show networks mode=bssid

    Typical block looks like:

        SSID 1 : Home_WiFi
            Network type            : Infrastructure
            Authentication          : WPA2-Personal
            Encryption              : CCMP
            BSSID 1                 : xx:xx:xx:xx:xx:xx
                 Signal             : 84%
                 ...
    """
    networks = []

    current_ssid = None
    current_security = None
    current_signal = None

    ssid_re = re.compile(r"^SSID\s+\d+\s*:\s*(.*)$")
    auth_re = re.compile(r"^Authentication\s*:\s*(.*)$")
    signal_re = re.compile(r"^Signal\s*:\s*(\d+)%$")

    def flush_current():
        if current_ssid is not None and current_signal is not None:
            networks.append(
                build_network_entry(
                    current_ssid,
                    current_signal,
                    normalize_auth_string(current_security or "Unknown"),
                )
            )

    for raw_line in output.splitlines():
        line = raw_line.strip()

        ssid_match = ssid_re.match(line)
        if ssid_match:
            # New SSID block starting -> flush the previous one first
            flush_current()
            current_ssid = ssid_match.group(1).strip()
            current_security = None
            current_signal = None
            continue

        auth_match = auth_re.match(line)
        if auth_match and current_security is None:
            current_security = auth_match.group(1).strip()
            continue

        signal_match = signal_re.match(line)
        if signal_match and current_signal is None:
            current_signal = int(signal_match.group(1))
            continue

    # Flush the last block
    flush_current()

    return networks


def normalize_auth_string(auth: str) -> str:
    """
    Map netsh's authentication strings (e.g. 'WPA2-Personal',
    'Open', 'WPA3-SAE') into simpler labels used by classify_security().
    """
    auth_upper = auth.upper()

    if "WPA3" in auth_upper:
        return "WPA3"
    if "WPA2" in auth_upper and "WPA3" not in auth_upper and "WPA/WPA2" not in auth_upper:
        # Could still be a mixed mode string, check explicitly
        if "WPA-" in auth_upper or "WPA/" in auth_upper:
            return "WPA/WPA2"
        return "WPA2"
    if "WPA/WPA2" in auth_upper or ("WPA" in auth_upper and "WPA2" in auth_upper):
        return "WPA/WPA2"
    if "WEP" in auth_upper:
        return "WEP"
    if "OPEN" in auth_upper:
        return "OPEN"

    return auth or "Unknown"


# ---------------------------------------------------------------------------
# Simulation scanning (Docker / cloud / unsupported OS)
# ---------------------------------------------------------------------------
def scan_simulation():
    """Return sample/demo data, clearly not real."""
    return [
        build_network_entry(net["ssid"], net["signal_percent"], net["security"])
        for net in SIMULATED_NETWORKS
    ]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def scan_networks():
    """
    Main entry point used by the Flask app.

    Returns a dict:
        {
            "success": bool,
            "simulation": bool,
            "networks": [...],
            "error": str (only present if success is False)
        }

    Automatically decides between real Windows scanning and simulation
    mode based on the current operating system and whether the real
    scan succeeds.
    """
    system = platform.system()

    if system == "Windows":
        try:
            networks = scan_windows()
            if not networks:
                # Command worked but found nothing -> fall back to demo
                return {
                    "success": True,
                    "simulation": True,
                    "networks": scan_simulation(),
                    "note": "No real networks were found, showing demo data.",
                }
            return {
                "success": True,
                "simulation": False,
                "networks": networks,
            }
        except Exception as exc:  # noqa: BLE001 - we want a friendly fallback
            # Real scanning failed (permissions, no adapter, etc.)
            # Fall back to simulation mode instead of crashing.
            return {
                "success": True,
                "simulation": True,
                "networks": scan_simulation(),
                "note": f"Real Wi-Fi scan failed ({exc}). Showing demo data instead.",
            }
    else:
        # Non-Windows platform (Linux/macOS/Docker/cloud) -> simulation only
        return {
            "success": True,
            "simulation": True,
            "networks": scan_simulation(),
            "note": (
                "Real Wi-Fi scanning is only implemented for Windows "
                "(via netsh) in this version. Showing demo data."
            ),
        }
