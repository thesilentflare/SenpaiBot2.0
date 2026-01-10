/**
 * Example Migration Output
 * 
 * This file shows what successful migration output looks like.
 * This is for documentation purposes only - not an executable script.
 */

/*

$ node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto 2000

============================================================
Database Migration: v0.2.0-alpha → v0.3.0
============================================================
Guild ID: 578082133646639126
Timezone: America/Toronto
Default Year: 2000
Old DB: /path/to/project/578082133646639126.db
Backup: /path/to/project/578082133646639126_OLD_v0.2.0-alpha.db
New DB: /path/to/project/578082133646639126.db
============================================================

✓ Pre-migration checks passed

[1/5] Backing up old database...
✓ Renamed 578082133646639126.db → 578082133646639126_OLD_v0.2.0-alpha.db

[2/5] Creating new database with schema...
  ✓ Created Users table
  ✓ Created Birthdays table
  ✓ Created Admins table
  ✓ Created MsgLogExemptions table

[3/5] Reading data from old database...
  ✓ Found 15 birthday records

[4/5] Migrating data to new database...

  ✓ Inserted 15 users
  ✓ Inserted 15 birthdays

[5/5] Migration complete!
============================================================
Summary:
  • Users migrated: 15
  • Birthdays migrated: 15
  • Old database backed up to: 578082133646639126_OLD_v0.2.0-alpha.db
  • New database created: 578082133646639126.db
============================================================

✓ Migration successful! You can now start the bot.
⚠ Keep the backup file until you verify everything works correctly.

*/
