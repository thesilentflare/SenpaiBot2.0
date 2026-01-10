import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Get database path - this will be evaluated when the module is imported
// The GUILD_ID should be set in process.env before this module is imported
const getDbPath = () => {
  const GUILD_ID = process.env.GUILD_ID || 'default';
  const suffix = process.env.NODE_ENV === 'development' ? '_testing' : '';
  return path.resolve(__dirname, `../../${GUILD_ID}${suffix}.db`);
};

const dbPath = getDbPath();

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
  console.log(`Database file not found. Creating new database at ${dbPath}...`);
  fs.writeFileSync(dbPath, '');
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

export const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database,
});

// Initialize the database before the bot is ready
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Initializing database...');
      db.run(
        `CREATE TABLE IF NOT EXISTS Users (
        discordID TEXT PRIMARY KEY,
        name TEXT
      )`,
        (err) => {
          if (err) {
            console.error('Error creating Users table:', err.message);
            reject(err);
          } else {
            console.log('Users table ready.');
          }
        },
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS Birthdays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discordID TEXT,
        dateISOString TEXT,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error('Error creating Birthdays table:', err.message);
            reject(err);
          } else {
            console.log('Birthdays table ready.');
          }
        },
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS Admins (
        discordID TEXT,
        active BOOLEAN,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error('Error creating Admins table:', err.message);
            reject(err);
          } else {
            console.log('Admins table ready.');
          }
        },
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS MsgLogExemptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discordID TEXT,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error(
              'Error creating MsgLogExemptions table:',
              err.message,
            );
            reject(err);
          } else {
            console.log('MsgLogExemptions table ready.');
            resolve();
          }
        },
      );
    });
  });
};
