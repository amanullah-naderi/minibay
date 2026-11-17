const express = require("express");
const router = express.Router();
const { register } = require("../metrics/prometheus");

// Prometheus scrapt diesen Endpunkt alle 15 Sekunden
router.get("/", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

module.exports = router;