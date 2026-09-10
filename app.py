"""
app.py
------
Flask backend for the Wi-Fi Security Analyzer.

Routes:
    GET /            -> serves the dashboard (templates/index.html)
    GET /api/scan    -> runs a Wi-Fi scan and returns JSON results

This app is intentionally small and beginner-friendly. All the actual
scanning / classification logic lives in wifi_scanner.py.
"""

import os

from flask import Flask, jsonify, render_template

from wifi_scanner import scan_networks

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the main dashboard page."""
    return render_template("index.html")


@app.route("/api/scan")
def api_scan():
    """
    Run a Wi-Fi scan and return the results as JSON.

    On success (even if simulation mode was used) this returns HTTP 200
    with success=True. Only unexpected server errors return HTTP 500.
    """
    try:
        result = scan_networks()
        return jsonify(result)
    except Exception as exc:  # noqa: BLE001
        # This should rarely happen since scan_networks() already
        # catches its own errors, but we guard against anything
        # unexpected so the API never crashes.
        return (
            jsonify(
                {
                    "success": False,
                    "simulation": False,
                    "networks": [],
                    "error": f"Unexpected server error: {exc}",
                }
            ),
            500,
        )


if __name__ == "__main__":
    # Render (and other cloud hosts) provide the PORT environment
    # variable. Locally, we default to 5000.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
