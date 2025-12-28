import sqlite3 from "sqlite3";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const GUILD_ID = process.env.GUILD_ID || "default";

// Initialize the database
const dbPath = path.resolve(__dirname, `../${GUILD_ID}.db`);

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
  console.log(`Database file not found. Creating new database at ${dbPath}...`);
  fs.writeFileSync(dbPath, "");
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Create Users table
db.run(
  `CREATE TABLE IF NOT EXISTS Users (
    discordID TEXT PRIMARY KEY,
    name TEXT
)`,
  (err) => {
    if (err) {
      console.error("Error creating Users table:", err.message);
    } else {
      console.log("Users table ready.");
    }
  }
);

// Create Birthdays table
db.run(
  `CREATE TABLE IF NOT EXISTS Birthdays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discordID TEXT,
    dateISOString TEXT,
    FOREIGN KEY (discordID) REFERENCES Users (discordID)
)`,
  (err) => {
    if (err) {
      console.error("Error creating Birthdays table:", err.message);
    } else {
      console.log("Birthdays table ready.");
    }
  }
);

export default db;
