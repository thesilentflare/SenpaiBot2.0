# PikaGacha Commands Reference

Complete command reference for the PikaGacha module. All commands are message-based (not slash commands).

---

## 📊 Command Categories

- [Getting Started](#getting-started) - Registration and signup
- [Gacha & Rolling](#gacha--rolling) - Roll for Pokemon
- [Profile & Economy](#profile--economy) - Check stats and points
- [Inventory Management](#inventory-management) - View and manage Pokemon
- [Collection](#collection) - Pokemon lookup and favorites
- [Social & Trading](#social--trading) - Trade and battle with others
- [Leaderboards](#leaderboards) - Competitive rankings
- [Admin Commands](#admin-commands) - Database and focus management

---

## Getting Started

### `!register <trainer_name>`

Register as a Pokemon trainer to start playing PikaGacha.

**Usage:**

```
!register Ash                # Register as trainer "Ash"
!register "Red Oak"          # Use quotes for names with spaces
```

**Aliases:** `!signup`  
**Permissions:** All users  
**Requirements:**

- Name must be 2-20 characters
- Name must be unique (not taken by another user)

**Rewards:**

- **100 pikapoints** starter bonus
- Access to all PikaGacha features
- Personal trainer profile card

**Notes:**

- You only need to register once
- You can update your trainer name by registering again
- This creates both your User and Trainer profiles

---

## Gacha & Rolling

### `!roll [region]`

Roll the gacha for a random Pokemon.

**Usage:**

```
!roll              # Roll in all regions
!roll kanto        # Roll only in Kanto region
!roll johto        # Roll only in Johto region
```

**Cost:** 30 pikapoints per roll  
**Permissions:** All users  
**Regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, special

**Features:**

- Pity system: 3★ (540), 4★ (420), 5★ (30), Focus (10)
- 3pt jackpot contribution per roll
- Automatic rarity determination
- Region-specific or global rolls

---

### `!fullroll [region] [count]`

Roll multiple times at once.

**Usage:**

```
!fullroll              # Roll 10 times (all regions)
!fullroll kanto 5      # Roll 5 times in Kanto
!fullroll special 1    # Roll once in special region
```

**Cost:** 30 pikapoints × count  
**Permissions:** All users  
**Default count:** 10

**Notes:**

- Batch rolls for convenience
- Same pity system as single rolls
- All results shown in one embed

---

## Profile & Economy

### `!trainer <name>`

View a trainer's profile card with all stats.

**Usage:**

```
!trainer YourName
!trainer "Player Two"    # Use quotes for names with spaces
```

**Permissions:** All users  
**Displays:**

- Trainer name and rank
- Total EXP and rank progress
- Prestige level
- Team affiliation
- All statistics (rolls, battles, wins, trades, etc.)

---

### `!balance`

Check your pikapoints and savings balance.

**Usage:**

```
!balance
```

**Permissions:** All users  
**Displays:**

- Current pikapoints (spendable currency)
- Savings account balance
- Total combined balance

**Related:** Points are earned from releases, battles, and jackpots

---

## Inventory Management

### `!bag [user]`

View your or another user's item bag.

**Usage:**

```
!bag              # View your own bag
!bag @User        # View another user's bag (mention)
!bag 123456789    # View by user ID
```

**Permissions:** All users  
**Displays:**

- Pokeballs (1★ - Common)
- Great Balls (2★ - Uncommon)
- Ultra Balls (3★ - Rare)
- Master Balls (4★ - Special)

---

### `!open <ball_type>`

Open a ball from your bag.

**Usage:**

```
!open pokeball
!open greatball
!open ultraball
!open masterball
```

**Permissions:** All users  
**Mechanics:**

- 50% chance: Receive pikapoints (based on ball rarity)
- 50% chance: Receive a Pokemon (based on ball roll rates)
- Ball is consumed on use

**Ball Values:**

- Pokeball: 5-15 points or 1-3★ Pokemon
- Great Ball: 10-25 points or 2-4★ Pokemon
- Ultra Ball: 20-40 points or 3-5★ Pokemon
- Master Ball: 30-60 points or 4-6★ Pokemon

---

## Collection

### `!pokedex <pokemon_name_or_id>`

Look up information about a Pokemon.

**Usage:**

```
!pokedex Pikachu
!pokedex 25
!pokedex Charizard
```

**Permissions:** All users  
**Displays:**

- Pokemon name and ID
- Rarity (star rating)
- Base Stat Total (BST)
- Region
- Serebii sprite image
- Focus status

---

### `!inventory [user]`

View your or another user's Pokemon collection.

**Usage:**

```
!inventory           # View your own collection
!inventory @User     # View another user's collection
!inventory 123456789 # View by user ID
```

**Permissions:** All users  
**Display Format:**

- Grouped by rarity (8★ → 1★)
- Shows Pokemon name and count
- Total Pokemon count
- Collection statistics

---

### `!release <pokemon_name> [all|dupes]`

Release Pokemon for pikapoints.

**Usage:**

```
!release Pidgey          # Release one Pidgey
!release Pidgey all      # Release all Pidgeys
!release Pidgey dupes    # Release duplicate Pidgeys (keep 1)
```

**Permissions:** All users  
**Release Values:**

- 3★ = 5 pikapoints
- 4★ = 10 pikapoints
- 5★ = 15 pikapoints
- 6★ = 30 pikapoints
- 7★ = 60 pikapoints
- 8★ = 45 pikapoints

**Protections:**

- Cannot release last copy if using `dupes`
- Favorite Pokemon cannot be released
- Confirmation required for `all`

---

### `!releasedupes <rarity> [region]`

Bulk release duplicate Pokemon by rarity.

**Usage:**

```
!releasedupes 3              # Release all 3★ duplicates
!releasedupes 4 kanto        # Release all 4★ Kanto duplicates
!releasedupes five           # Can use word or number
!releasedupes all            # Release ALL duplicates (3★+)
```

**Permissions:** All users  
**Valid Rarities:** 3, 4, five (5★+), all  
**Regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, special (optional)

**Protections:**

- Keeps one copy of each Pokemon
- Skips favorite Pokemon
- Cannot release 1-2★ (too low value)

---

### `!favorite <pokemon_name>`

Toggle a Pokemon as favorite.

**Usage:**

```
!favorite Charizard
!favorite Pikachu
```

**Permissions:** All users  
**Effects:**

- Marks Pokemon as favorite (prevents release)
- Can unfavorite by using command again
- Toggle on/off

---

### `!favorites`

View your favorite Pokemon.

**Usage:**

```
!favorites
```

**Permissions:** All users  
**Displays:**

- List of all favorited Pokemon
- Pokemon name and rarity
- Total favorite count

---

## Social & Trading

### `!trade <your_pokemon> <their_pokemon> <their_id>`

Trade Pokemon with another user.

**Usage:**

```
!trade Charizard Blastoise @User
!trade Pikachu Mewtwo 123456789012345678
```

**Permissions:** All users  
**Cost:** 60 × rarity pikapoints (both users pay)

**Mechanics:**

- Both Pokemon must be same rarity
- Both users must own their Pokemon
- Both users must have enough pikapoints
- Requires confirmation via ✅/❌ reactions (30s timeout)
- Points deducted from both users
- Pokemon ownership transferred

**Example:**
Trading 5★ Pokemon costs both users 300 pikapoints (60 × 5)

---

### `!battle <their_id> <wager>`

Challenge another user to a Pokemon battle.

**Usage:**

```
!battle @User 50
!battle 123456789012345678 25
```

**Permissions:** All users  
**Wager Range:** 1-100 pikapoints  
**Minimum Balance:** -100 pikapoints (prevents battle if below)

**Battle Flow:**

1. Challenge user (✅/❌ confirmation, 30s timeout)
2. Both players choose Pokemon (30s each)
3. Visual battle preview generated (image with stats, odds, payouts)
4. Both players confirm (✅/❌, 60s timeout)
5. Battle executes (BST-based winner determination)
6. Winner receives wager, loser pays wager
7. Both players gain EXP (10-30 winner, 5-15 loser)

**BST Calculation:**

- Base BST + (5 × duplicate count)
- Win odds calculated from BST ratio
- Payout scales with odds (higher odds = lower payout)

**Special Stats:**

- Underdog win: Win with ≤35% odds
- High stake win: Win with wager ≥85
- Never lucky: Lose with ≥65% odds
- High stake loss: Lose with wager ≥85

---

## Leaderboards

### `!leaderboard [stat_type]`

View leaderboards for various stats.

**Alias:** `!lb`

**Usage:**

```
!leaderboard              # Show available categories
!leaderboard totalxp      # Total EXP leaderboard
!leaderboard wins         # Battle wins leaderboard
!leaderboard rolls        # Pokemon rolled leaderboard
```

**Permissions:** All users  
**Display:** Top 10 trainers per category

**Available Categories:**

- `totalxp` - Total EXP Gained
- `rolls` - Pokemon Rolled
- `bricks` - Bricks (low rarity rolls)
- `jackpots` - Jackpot Participation
- `opens` - Balls Opened
- `releases` - Pokemon Released
- `trades` - Pokemon Traded
- `quizzes` - Quizzes Answered
- `streaks` - Hot Streaks
- `shutdowns` - Hot Streak Shutdowns
- `highstreak` - Highest Streak
- `battles` - Total Battles
- `wins` - Total Wins
- `underdogs` - Underdog Wins (≤35% odds)
- `highstakewins` - High Stake Wins (≥85 wager)
- `losses` - Total Losses
- `neverlucky` - Never Lucky Losses (≥65% odds)
- `highstakeloss` - High Stake Losses (≥85 wager)

---

## Admin Commands

**⚠️ Admin-only commands use the server's admin system.**

**Who has access:**

- Server owner (automatic admin)
- Users added via `!admin add @user` command

**Managing admins:**

```
!admin add @User        # Grant admin permissions
!admin remove @User     # Revoke admin permissions
!admin list             # View all admins
```

See the [adminManager module](../../adminManager/README.md) for details.

---

### `!reseed [--confirm]`

Reseed Pokemon database from CSV file.

**Usage:**

```
!reseed              # Show warning and instructions
!reseed --confirm    # Execute the reseed
```

**Permissions:** Admins only  
**Safe while bot is running:** ✅ Yes

**What it does:**

- Reads `pokedata.csv` from scripts directory
- Updates existing Pokemon with new stats
- Adds new Pokemon entries
- Does NOT delete user data (inventories, favorites, battles, etc.)
- Shows progress: "X inserted, Y updated"

**When to use:**

- After updating `pokedata.csv`
- Adding new Pokemon
- Fixing Pokemon stats (BST, rarity, names)
- Initial database population

**Safety:**

- Uses atomic transactions
- `findOrCreate` prevents duplicates
- Only touches Pokemon table
- User data (User, Inventory, Trainer, etc.) untouched

---

### `!setfocus <pokemon_name_or_id> <true|false>`

Set a Pokemon as focus (rate-up).

**Usage:**

```
!setfocus Charizard true     # Set Charizard as focus
!setfocus 6 false            # Remove focus from ID 6
!setfocus Pikachu true       # Focus Pikachu
```

**Permissions:** Admins only  
**Effect:** Immediate (next gacha roll uses new focus state)

**What is Focus:**

- Focus Pokemon have increased rate during rolls
- Focus pity counter (starts at 10, +5 per roll without focus)
- Used for special events or rate-up campaigns
- Multiple Pokemon can be focus simultaneously

**Mechanics:**

- When pity roll triggers (0 on 0-1003 range), random focus Pokemon is selected
- Focus Pokemon bypass normal rarity rates
- Focus counter resets when focus Pokemon is rolled

---

### `!addpoints <@user|user_id> <amount>`

Give pikapoints to any user.

**Usage:**

```
!addpoints @User 1000           # Give 1000 points to @User
!addpoints 123456789 500        # Give 500 points by user ID
```

**Permissions:** Admins only  
**Notes:**

- Amount must be a positive number
- Creates user account if they don't exist
- Shows old and new balance
- Logs admin action

---

### `!removepoints <@user|user_id> <amount>`

Remove pikapoints from any user.

**Usage:**

```
!removepoints @User 500         # Remove 500 points from @User
!removepoints 123456789 100     # Remove 100 points by user ID
```

**Permissions:** Admins only  
**Notes:**

- Amount must be a positive number
- Can result in negative balance
- Shows old and new balance
- Logs admin action

---

### `!giveall <amount> [--confirm]`

Give pikapoints to all registered trainers.

**Usage:**

```
!giveall 500                # Preview mass give
!giveall 1000 --confirm     # Execute mass give
```

**Permissions:** Admins only  
**Notes:**

- Amount must be a positive number
- Requires `--confirm` flag to execute
- Shows preview first (how many users, total points)
- Gives points to ALL registered trainers
- Shows success/fail count after execution
- Logs admin action

**Use cases:**

- Server events and celebrations
- Compensating for downtime
- Special promotions
- Season rewards

---

## Permission Summary

| Command Category  | Who Can Use | Notes                                        |
| ----------------- | ----------- | -------------------------------------------- |
| Gacha & Rolling   | Everyone    | Requires pikapoints                          |
| Profile & Economy | Everyone    | -                                            |
| Inventory         | Everyone    | Can view others' inventories                 |
| Collection        | Everyone    | -                                            |
| Release           | Everyone    | Own Pokemon only                             |
| Trading           | Everyone    | Requires pikapoints, both users must confirm |
| Battles           | Everyone    | Requires pikapoints, both users participate  |
| Leaderboards      | Everyone    | -                                            |
| Admin Commands    | Admins only | Server owner or database admins              |

---

## Command Aliases

| Command        | Aliases |
| -------------- | ------- |
| `!leaderboard` | `!lb`   |
| `!favorite`    | `!fav`  |

---

## Cost Summary

| Action        | Cost                                |
| ------------- | ----------------------------------- |
| Single roll   | 30 pikapoints                       |
| Multi-roll    | 30 × count pikapoints               |
| Trade         | 60 × rarity pikapoints (both users) |
| Battle        | User-defined wager (1-100)          |
| Open ball     | 1 ball (consumed)                   |
| Release       | Free (earns points)                 |
| Favorite      | Free                                |
| View commands | Free                                |

---

## Economy Flow

**Earning Pikapoints:**

- Release Pokemon (5-60 per Pokemon based on rarity)
- Win battles (equals wager amount)
- Open balls (50% chance, 5-60 points based on ball type)
- Jackpot wins (varies, 2× for Mythic)

**Spending Pikapoints:**

- Roll gacha (30 per roll)
- Trade Pokemon (60 × rarity)
- Battle wagers (1-100)

**Banking:**

- Deposit points to savings (safe storage)
- Withdraw from savings when needed
- Total balance = pikapoints + savings

---

## Notes

- All commands are case-insensitive
- Pokemon names are case-insensitive
- User mentions (@User) or user IDs work for user arguments
- Region names can be lowercase (kanto, johto, etc.)
- Commands require minimum pikapoint balance where applicable
- Favorite Pokemon are protected from release commands
- Battle wagers are limited to 1-100 to prevent excessive losses
- Minimum balance for battles is -100 (debt limit)

---

## Support & Troubleshooting

**"You don't have enough pikapoints!"**
→ Release Pokemon or win battles to earn more

**"This command is admin-only!"**
→ Only server owners and database admins can use `!reseed` and `!setfocus`. Use `!admin add @User` to grant admin permissions.

**"Trade timed out..."**
→ One user didn't react within 30 seconds, try again

**"Pokemon not found!"**
→ Check spelling or use Pokemon ID instead

**"You cannot release your last copy!"**
→ Use `!release pokemon all` to release all copies

**"This Pokemon is favorited!"**
→ Unfavorite first with `!favorite pokemon`

---

For detailed implementation information, see [IMPLEMENTATION.md](IMPLEMENTATION.md)
