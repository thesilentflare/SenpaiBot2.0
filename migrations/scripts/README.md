# Migration Scripts

This directory contains database migration scripts for SenpaiBot version upgrades.

## Available Migrations

### v0.2.0-alpha → v0.3.0
**File:** `migrate_v0.2_to_v0.3.js`

Migrates from Django/Python-based bot to TypeScript/Discord.js bot.

**Features:**
- Migrates user data and birthdays
- Preserves old database as backup
- Configurable timezone for birthday dates
- Automatic rollback on failure

**Usage:**
```bash
node migrations/scripts/migrate_v0.2_to_v0.3.js <GUILD_ID> [TIMEZONE] [YEAR]
```

**Documentation:**
- Quick Start: [`../QUICKSTART.md`](../QUICKSTART.md)
- Full Guide: [`../README.md`](../README.md)

---

## Adding New Migrations

When creating new migration scripts:

1. Name format: `migrate_vX.X_to_vY.Y.js`
2. Include help text in script header
3. Document in main README
4. Test thoroughly before release
5. Include rollback capability
6. Add to this index

---

## Best Practices

- ✅ Always backup before migration
- ✅ Test on a copy first
- ✅ Verify data after migration
- ✅ Keep backups until confirmed working
- ⚠️ Never delete backups immediately
- ⚠️ Read documentation before running
