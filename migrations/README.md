# Database Migration Guide

This directory contains migration scripts for upgrading SenpaiBot databases between versions.

## Migration from v0.2.0-alpha to v0.3.0

The v0.3.0 update represents a complete rewrite from Python (Django) to TypeScript (Discord.js), requiring a database migration.

### What Gets Migrated

The migration script (`scripts/migrate_v0.2_to_v0.3.js`) performs the following operations:

1. **Users Table Population**
   - Extracts `discord_id` and `name` from `models_birthday` table
   - Inserts into new `Users` table with proper schema

2. **Birthdays Table Migration**
   - Extracts `month` and `day` from `models_birthday` table
   - Converts to ISO date strings with configurable timezone
   - Links to users via foreign key relationship

3. **Database Renaming**
   - Renames old database: `{GUILD_ID}.db` → `{GUILD_ID}_OLD_v0.2.0-alpha.db`
   - Creates new database: `{GUILD_ID}.db` with fresh schema

4. **New Table Creation**
   - Creates all v0.3.0 tables using same SQL commands as the bot:
     - `Users` - Discord user information
     - `Birthdays` - Birthday records with ISO date strings
     - `Admins` - Bot administrators
     - `MsgLogExemptions` - Message logging exemptions

### Prerequisites

- Node.js installed
- `sqlite3` npm package (already in dependencies)
- Your existing v0.2.0-alpha database file named `{GUILD_ID}.db`

### Usage

```bash
# Basic usage (uses UTC timezone and current year)
node migrations/scripts/migrate_v0.2_to_v0.3.js <GUILD_ID>

# With custom timezone
node migrations/scripts/migrate_v0.2_to_v0.3.js <GUILD_ID> <TIMEZONE>

# With custom timezone and default year
node migrations/scripts/migrate_v0.2_to_v0.3.js <GUILD_ID> <TIMEZONE> <YEAR>
```

### Examples

```bash
# Migrate with UTC timezone and current year (default)
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126

# Migrate with America/Toronto timezone and current year
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto

# Migrate with America/Toronto timezone and year 2000
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto 2000

# Migrate with Europe/London timezone and year 1990
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 Europe/London 1990
```

### Timezone and Year Configuration

The timezone parameter controls how birthday dates are stored, and the year parameter sets the default year for all birthdays (since the old database only has month and day).

**Timezone:**
- Birthdays are stored as ISO date strings in the new database
- The timezone affects when birthday notifications are triggered
- Common IANA timezone strings:
  - `UTC` (default)
  - `America/New_York`
  - `America/Los_Angeles`
  - `America/Toronto`
  - `Europe/London`
  - `Europe/Paris`
  - `Asia/Tokyo`
  - `Australia/Sydney`

**Year:**
- The old database only stores month and day, not year
- You can specify a default year for all birthdays (e.g., 2000, 1990)
- Default: Current year if not specified
- This doesn't affect birthday notifications, only the stored date

You can find your timezone at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Schema Differences

#### Old Schema (v0.2.0-alpha - Django)
```sql
CREATE TABLE models_birthday (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  discord_id VARCHAR(100) NOT NULL UNIQUE
);
```

#### New Schema (v0.3.0 - TypeScript)
```sql
-- Users table (new)
CREATE TABLE Users (
  discordID TEXT PRIMARY KEY,
  name TEXT
);

-- Birthdays table (restructured)
CREATE TABLE Birthdays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discordID TEXT,
  dateISOString TEXT,
  FOREIGN KEY (discordID) REFERENCES Users (discordID)
);

-- Admins table (new)
CREATE TABLE Admins (
  discordID TEXT,
  active BOOLEAN,
  FOREIGN KEY (discordID) REFERENCES Users (discordID)
);

-- MsgLogExemptions table (new)
CREATE TABLE MsgLogExemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discordID TEXT,
  FOREIGN KEY (discordID) REFERENCES Users (discordID)
);
```

### Migration Process

The script performs these steps in order:

1. **Pre-flight Checks**
   - Validates timezone string
   - Checks if old database exists
   - Ensures backup doesn't already exist

2. **Backup Creation**
   - Renames old database to `{GUILD_ID}_OLD_v0.2.0-alpha.db`

3. **New Database Creation**
   - Creates new `{GUILD_ID}.db` file
   - Creates all required tables with proper schema

4. **Data Migration**
   - Reads all records from old `models_birthday` table
   - Inserts users into new `Users` table (de-duplicated)
   - Converts month/day to ISO date strings
   - Inserts birthdays into new `Birthdays` table

5. **Verification**
   - Reports number of records migrated
   - Lists any errors encountered

### Error Handling

The script includes automatic rollback on failure:

- If migration fails, the new database is deleted
- The old database is restored from backup
- Your original data remains safe

### After Migration

1. **Verify the Migration**
   ```bash
   # Check users
   sqlite3 {GUILD_ID}.db "SELECT * FROM Users;"
   
   # Check birthdays
   sqlite3 {GUILD_ID}.db "SELECT * FROM Birthdays;"
   ```

2. **Start the Bot**
   ```bash
   npm run dev
   ```

3. **Test Birthday Functionality**
   - Check if existing birthdays are recognized
   - Test `!birthday` command
   - Verify birthday notifications work

4. **Keep the Backup**
   - Don't delete `{GUILD_ID}_OLD_v0.2.0-alpha.db` immediately
   - Keep it for at least a few weeks
   - Once you're confident everything works, you can remove it

### Troubleshooting

**Error: Old database not found**
- Ensure you're running the script from the project root
- Check that your database file is named `{GUILD_ID}.db`

**Error: Backup database already exists**
- A previous migration backup exists
- Either delete/rename it, or verify if migration already completed

**Error: Invalid timezone**
- Check your timezone string is a valid IANA timezone
- Use UTC if unsure
- See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

**Migration completed but no data**
- Check if the old database had data in `models_birthday` table
- Verify the table name is exactly `models_birthday` (not `models_birthdays`)

**Dates appear incorrect**
- This may be due to timezone settings
- You can re-run the migration with a different timezone
- First, delete the new database and restore from backup

### Manual Rollback

If needed, you can manually rollback:

```bash
# Remove the new database
rm {GUILD_ID}.db

# Restore from backup
mv {GUILD_ID}_OLD_v0.2.0-alpha.db {GUILD_ID}.db
```

### Notes

- The migration only handles birthday data from the old bot
- Admin users must be re-added using `!addadmin` command
- Message log exemptions start fresh (they didn't exist in v0.2.0)
- The old Django tables are not deleted from the backup
- If you need to access old Django admin data, query the backup database

### Support

If you encounter issues not covered here, please:
1. Check the error message carefully
2. Verify your database file structure
3. Try running with `--verbose` flag (if implemented)
4. Open an issue on GitHub with:
   - The exact command you ran
   - The full error message
   - Your Node.js version
   - Your database file size/record count
