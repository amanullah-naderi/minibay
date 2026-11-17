const express = require("express");
const cors = require("cors");

const inserateRoutes = require("./routes/inserate");
const metricsRoute  = require("./routes/metrics");
const { httpRequestDuration, httpRequestsTotal } = require("./metrics/prometheus");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Prometheus: Jeden Request messen
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
    res.on("finish", () => {
        httpRequestsTotal.inc({
            method: req.method,
            route:  req.path,
            status: res.statusCode,
        });
        end({ status: res.statusCode });
    });
    next();
});

// Routen
app.use("/inserate", inserateRoutes);
app.use("/metrics",  metricsRoute);

app.get("/health", (_req, res) => {
    res.json({ status: "UP", timestamp: new Date().toISOString() });
});

// Server starten
app.listen(PORT, () => {
    console.log(`MiniBay Backend läuft auf http://localhost:${PORT}`);
    console.log(`Metriken verfügbar unter http://localhost:${PORT}/metrics`);
});