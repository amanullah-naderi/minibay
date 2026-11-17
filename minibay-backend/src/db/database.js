const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/minibay.db");

let db;

async function getDb() {
    if (db) return db;

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS inserate (
                                                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                                                titel        TEXT    NOT NULL,
                                                beschreibung TEXT    NOT NULL,
                                                preis        REAL    NOT NULL,
                                                kategorie    TEXT    NOT NULL,
                                                aktiv        INTEGER NOT NULL DEFAULT 1,
                                                erstellt_am  TEXT    NOT NULL DEFAULT (datetime('now'))
            );
    `);

    return db;
}

function saveDb() {
    if (!db) return;
    const data = db.export();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, saveDb };