# ── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Dependencies zuerst (besseres Layer-Caching)
COPY package.json ./
RUN npm install --omit=dev

# Source Code kopieren
COPY src/ ./src/

# Daten-Ordner für SQLite anlegen
RUN mkdir -p data

EXPOSE 3000

# Healthcheck für Prometheus / docker-compose
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]