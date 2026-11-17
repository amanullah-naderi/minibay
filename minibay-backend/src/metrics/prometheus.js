const client = require("prom-client");

// Standard Node-Metriken (CPU, RAM, Event-Loop)
client.collectDefaultMetrics({ prefix: "minibay_" });

const httpRequestsTotal = new client.Counter({
    name: "minibay_http_requests_total",
    help: "Gesamtanzahl aller HTTP-Requests",
    labelNames: ["method", "route", "status"],
});

// Misst Latenz als Histogramm
const httpRequestDuration = new client.Histogram({
    name: "minibay_http_request_duration_seconds",
    help: "Latenz der HTTP-Requests in Sekunden",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
});

// Anzahl aktiver Inserate (steigt/fällt)
const inserateAktiv = new client.Gauge({
    name: "minibay_inserate_aktiv_total",
    help: "Anzahl der aktuell aktiven Inserate",
});

const inserateErstellt = new client.Counter({
    name: "minibay_inserate_erstellt_total",
    help: "Gesamtanzahl aller jemals erstellten Inserate",
});

module.exports = {
    register: client.register,
    httpRequestsTotal,
    httpRequestDuration,
    inserateAktiv,
    inserateErstellt,
};