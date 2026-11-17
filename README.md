# MiniBay – Backend & Monitoring

> Einfache Kleinanzeigen-Plattform mit Node/Express, Prometheus und Grafana.

> *Dieses Projekt wurde im Rahmen der Module System Design (Sommersemester 2026) an der Fachhochschule Erfurt entwickelt und implementiert.*
---

## Projektstruktur

```
miniBay/
├── docker-compose.yml                  ← Startet alle Container
├── prometheus/
│   └── prometheus.yml                  ← Scrape-Konfiguration
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasource.yml          ← Prometheus als Datenquelle
│   │   └── dashboards/
│   │       └── dashboard.yml           ← Dashboard-Loader
│   └── dashboards/
│       └── minibay.json                ← MiniBay Dashboard
└── minibay-backend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js                    ← Express App + Middleware
        ├── routes/
        │   ├── inserate.js             ← CRUD Endpunkte
        │   └── metrics.js              ← /metrics für Prometheus
        ├── db/
        │   └── database.js             ← SQLite Setup
        └── metrics/
            └── prometheus.js           ← Metriken Definition
```

---

## Backend + Metriken

### Verantwortung
- Node/Express Backend
- CRUD-Endpunkte für Inserate
- Prometheus-Instrumentierung (`/metrics`)
- SQLite Datenbank

### Voraussetzungen
- Node.js v20+
- npm

### Setup

```bash
cd minibay-backend
npm install
npm start
```

**Erwartete Ausgabe:**
```
MiniBay Backend läuft auf http://localhost:3000
Metriken verfügbar unter http://localhost:3000/metrics
```

---

### API Endpunkte

#### Health Check
```
GET /health
```
```json
{ "status": "UP", "timestamp": "2026-06-02T11:44:21.121Z" }
```

---

#### Alle Inserate abrufen
```
GET /inserate
```
```json
{ "count": 2, "data": [] }
```

**Optionale Query-Parameter:**

| Parameter | Beispiel | Beschreibung |
|---|---|---|
| `suche` | `?suche=Fahrrad` | Suche in Titel + Beschreibung |
| `kategorie` | `?kategorie=sport` | Filter nach Kategorie (Groß-/Kleinschreibung egal) |

---

#### Einzelnes Inserat abrufen
```
GET /inserate/:id
```
```json
{ "id": 1, "titel": "Fahrrad", "preis": 120}
```

---

#### Inserat erstellen
```
POST /inserate
Content-Type: application/json
```
```json
{
  "titel": "Fahrrad",
  "beschreibung": "Gut erhaltenes Cityrad, 7 Gänge",
  "preis": 120,
  "kategorie": "sport"
}
```
**Pflichtfelder:** `titel`, `beschreibung`, `preis`, `kategorie`

**Antwort:** `201 Created`
```json
{ "message": "Inserat erfolgreich erstellt" }
```

---

#### Inserat bearbeiten
```
PUT /inserate/:id
Content-Type: application/json
```
```json
{ "preis": 99 }
```
**Antwort:** `200 OK`
```json
{ "message": "Inserat aktualisiert" }
```

---

#### Inserat löschen
```
DELETE /inserate/:id
```
**Antwort:** `200 OK`
```json
{ "message": "Inserat gelöscht" }
```

---

### Fehler-Antworten

| Status | Bedeutung | Beispiel |
|---|---|---|
| `400` | Pflichtfeld fehlt oder ungültiger Wert | `"Preis muss eine positive Zahl sein"` |
| `404` | Inserat nicht gefunden | `"Inserat nicht gefunden"` |

---

### Prometheus Metriken

Endpunkt: `GET /metrics`

| Metrik | Typ | Beschreibung |
|---|---|---|
| `minibay_http_requests_total` | Counter | Alle HTTP-Requests nach Methode, Route, Status |
| `minibay_http_request_duration_seconds` | Histogram | Latenz in Sekunden (p50, p95, p99) |
| `minibay_inserate_aktiv_total` | Gauge | Anzahl aktiver Inserate (steigt/fällt) |
| `minibay_inserate_erstellt_total` | Counter | Inserate gesamt erstellt (nur aufwärts) |

**Beispielausgabe:**
```
minibay_http_requests_total{method="POST",route="/inserate",status="201"} 3
minibay_inserate_aktiv_total 3
minibay_inserate_erstellt_total 3
minibay_http_request_duration_seconds_bucket{le="0.1",...} 12
```

---

### Manuelle API Tests (curl)

```bash
# Inserat erstellen
curl -s -X POST http://localhost:3000/inserate \
  -H "Content-Type: application/json" \
  -d '{"titel":"Fahrrad","beschreibung":"Cityrad 7 Gänge","preis":120,"kategorie":"sport"}'

# Alle Inserate abrufen
curl -s http://localhost:3000/inserate

# Suche
curl -s "http://localhost:3000/inserate?suche=Fahrrad"

# Filter
curl -s "http://localhost:3000/inserate?kategorie=sport"

# Update
curl -s -X PUT http://localhost:3000/inserate/1 \
  -H "Content-Type: application/json" \
  -d '{"preis":99}'

# Löschen
curl -s -X DELETE http://localhost:3000/inserate/1

# Metriken
curl -s http://localhost:3000/metrics | grep "^minibay_"
```

---

## Infrastruktur + Monitoring

### Verantwortung
- Docker + docker-compose Setup
- Prometheus Konfiguration
- Grafana Dashboard
- Healthchecks

### Voraussetzungen
- Docker Desktop installiert und gestartet

### Alle Container starten

```bash
# Im Hauptverzeichnis miniBay/
docker compose up --build
```

Beim ersten Start werden Images heruntergeladen (~2 Minuten).

**Erwartete Ausgabe:**
```
Container minibay-backend   Started  → Port 3000
Container prometheus         Started  → Port 9090
Container grafana            Started  → Port 3001
```

### Container stoppen

```bash
docker compose down
```

### Container neu bauen (nach Code-Änderungen)

```bash
docker compose up --build
```

---

### Services im Überblick

| Service | URL | Beschreibung |
|---|---|---|
| **Backend** | http://localhost:3000 | MiniBay API |
| **Prometheus** | http://localhost:9090 | Metriken-Datenbank |
| **Grafana** | http://localhost:3001 | Dashboard |

---

### Prometheus prüfen

**Targets aufrufen:**
```
http://localhost:9090/targets
```

Hier muss `minibay-backend` mit Status **UP** erscheinen.

**Beispielabfrage in Prometheus UI:**
```
http://localhost:9090/query
```

PromQL Abfragen zum Testen:
```
# Alle Requests
minibay_http_requests_total

# Requests pro Sekunde
rate(minibay_http_requests_total[1m])

# Aktive Inserate
minibay_inserate_aktiv_total

# p95 Latenz
histogram_quantile(0.95, rate(minibay_http_request_duration_seconds_bucket[1m]))
```

---

### Grafana Dashboard

**Login:**
```
URL:      http://localhost:3001
Benutzer: admin
Passwort: admin
```

**Dashboard öffnen:**
```
http://localhost:3001/dashboards → MiniBay Dashboard
```

**Das Dashboard zeigt:**

| Panel | Metrik | Typ |
|---|---|---|
| Aktive Inserate | `minibay_inserate_aktiv_total` | Stat |
| Inserate gesamt | `minibay_inserate_erstellt_total` | Stat |
| Fehlerquote | HTTP 4xx/5xx Rate | Stat |
| Backend Status | `up{job="minibay-backend"}` | Stat (UP/DOWN) |
| Requests/s | Rate nach HTTP-Methode | Zeitreihe |
| Latenz p95 | Histogram Quantile 0.95 | Zeitreihe |

---

### Architektur

```
Browser / curl
      │
      ▼
┌─────────────────┐
│  minibay-backend│  :3000
│  Node/Express   │──── /metrics ──────────────────┐
│  SQLite DB      │                                 │
└─────────────────┘                                 │
                                                    ▼
                                          ┌─────────────────┐
                                          │   Prometheus    │  :9090
                                          │  scrapt alle    │
                                          │    15 Sekunden  │
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │    Grafana      │  :3001
                                          │  Dashboard      │
                                          │  Live Daten     │
                                          └─────────────────┘
```

---

### Planes (für Präsentation)

| Plane | Komponente | Aufgabe |
|---|---|---|
| **Data Plane** | Backend + SQLite | Verarbeitet Inserate, antwortet auf Requests |
| **Control Plane** | Prometheus | Sammelt und speichert Metriken |
| **Ops Plane** | Grafana | Visualisiert Systemzustand live |

---

### Tradeoffs (für Präsentation)

| Vorteil | Nachteil |
|---|---|
| Vollständige Transparenz über Fehler & Latenz | Zusätzlicher Ressourcenverbrauch (RAM/CPU) |
| Verfügbarkeit nachweisbar (UP/DOWN) | Konfigurationsaufwand für Labels |
| Bottlenecks früh erkennbar | Ohne Retention-Policy wächst Disk |

### Wann NICHT einsetzen
- Kleine lokale Skripte
- Einmalige Prozesse ohne Dauerbetrieb
- Prototypen ohne NFAs

---

## Demo-Ablauf (Präsentation)

```
1. docker compose up --build
2. curl POST /inserate  →  Inserat erstellen
3. http://localhost:9090/targets  →  Backend UP zeigen
4. http://localhost:3001/dashboards  →  Live Metriken zeigen
```

**Metriken die live steigen:**
- `minibay_inserate_aktiv_total` → nach jedem POST +1
- `minibay_http_requests_total` → nach jedem Request +1
- `minibay_inserate_erstellt_total` → Counter läuft hoch

---

## NFAs 

| NFA | Nachweis |
|---|---|
| **Verfügbarkeit** | `up{job="minibay-backend"}` = 1 in Grafana |
| **Suchlatenz** | p95 Panel im Dashboard < 300ms |
| **Fehlertoleranz** | 400/404 korrekt abgefangen, sichtbar in Fehlerquote |
| **Wartbarkeit** | Alles als Code (docker-compose, prometheus.yml, dashboard.json) |
