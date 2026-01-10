/**
 * Migration Script: v0.2.0-alpha to v0.3.0
 *
 * This script migrates data from the old Django-based database to the new TypeScript bot database.
 *
 * Usage:
 *   node migrations/scripts/migrate_v0.2_to_v0.3.js <guild_id> [timezone] [year]
 *
 * Arguments:
 *   guild_id: Your Discord server/guild ID
 *   timezone: IANA timezone string (e.g., 'America/Toronto', 'Europe/London')
 *             Default: 'UTC'
 *   year:     Default year for birthdays (e.g., 2000, 1990)
 *             Default: Current year
 *
 * Example:
 *   node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto 2000
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Error: Guild ID is required');
  console.log(
    'Usage: node migrate_v0.2_to_v0.3.js <guild_id> [timezone] [year]',
  );
  console.log(
    'Example: node migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto 2000',
  );
  process.exit(1);
}

const GUILD_ID = args[0];
const TIMEZONE = args[1] || 'UTC';
const DEFAULT_YEAR = args[2] ? parseInt(args[2], 10) : new Date().getFullYear();

// Validate year
if (isNaN(DEFAULT_YEAR) || DEFAULT_YEAR < 1900 || DEFAULT_YEAR > 2100) {
  console.error(
    `Error: Invalid year "${args[2]}". Year must be between 1900 and 2100.`,
  );
  process.exit(1);
}

// Validate timezone (basic check)
try {
  // This will throw if timezone is invalid
  new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
  console.log(`Using timezone: ${TIMEZONE}`);
} catch (error) {
  console.error(`Error: Invalid timezone "${TIMEZONE}"`);
  console.log(
    'Please use a valid IANA timezone string (e.g., America/Toronto, Europe/London, UTC)',
  );
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OLD_DB_PATH = path.join(PROJECT_ROOT, `${GUILD_ID}.db`);
const OLD_DB_BACKUP_PATH = path.join(
  PROJECT_ROOT,
  `${GUILD_ID}_OLD_v0.2.0-alpha.db`,
);
const NEW_DB_PATH = path.join(PROJECT_ROOT, `${GUILD_ID}.db`);

console.log('='.repeat(60));
console.log('Database Migration: v0.2.0-alpha → v0.3.0');
console.log('='.repeat(60));
console.log(`Guild ID: ${GUILD_ID}`);
console.log(`Timezone: ${TIMEZONE}`);
console.log(`Default Year: ${DEFAULT_YEAR}`);
console.log(`Old DB: ${OLD_DB_PATH}`);
console.log(`Backup: ${OLD_DB_BACKUP_PATH}`);
console.log(`New DB: ${NEW_DB_PATH}`);
console.log('='.repeat(60));

// Step 1: Check if old database exists
if (!fs.existsSync(OLD_DB_PATH)) {
  console.error(`\nError: Old database not found at ${OLD_DB_PATH}`);
  process.exit(1);
}

// Step 2: Check if backup already exists
if (fs.existsSync(OLD_DB_BACKUP_PATH)) {
  console.error(
    `\nError: Backup database already exists at ${OLD_DB_BACKUP_PATH}`,
  );
  console.error(
    'Please remove or rename the existing backup before running this migration.',
  );
  process.exit(1);
}

console.log('\n✓ Pre-migration checks passed');

// Step 3: Rename old database to backup
console.log('\n[1/5] Backing up old database...');
fs.renameSync(OLD_DB_PATH, OLD_DB_BACKUP_PATH);
console.log(`✓ Renamed ${GUILD_ID}.db → ${GUILD_ID}_OLD_v0.2.0-alpha.db`);

// Step 4: Create new database with schema
console.log('\n[2/5] Creating new database with schema...');
const newDb = new sqlite3.Database(NEW_DB_PATH);

const createTables = () => {
  return new Promise((resolve, reject) => {
    newDb.serialize(() => {
      // Create Users table
      newDb.run(
        `CREATE TABLE IF NOT EXISTS Users (
        discordID TEXT PRIMARY KEY,
        name TEXT
      )`,
        (err) => {
          if (err) {
            console.error('Error creating Users table:', err.message);
            return reject(err);
          }
          console.log('  ✓ Created Users table');
        },
      );

      // Create Birthdays table
      newDb.run(
        `CREATE TABLE IF NOT EXISTS Birthdays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discordID TEXT,
        dateISOString TEXT,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error('Error creating Birthdays table:', err.message);
            return reject(err);
          }
          console.log('  ✓ Created Birthdays table');
        },
      );

      // Create Admins table
      newDb.run(
        `CREATE TABLE IF NOT EXISTS Admins (
        discordID TEXT,
        active BOOLEAN,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error('Error creating Admins table:', err.message);
            return reject(err);
          }
          console.log('  ✓ Created Admins table');
        },
      );

      // Create MsgLogExemptions table
      newDb.run(
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
            return reject(err);
          }
          console.log('  ✓ Created MsgLogExemptions table');
          resolve();
        },
      );
    });
  });
};

/**
 * Convert month and day to ISO date string
 * Uses the specified year and timezone
 */
function createISODateString(month, day, year, timezone) {
  // Create a date in UTC to avoid timezone conversion issues during date construction
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  // Return ISO string (will be in format: YYYY-MM-DDTHH:MM:SS.sssZ)
  return date.toISOString();
}

// Step 5: Migrate data
const migrateData = () => {
  return new Promise((resolve, reject) => {
    console.log('\n[3/5] Reading data from old database...');

    const oldDb = new sqlite3.Database(
      OLD_DB_BACKUP_PATH,
      sqlite3.OPEN_READONLY,
    );

    oldDb.all(
      'SELECT discord_id, name, month, day FROM models_birthday',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error reading from old database:', err.message);
          oldDb.close();
          return reject(err);
        }

        console.log(`  ✓ Found ${rows.length} birthday records`);

        if (rows.length === 0) {
          console.log('  ℹ No data to migrate');
          oldDb.close();
          return resolve({ users: 0, birthdays: 0 });
        }

        console.log('\n[4/5] Migrating data to new database...');

        let usersInserted = 0;
        let birthdaysInserted = 0;
        let errors = 0;

        newDb.serialize(() => {
          const insertUser = newDb.prepare(
            'INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)',
          );
          const insertBirthday = newDb.prepare(
            'INSERT INTO Birthdays (discordID, dateISOString) VALUES (?, ?)',
          );

          rows.forEach((row, index) => {
            try {
              // Insert user
              insertUser.run(row.discord_id, row.name, function (err) {
                if (err) {
                  console.error(
                    `  ✗ Error inserting user ${row.name} (${row.discord_id}):`,
                    err.message,
                  );
                  errors++;
                } else if (this.changes > 0) {
                  usersInserted++;
                }
              });

              // Insert birthday
              const isoDateString = createISODateString(
                row.month,
                row.day,
                DEFAULT_YEAR,
                TIMEZONE,
              );
              insertBirthday.run(row.discord_id, isoDateString, function (err) {
                if (err) {
                  console.error(
                    `  ✗ Error inserting birthday for ${row.name}:`,
                    err.message,
                  );
                  errors++;
                } else {
                  birthdaysInserted++;
                }
              });
            } catch (error) {
              console.error(
                `  ✗ Error processing row ${index + 1}:`,
                error.message,
              );
              errors++;
            }
          });

          insertUser.finalize();
          insertBirthday.finalize(() => {
            oldDb.close();

            console.log(`\n  ✓ Inserted ${usersInserted} users`);
            console.log(`  ✓ Inserted ${birthdaysInserted} birthdays`);
            if (errors > 0) {
              console.log(`  ⚠ ${errors} errors occurred during migration`);
            }

            resolve({ users: usersInserted, birthdays: birthdaysInserted });
          });
        });
      },
    );
  });
};

// Execute migration
(async () => {
  try {
    await createTables();
    const stats = await migrateData();

    console.log('\n[5/5] Migration complete!');
    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  • Users migrated: ${stats.users}`);
    console.log(`  • Birthdays migrated: ${stats.birthdays}`);
    console.log(
      `  • Old database backed up to: ${GUILD_ID}_OLD_v0.2.0-alpha.db`,
    );
    console.log(`  • New database created: ${GUILD_ID}.db`);
    console.log('='.repeat(60));
    console.log('\n✓ Migration successful! You can now start the bot.');
    console.log(
      '⚠ Keep the backup file until you verify everything works correctly.',
    );

    newDb.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);

    // Attempt to rollback
    console.log('\nAttempting to rollback changes...');
    try {
      newDb.close();
      if (fs.existsSync(NEW_DB_PATH)) {
        fs.unlinkSync(NEW_DB_PATH);
        console.log('  ✓ Removed incomplete new database');
      }
      if (fs.existsSync(OLD_DB_BACKUP_PATH)) {
        fs.renameSync(OLD_DB_BACKUP_PATH, OLD_DB_PATH);
        console.log('  ✓ Restored old database from backup');
      }
      console.log('✓ Rollback complete - your old database is intact');
    } catch (rollbackError) {
      console.error('✗ Rollback failed:', rollbackError.message);
      console.error('Please manually restore your database from the backup.');
    }

    process.exit(1);
  }
})();
