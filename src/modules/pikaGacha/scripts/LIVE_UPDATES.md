# Live Database Updates

## Reseeding While Bot is Running

You have **two options** to update Pokemon data while the bot is running:

### Option 1: Admin Command (Recommended)

Use the `!reseed` command from Discord:

```
!reseed --confirm
```

**Features:**

- ✅ Safe to run while bot is active
- ✅ Updates existing Pokemon with new stats
- ✅ Adds new Pokemon entries
- ✅ Does NOT delete user data (inventories, favorites, etc.)
- ✅ Provides progress feedback in Discord
- ✅ Admin-only access

**Setup:**

1. If you're the server owner, you're already an admin!
2. To add other admins, use: `!admin add @User`
3. Run `!reseed --confirm` in Discord

**How it works:**

```
User: !reseed
Bot: ⚠️ Warning message with confirmation request

User: !reseed --confirm
Bot: 🔄 Starting database reseed...
     ... processing ...
Bot: ✅ Complete! 10 added, 809 updated
```

### Option 2: Standalone Script

Run the seeding script directly (bot can stay running):

```bash
npx ts-node src/modules/pikaGacha/scripts/seedPokemon.ts
```

**Why this is safe:**

- Sequelize uses connection pooling - the script creates its own connection
- `findOrCreate` prevents duplicates
- Updates are atomic (all-or-nothing per Pokemon)
- No locks on read operations (bot can still query while seeding)

**When to use:**

- Bulk updates to pokedata.csv
- Initial seeding before bot starts
- Automated/scheduled updates

## Admin Commands

### Set Focus Pokemon

```
!setfocus Charizard true    # Set as focus (rate-up)
!setfocus 6 false           # Remove focus
```

This updates the database immediately. Active gacha rolls will use the new focus state.

## Configuration

**Admin Access:**
Both commands check admin permissions using the server's admin system:

- **Server owners** are automatically admins (no setup needed)
- **Other users** can be granted admin via `!admin add @User`
- View all admins with `!admin list`
- Revoke admin with `!admin remove @User`

The admin system uses the database (Admins table) so permissions persist across bot restarts.

## Safety Notes

### What's Safe:

✅ Running `!reseed` while users are actively using the bot
✅ Running the script while the bot is online
✅ Updating Pokemon stats (BST, rarity, name)
✅ Adding new Pokemon
✅ Setting focus Pokemon during events

### What to Avoid:

❌ Manually editing the database file while bot is writing to it
❌ Running multiple reseeds simultaneously
❌ Changing Pokemon IDs (this affects user inventories)

## Database Transactions

Both methods use Sequelize transactions to ensure data integrity:

```typescript
// Each Pokemon update is atomic
await Pokemon.findOrCreate({ ... }); // Creates OR skips
await pokemon.update({ ... });        // Updates atomically
```

User data (inventories, favorites, battles) remains untouched during reseeds.

## Monitoring

Check logs for reseed progress:

```
[PikaGacha] Reseeding 809 Pokemon...
[PikaGacha] Progress: 100/809
[PikaGacha] Progress: 200/809
...
[PikaGacha] Reseed complete: 10 inserted, 809 updated
```

## Troubleshooting

**"This command is admin-only"**

- If you're the server owner, this shouldn't happen - contact support
- If you're not the server owner, ask an admin to run `!admin add @YourName`
- Check current admins with `!admin list`

**CSV file not found**

- Ensure `pokedata.csv` exists at `src/modules/pikaGacha/scripts/pokedata.csv`

**Bot seems slow during reseed**

- Normal - the reseed locks the Pokemon table briefly
- Users can still use other commands
- Consider reseeding during low-activity periods for large updates

**Database locked error**

- SQLite limitation - wait a moment and retry
- Or use the Discord command which handles retries automatically
