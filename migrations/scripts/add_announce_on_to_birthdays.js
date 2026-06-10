/**
 * Migration Script: Add announce_on column to Birthdays table
 *
 * This script adds a new `announce_on` boolean column to the Birthdays table
 * with a default value of 1 (true). This allows users to opt out of having
 * their birthday announced in daily announcements while still appearing in
 * the birthday list and monthly reminders.
 *
 * Usage:
 *   node migrations/scripts/add_announce_on_to_birthdays.js <guild_id>
 *
 * Arguments:
 *   guild_id: Your Discord server/guild ID
 *
 * Example:
 *   node migrations/scripts/add_announce_on_to_birthdays.js 578082133646639126
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Error: Guild ID is required');
  console.log('Usage: node add_announce_on_to_birthdays.js <guild_id>');
  console.log(
    'Example: node add_announce_on_to_birthdays.js 578082133646639126',
  );
  process.exit(1);
}

const GUILD_ID = args[0];
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DB_PATH = path.join(PROJECT_ROOT, `${GUILD_ID}.db`);

console.log('='.repeat(60));
console.log('Database Migration: Add announce_on to Birthdays');
console.log('='.repeat(60));
console.log(`Guild ID: ${GUILD_ID}`);
console.log(`Database: ${DB_PATH}`);
console.log('='.repeat(60));

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`\nError: Database not found at ${DB_PATH}`);
  process.exit(1);
}

console.log('\n✓ Database found');

// Open database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to database');
});

// Check if column already exists
db.get('PRAGMA table_info(Birthdays)', (err, row) => {
  if (err) {
    console.error('Error checking table schema:', err.message);
    db.close();
    process.exit(1);
  }
});

db.all('PRAGMA table_info(Birthdays)', (err, rows) => {
  if (err) {
    console.error('Error checking table schema:', err.message);
    db.close();
    process.exit(1);
  }

  const hasAnnounceOn = rows.some((row) => row.name === 'announce_on');

  if (hasAnnounceOn) {
    console.log(
      '\n⚠️  Column announce_on already exists. No migration needed.',
    );
    db.close();
    return;
  }

  console.log(
    '✓ Column announce_on does not exist. Proceeding with migration...',
  );

  // Add the column with default value
  db.run(
    'ALTER TABLE Birthdays ADD COLUMN announce_on BOOLEAN DEFAULT 1',
    (err) => {
      if (err) {
        console.error('Error adding column:', err.message);
        db.close();
        process.exit(1);
      }

      console.log('✓ Column announce_on added successfully');

      // Verify the column was added
      db.all('PRAGMA table_info(Birthdays)', (err, rows) => {
        if (err) {
          console.error('Error verifying migration:', err.message);
          db.close();
          process.exit(1);
        }

        console.log('\n📋 Updated Birthdays table schema:');
        console.table(
          rows.map((row) => ({
            name: row.name,
            type: row.type,
            default: row.dflt_value,
          })),
        );

        // Count birthdays
        db.get('SELECT COUNT(*) as count FROM Birthdays', (err, row) => {
          if (err) {
            console.error('Error counting birthdays:', err.message);
          } else {
            console.log(
              `\n✓ Migration complete! ${row.count} birthday record(s) updated.`,
            );
            console.log(
              '  All existing birthdays now have announce_on = 1 (enabled)',
            );
          }

          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
              process.exit(1);
            }
            console.log('✓ Database connection closed');
            console.log('\n' + '='.repeat(60));
            console.log('Migration completed successfully! ✨');
            console.log('='.repeat(60));
          });
        });
      });
    },
  );
});
