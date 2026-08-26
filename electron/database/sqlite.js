const Database = require("better-sqlite3");
const { app } = require("electron");
const path = require("path");

const { runMigrations } = require("./migrations");

let db;

function initializeDatabase() {
  const dbPath = path.join(
    app.getPath("userData"),
    "restaurant.db"
  );

  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  console.log("SQLite database:", dbPath);

  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error("SQLite database is not initialized");
  }

  return db;
}

module.exports = {
  initializeDatabase,
  getDatabase,
};