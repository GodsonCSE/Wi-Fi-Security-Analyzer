# ==========================================================
# WI-FI SECURITY ANALYZER - Dockerfile
# ==========================================================
# NOTE: A Docker container cannot access the host machine's
# physical Wi-Fi adapter. When this image runs (locally in
# Docker, or on a cloud host like Render), the app will
# automatically fall back to SIMULATION MODE. Real scanning
# only happens when running natively on Windows via run.bat.
# ==========================================================

FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Render (and most cloud hosts) inject a PORT environment variable.
# Default to 5000 for local `docker run`.
ENV PORT=5000
EXPOSE 5000

# Listen on 0.0.0.0 so the container is reachable from outside
CMD ["python", "app.py"]
