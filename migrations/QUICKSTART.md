# Quick Start - Database Migration

## For First-Time Users

If you're upgrading from v0.2.0-alpha to v0.3.0, follow these steps:

### Step 1: Install Dependencies

Make sure you have all dependencies installed:

```bash
npm install
```

### Step 2: Run the Migration

```bash
# Replace YOUR_GUILD_ID with your Discord server ID
# Replace YOUR_TIMEZONE with your timezone (e.g., America/Toronto)
# Replace YOUR_YEAR with the default year for birthdays (e.g., 2000) - optional
node migrations/scripts/migrate_v0.2_to_v0.3.js YOUR_GUILD_ID YOUR_TIMEZONE [YOUR_YEAR]
```

**Example:**

```bash
# With timezone and year
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto 2000

# With timezone only (uses current year)
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto

# With defaults (UTC timezone, current year)
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126
```

### Step 3: Verify Migration

Check that the new database was created:

```bash
# List all database files
ls -lh *.db

# You should see:
# - YOUR_GUILD_ID_OLD_v0.2.0-alpha.db (backup)
# - YOUR_GUILD_ID.db (new database)
```

Verify the data:

```bash
# Check users were migrated
sqlite3 YOUR_GUILD_ID.db "SELECT COUNT(*) FROM Users;"

# Check birthdays were migrated
sqlite3 YOUR_GUILD_ID.db "SELECT COUNT(*) FROM Birthdays;"

# View a sample birthday record
sqlite3 YOUR_GUILD_ID.db "SELECT * FROM Birthdays LIMIT 1;"
```

### Step 4: Start the Bot

```bash
npm run dev
```

The bot should now connect and work with your migrated data!

### Step 5: Test Birthday Features

In Discord, try:

- `!birthday` - Check if existing birthdays are shown
- `!birthday @user` - Check a specific user's birthday
- Wait for birthday notifications (if someone's birthday is today)

---

## Troubleshooting

### "Old database not found"

Make sure:

1. You're in the project root directory
2. Your database file is named `{YOUR_GUILD_ID}.db`
3. The file exists (run `ls *.db` to check)

### "Backup database already exists"

This means you already have a backup. Either:

- The migration already ran (check if the new database has data)
- A previous migration attempt created the backup

To retry migration:

```bash
# Remove the backup (be careful!)
rm YOUR_GUILD_ID_OLD_v0.2.0-alpha.db

# Remove new database if it was partially created
rm YOUR_GUILD_ID.db

# Run migration again
node migrations/scripts/migrate_v0.2_to_v0.3.js YOUR_GUILD_ID YOUR_TIMEZONE [YOUR_YEAR]
```

### Dates seem wrong

The timezone might be incorrect. To fix:

1. Delete the new database:

   ```bash
   rm YOUR_GUILD_ID.db
   ```

2. Restore from backup:

   ```bash
   mv YOUR_GUILD_ID_OLD_v0.2.0-alpha.db YOUR_GUILD_ID.db
   ```

3. Run migration again with correct timezone/year:
   ```bash
   node migrations/scripts/migrate_v0.2_to_v0.3.js YOUR_GUILD_ID CORRECT_TIMEZONE [CORRECT_YEAR]
   ```

---

## Finding Your Timezone

Common timezones:

- **United States:**
  - Eastern: `America/New_York`
  - Central: `America/Chicago`
  - Mountain: `America/Denver`
  - Pacific: `America/Los_Angeles`

- **Canada:**
  - Eastern: `America/Toronto`
  - Pacific: `America/Vancouver`

- **Europe:**
  - London: `Europe/London`
  - Paris: `Europe/Paris`
  - Berlin: `Europe/Berlin`

- **Asia:**
  - Tokyo: `Asia/Tokyo`
  - Shanghai: `Asia/Shanghai`
  - India: `Asia/Kolkata`

- **Australia:**
  - Sydney: `Australia/Sydney`
  - Melbourne: `Australia/Melbourne`

Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

---

## Need Help?

See the full documentation in [`README.md`](./README.md) for detailed information about:

- What gets migrated
- Schema differences
- Advanced troubleshooting
- Manual rollback procedures
