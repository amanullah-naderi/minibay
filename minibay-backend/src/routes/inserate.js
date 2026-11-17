const express = require("express");
const router = express.Router();
const { getDb, saveDb } = require("../db/database");
const { inserateAktiv, inserateErstellt } = require("../metrics/prometheus");

function rowsToObjects(result) {
    if (!result || result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    );
}

// GET /inserate
router.get("/", async (req, res) => {
    const db = await getDb();
    const { suche, kategorie } = req.query;
    let query = "SELECT * FROM inserate WHERE aktiv = 1";
    const params = [];
    if (suche) {
        query += " AND (titel LIKE ? OR beschreibung LIKE ?)";
        params.push(`%${suche}%`, `%${suche}%`);
    }
    if (kategorie) {
        const kategorieNorm = kategorie
            .toLowerCase()
            .replace(/ä/g, "ae")
            .replace(/ö/g, "oe")
            .replace(/ü/g, "ue")
            .replace(/ß/g, "ss");
        query += " AND kategorie = ?";
        params.push(kategorieNorm);
    }
    query += " ORDER BY erstellt_am DESC";
    const result = db.exec(query, params);
    const inserate = rowsToObjects(result);
    res.json({ count: inserate.length, data: inserate });
});

// GET /inserate/:id
router.get("/:id", async (req, res) => {
    const db = await getDb();
    const result = db.exec("SELECT * FROM inserate WHERE id = ?", [req.params.id]);
    const rows = rowsToObjects(result);
    if (rows.length === 0)
        return res.status(404).json({ error: "Inserat nicht gefunden" });
    res.json(rows[0]);
});

// POST /inserate
router.post("/", async (req, res) => {
    const db = await getDb();
    const { titel, beschreibung, preis, kategorie } = req.body;
    if (!titel || !beschreibung || preis === undefined || !kategorie)
        return res.status(400).json({
            error: "Pflichtfelder fehlen: titel, beschreibung, preis, kategorie",
        });
    if (typeof preis !== "number" || preis < 0)
        return res.status(400).json({ error: "Preis muss eine positive Zahl sein" });

    const kategorieNorm = kategorie
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss");

    db.run(
        "INSERT INTO inserate (titel, beschreibung, preis, kategorie) VALUES (?, ?, ?, ?)",
        [titel, beschreibung, preis, kategorieNorm]
    );
    saveDb();

    inserateErstellt.inc();
    const countResult = db.exec(
        "SELECT COUNT(*) as count FROM inserate WHERE aktiv = 1"
    );
    inserateAktiv.set(countResult[0].values[0][0]);

    res.status(201).json({ message: "Inserat erfolgreich erstellt" });
});

// PUT /inserate/:id
router.put("/:id", async (req, res) => {
    const db = await getDb();
    const { id } = req.params;
    const result = db.exec("SELECT * FROM inserate WHERE id = ?", [id]);
    const rows = rowsToObjects(result);
    if (rows.length === 0)
        return res.status(404).json({ error: "Inserat nicht gefunden" });

    const inserat = rows[0];
    const { titel, beschreibung, preis, kategorie } = req.body;
    db.run(
        "UPDATE inserate SET titel = ?, beschreibung = ?, preis = ?, kategorie = ? WHERE id = ?",
        [
            titel        ?? inserat.titel,
            beschreibung ?? inserat.beschreibung,
            preis        ?? inserat.preis,
            kategorie    ?? inserat.kategorie,
            id,
        ]
    );
    saveDb();
    res.json({ message: "Inserat aktualisiert" });
});

// DELETE /inserate/:id
router.delete("/:id", async (req, res) => {
    const db = await getDb();
    const result = db.exec("SELECT * FROM inserate WHERE id = ?", [req.params.id]);
    const rows = rowsToObjects(result);
    if (rows.length === 0)
        return res.status(404).json({ error: "Inserat nicht gefunden" });

    db.run("DELETE FROM inserate WHERE id = ?", [req.params.id]);
    saveDb();

    const countResult = db.exec(
        "SELECT COUNT(*) as count FROM inserate WHERE aktiv = 1"
    );
    inserateAktiv.set(countResult[0].values[0][0]);
    res.json({ message: "Inserat gelöscht" });
});

module.exports = router;