# PikaGacha Commands Reference

Complete command reference for the PikaGacha module. All commands use the `!pg` prefix and are message-based (not slash commands).

---

## 📊 Command Categories

- [Getting Started](#getting-started) - Registration and signup
- [Gacha & Rolling](#gacha--rolling) - Roll for Pokemon
- [Profile & Economy](#profile--economy) - Check stats and points
- [Inventory Management](#inventory-management) - View and manage Pokemon
- [Collection](#collection) - Pokemon lookup and favorites
- [Social & Trading](#social--trading) - Trade and battle with others
- [Leaderboards](#leaderboards) - Competitive rankings
- [Rank System](#rank-system) - Promotion and prestige
- [Regions](#regions) - Available rolling regions
- [Admin Commands](#admin-commands) - Database and focus management

---

## Getting Started

### `!pg register <trainer_name>`

Register as a Pokemon trainer to start playing PikaGacha.

**Usage:**

```
!pg register Ash                # Register as trainer "Ash"
!pg register Red Oak            # Use spaces freely for names
```

**Aliases:** `!pg signup`  
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
- This creates both your User and Trainer profiles

---

## Gacha & Rolling

### `!pg roll [region] [count]`

Roll the gacha for a random Pokemon.

**Usage:**

```
!pg roll              # Roll in all regions
!pg roll kanto        # Roll only in Kanto region
!pg roll johto 5      # Roll 5 times in Johto
!pg roll 10           # Roll 10 times in all regions
```

**Cost:** 30 pikapoints per roll  
**Permissions:** All users  
**Regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, paldea, special  
_(Use `!pg regions` to see which regions are currently available)_

**Features:**

- Pity system: guarantees higher rarity after many low-rarity rolls
- 3pt jackpot contribution per roll
- Automatic rarity determination
- Region-specific or global rolls
- Max 30 rolls per command

---

### `!pg fullroll [region] [count] [--detailed|-d]`

Roll multiple times with condensed results in a single embed.

**Usage:**

```
!pg fullroll               # Roll 10 times (all regions)
!pg fullroll kanto 5       # Roll 5 times in Kanto
!pg fullroll 20            # Roll 20 times all regions
!pg fullroll 10 --detailed # Detailed breakdown
```

**Cost:** 30 pikapoints × count  
**Permissions:** All users  
**Default count:** 10

**Flags:**

- `--detailed` / `-d` — Show full details for each individual roll

---

## Profile & Economy

### `!pg trainer [user]`

View a trainer's profile card with all stats.

**Usage:**

```
!pg trainer               # View your own profile
!pg trainer @User         # View another user's profile
!pg trainer "Player Two"  # Use quotes for names with spaces
```

**Aliases:** `!pg profile`  
**Permissions:** All users  
**Displays:**

- Trainer name and rank
- Total EXP and rank progress
- Prestige level
- Team affiliation
- All statistics (rolls, battles, wins, trades, etc.)

---

### `!pg balance`

Check your pikapoints and savings balance.

**Usage:**

```
!pg balance
!pg bal        # Short alias
```

**Aliases:** `!pg bal`  
**Permissions:** All users  
**Displays:**

- Current pikapoints (spendable currency)
- Savings account balance
- Total combined balance

---

### `!pg transfer <amount|all>`

Move pikapoints into your savings account.

**Usage:**

```
!pg transfer 500       # Save 500 points
!pg transfer all       # Save all available points
```

**Permissions:** All users

---

### `!pg withdraw <amount|all>`

Withdraw pikapoints from your savings account.

**Usage:**

```
!pg withdraw 500       # Withdraw 500 points
!pg withdraw all       # Withdraw all savings
```

**Permissions:** All users

---

## 💰 Ways to Earn Pikapoints

PikaGacha has multiple ways to earn pikapoints for more rolls and activities:

### Active Earning Methods

1. **Registration Bonus** - 100 pikapoints (one-time)
2. **Opening Balls** - 1-150 pikapoints based on ball rarity
3. **Releasing Pokemon** - 5-60 pikapoints based on Pokemon rarity
4. **Winning Battles** - Wager amount (1-100 pikapoints)
5. **Jackpot Wins** - Share of communal pool for ultra-rare Pokemon
6. **Quiz System** - 20-60 pikapoints for answering Pokemon trivia

### Passive Earning Methods

7. **League of Legends Games** - 30 pikapoints for completing 15+ minute matches
   - Automatically tracks your Discord status
   - Must be playing for the full game duration
   - Prevents farming from short matches

8. **Voice Channel** - Points every interval while in a voice channel with 2+ people

9. **Quiz Streak Bonuses** - Additional rewards for consecutive correct answers
   - Streak multiplier: 20 + (10 × current_streak), max 60 points
   - Ball rewards at streaks 5, 10, 15, 20+ (Pokeball → Masterball)
   - Shutdown bonuses when other players break your streak

### Admin Commands

10. **Manual Awards** - Administrators can grant points for events or rewards

---

## Inventory Management

### `!pg bag [user]`

View your or another user's item bag (visual sprite display).

**Usage:**

```
!pg bag              # View your own bag
!pg bag @User        # View another user's bag (mention)
```

**Permissions:** All users  
**Displays:**

- Poké Balls (3-4★ Pokemon or 1-15 pts)
- Great Balls (3-5★ Pokemon or 15-30 pts)
- Ultra Balls (4-6★ Pokemon or 30-60 pts)
- Master Balls (5-7★ Pokemon or 60-150 pts)

---

### `!pg open <ball_type> [amount|all]`

Open a ball from your bag.

**Usage:**

```
!pg open pokeball             # Open 1 Poké Ball
!pg open greatball 5          # Open 5 Great Balls
!pg open ultraball all        # Open all Ultra Balls
!pg open all                  # Open ALL balls of every type
```

**Aliases for ball types:** `poke`, `great`, `ultra`, `master`  
**Permissions:** All users  
**Mechanics:**

- 50% chance: Receive pikapoints (based on ball rarity)
- 50% chance: Receive a Pokemon (based on ball roll rates)
- Ball is consumed on use
- Max 100 balls per command (except `all`)

**Ball Values:**

- Pokeball: 1-15 points or 3-4★ Pokemon
- Great Ball: 15-30 points or 3-5★ Pokemon
- Ultra Ball: 30-60 points or 4-6★ Pokemon
- Master Ball: 60-150 points or 5-7★ Pokemon

---

## Collection

### `!pg pokedex <pokemon_name_or_id>`

Look up information about a specific Pokemon.

**Usage:**

```
!pg pokedex Pikachu
!pg pokedex 25
!pg pokedex Charizard
```

**Aliases:** `!pg dex`  
**Permissions:** All users  
**Displays:**

- Pokemon name and ID
- Rarity (star rating)
- Base Stat Total (BST)
- Region
- Official artwork sprite
- Focus status

---

### `!pg inventory [user]`

View your or another user's Pokemon collection (text list).

**Usage:**

```
!pg inventory           # View your own collection
!pg inventory @User     # View another user's collection
```

**Aliases:** `!pg inv`  
**Permissions:** All users  
**Display Format:**

- Grouped by rarity (8★ → 1★)
- Shows Pokemon name and count
- Total Pokemon count

---

### `!pg box [user] [--favorites|-f]`

View Pokemon collection with visual sprites (paginated grid).

**Usage:**

```
!pg box                    # View your box (6×3 grid, paginated)
!pg box @User              # View another user's box
!pg box --favorites        # View favorites only (3×2 grid)
!pg box @User --favorites  # View user's favorites
```

**Permissions:** All users

---

### `!pg release <pokemon_name> [count]`

Release Pokemon for pikapoints.

**Usage:**

```
!pg release Pidgey          # Release one Pidgey
!pg release Pidgey 5        # Release 5 Pidgeys
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

- Favorite Pokemon cannot be released
- Cannot release more than you own

---

### `!pg releasedupes [--confirm]`

Bulk release all duplicate Pokemon (keeps 1 of each).

**Usage:**

```
!pg releasedupes              # Preview what will be released
!pg releasedupes --confirm    # Execute the release
```

**Permissions:** All users

**Protections:**

- Keeps one copy of each Pokemon
- Skips favorite Pokemon

---

### `!pg favorite <pokemon_name>`

Toggle a Pokemon as favorite (protects from release).

**Usage:**

```
!pg favorite Charizard
!pg fav Pikachu
```

**Aliases:** `!pg fav`  
**Permissions:** All users  
**Effects:**

- Marks Pokemon as favorite (prevents release)
- Toggle on/off — use command again to unfavorite

---

### `!pg favorites [user]`

View your or another user's favorite Pokemon.

**Usage:**

```
!pg favorites
!pg favorites @User
!pg favs
```

**Aliases:** `!pg favs`  
**Permissions:** All users

---

## Social & Trading

### `!pg trade <@user>`

Trade Pokemon with another user.

**Usage:**

```
!pg trade @User
```

**Permissions:** All users

**Mechanics:**

- Initiate trade with a mention
- Both players select a Pokemon to offer
- Both players confirm the trade
- Pokemon ownership is swapped

---

### `!pg battle <@user>`

Challenge another user to a Pokemon battle.

**Usage:**

```
!pg battle @User
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
7. Both players gain EXP

**BST Calculation:**

- Base BST + (5 × duplicate count)
- Win odds calculated from BST ratio

**Special Stats:**

- Underdog win: Win with ≤35% odds
- High stake win: Win with wager ≥85
- Never lucky: Lose with ≥65% odds
- High stake loss: Lose with wager ≥85

---

## Leaderboards

### `!pg leaderboard [stat_type]`

View leaderboards for various stats.

**Alias:** `!pg lb`

**Usage:**

```
!pg leaderboard              # Show available categories
!pg leaderboard totalxp      # Total EXP leaderboard
!pg leaderboard wins         # Battle wins leaderboard
!pg leaderboard rolls        # Pokemon rolled leaderboard
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

### `!pg jackpot`

View the current jackpot pool and your contribution.

**Usage:**

```
!pg jackpot
```

**Permissions:** All users  
**Mechanics:**

- Every roll contributes 3 points to the communal jackpot pool
- Rolling a 6★ Legendary pays out the jackpot at 1×
- Rolling a 7★ Mythic pays out the jackpot at 2×
- All contributors with 3+ points split the pool equally
- Each winner also receives a random ball

---

## Rank System

The PikaGacha module features a rank progression system where trainers gain experience (EXP) through various activities and advance through 13 ranks.

### How to Gain EXP

- **Rolling Pokemon:** +1 EXP per roll
- **Opening Balls:** +1 EXP per ball opened
- **Winning Battles:** Variable EXP based on battle outcome

### `!pg promote`

Advance to the next rank when you have enough EXP.

**Usage:**

```
!pg promote              # Promote to the next rank
```

**Permissions:** All users  
**Requirements:** Must have enough rank EXP for the next rank

**Features:**

- Advances you to the next rank in the progression
- Resets your rank EXP to 0
- Awards balls based on rank tier
- Check your current rank and EXP progress with `!pg trainer`

**Rank Progression:**

| #   | Rank           | EXP Required | Reward                            |
| --- | -------------- | ------------ | --------------------------------- |
| 1   | **Recruit**    | 0            | Starting rank                     |
| 2   | **Crook**      | 250          | 1× Poké Ball                      |
| 3   | **Grunt**      | 500          | 1× Poké Ball                      |
| 4   | **Thug**       | 750          | 1× Poké Ball                      |
| 5   | **Associate**  | 1,000        | 1× Poké Ball                      |
| 6   | **Hitman**     | 1,250        | 1× Poké Ball                      |
| 7   | **Officer**    | 1,500        | 1× Great Ball                     |
| 8   | **Sergeant**   | 1,750        | 1× Great Ball                     |
| 9   | **Captain**    | 2,000        | 1× Great Ball                     |
| 10  | **Lieutenant** | 2,250        | 1× Great Ball                     |
| 11  | **Admin**      | 2,500        | 1× Ultra Ball                     |
| 12  | **Commander**  | 2,750        | 1× Ultra Ball                     |
| 13  | **Boss**       | 3,500        | 1× Ultra Ball → Prestige eligible |

---

### `!pg prestige`

Reset to Recruit rank from Boss rank to earn a Master Ball and increase your prestige level.

**Usage:**

```
!pg prestige             # Prestige from Boss rank
```

**Permissions:** All users  
**Requirements:** Must be at Boss rank

**Effects:**

- Resets rank to **Recruit**
- Resets rank EXP to 0
- Increments your prestige level by 1
- Awards **1× Master Ball**
- Pokemon collection is NOT affected

---

## Regions

### `!pg regions`

List all Pokemon regions and their current availability in the database.

**Usage:**

```
!pg regions
```

**Permissions:** All users  
**Displays:**

- All 10 regions (Kanto through Paldea + Special)
- Pokemon count per region (if seeded)
- Regions without Pokemon are labelled **Future Release**
- ID ranges for each region

**All Regions:**

| Region  | ID Range   | Notes                |
| ------- | ---------- | -------------------- |
| Kanto   | #1–#151    | Gen 1                |
| Johto   | #152–#251  | Gen 2                |
| Hoenn   | #252–#386  | Gen 3                |
| Sinnoh  | #387–#493  | Gen 4                |
| Unova   | #494–#649  | Gen 5                |
| Kalos   | #650–#721  | Gen 6                |
| Alola   | #722–#809  | Gen 7                |
| Galar   | #810–#905  | Gen 8                |
| Paldea  | #906–#1025 | Gen 9                |
| Special | #10000+    | Event/custom Pokemon |

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

### `!pg reseed [--confirm]`

Reseed Pokemon database from the active CSV seed file.

**Usage:**

```
!pg reseed              # Show warning and instructions
!pg reseed --confirm    # Execute the reseed
```

**Permissions:** Admins only  
**Safe while bot is running:** ✅ Yes

**What it does:**

- Reads the latest seed file (uploaded or default `pokedata.csv`)
- Updates existing Pokemon with new stats
- Adds new Pokemon entries
- Does NOT delete user data (inventories, favorites, battles, etc.)
- Shows progress: "X inserted, Y updated"

**When to use:**

- After uploading a new `!pg uploadseed` file
- Adding new Pokemon
- Fixing Pokemon stats (BST, rarity, names)

---

### `!pg setfocus <pokemon_name_or_id> <true|false>`

Set a Pokemon as focus (rate-up) for the gacha.

**Usage:**

```
!pg setfocus Charizard true     # Set Charizard as focus
!pg setfocus 6 false            # Remove focus from ID 6
```

**Permissions:** Admins only  
**Effect:** Immediate (next gacha roll uses new focus state)

**What is Focus:**

- Focus Pokemon have increased rate during rolls
- Multiple Pokemon can be focus simultaneously
- Focus counter resets when a focus Pokemon is rolled

---

### `!pg removefocus`

Remove focus status from ALL Pokemon at once.

**Usage:**

```
!pg removefocus
```

**Permissions:** Admins only  
**Effect:** Clears focus flag on all Pokemon; all return to normal rates.

---

### `!pg addpoints <@user|user_id> <amount>`

Give pikapoints to any user.

**Usage:**

```
!pg addpoints @User 1000           # Give 1000 points to @User
!pg addpoints 123456789 500        # Give 500 points by user ID
```

**Permissions:** Admins only  
**Notes:**

- Amount must be a positive number
- Creates user account if they don't exist
- Shows old and new balance

---

### `!pg removepoints <@user|user_id> <amount>`

Remove pikapoints from any user.

**Usage:**

```
!pg removepoints @User 500         # Remove 500 points from @User
!pg removepoints 123456789 100     # Remove 100 points by user ID
```

**Permissions:** Admins only  
**Notes:**

- Amount must be a positive number
- Can result in negative balance

---

### `!pg giveall <amount> [--confirm]`

Give pikapoints to all registered trainers.

**Usage:**

```
!pg giveall 500                # Preview mass give
!pg giveall 1000 --confirm     # Execute mass give
```

**Permissions:** Admins only  
**Notes:**

- Requires `--confirm` flag to execute
- Shows preview first (how many users, total points)
- Gives points to ALL registered trainers

**Use cases:**

- Server events and celebrations
- Compensating for downtime
- Season rewards

---

### `!pg triggerquiz [text|sprite]`

Manually trigger a quiz question in 10 seconds.

**Usage:**

```
!pg triggerquiz            # Trigger a random quiz type
!pg triggerquiz text       # Trigger a text-based quiz
!pg triggerquiz sprite     # Trigger a sprite-based quiz
```

**Permissions:** Admins only  
**Requirements:** Quiz system must be active and no quiz currently running

---

### `!pg voicestats [@user|user_id]`

View voice channel reward stats for a user.

**Usage:**

```
!pg voicestats             # View your own voice stats
!pg voicestats @User       # View another user's stats
!pg voicestats 123456789   # View by user ID
```

**Permissions:** Admins only  
**Displays:** Current voice status, time in voice, next reward countdown

---

### `!pg uploadseed`

Upload a new CSV seed file for Pokemon data.

**Usage:**

```
!pg uploadseed    # (attach a .csv file to the message)
```

**Permissions:** Admins only  
**CSV Format:** `id,name,rarity,focus,bst`

**Notes:**

- Attach a `.csv` file to the message
- File is saved and becomes the active seed for the next `!pg reseed`
- Validates CSV format before saving
- Run `!pg reseed --confirm` after uploading to apply the data

---

### `!pg listseeds`

List all uploaded seed files.

**Usage:**

```
!pg listseeds
```

**Permissions:** Admins only  
**Displays:** All uploaded CSV files with size and upload date, and which is currently active

---

### `!pg downloadseed`

Download the current active seed CSV file for editing.

**Usage:**

```
!pg downloadseed
```

**Permissions:** Admins only  
**Notes:** Returns the file as a Discord attachment for local editing

---

### `!pg giftballs <@user|user_id> <ball_type> <amount>`

Gift balls to a specific user.

**Usage:**

```
!pg giftballs @User pokeball 10       # Gift 10 Poké Balls
!pg giftballs 123456789 masterball 1  # Gift 1 Master Ball by ID
```

**Permissions:** Admins only  
**Ball Types:** pokeball (1), greatball (2), ultraball (3), masterball (4)  
**Max:** 1000 balls per gift

---

### `!pg addregion <region> [--confirm]`

Auto-fetch and add a new region's Pokémon from PokéAPI into the database.

**Usage:**

```
!pg addregion galar            # Preview what would be fetched — no changes made
!pg addregion galar --confirm  # Fetch data and add to DB
!pg addregion paldea --confirm # Add Paldea region
```

**Permissions:** Admins only  
**Supported regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, paldea

**What it does:**

1. Checks that the region isn't already seeded in the DB (aborts if it is)
2. Fetches each Pokémon in the region's ID range from PokéAPI (in batches of 10)
3. For each Pokémon: pulls BST from `/pokemon/{id}` and `is_legendary`/`is_mythical` from `/pokemon-species/{id}`
4. Auto-assigns rarity using the rules below
5. Appends new rows to the current seed CSV and saves it as a new timestamped file
6. Inserts the new Pokémon directly into the database

**Auto-Rarity Rules:**

| Condition | Rarity |
|-----------|--------|
| `is_mythical: true` | 7★ Mythic |
| `is_legendary: true` | 6★ Legendary |
| BST ≥ 540 | 5★ |
| BST ≥ 420 | 4★ |
| BST < 420 | 3★ |

**⚠️ Rarity Warning:**
Auto-assignment is a best-effort first pass. Rarities based on BST may not match your preferred balance (e.g. fan-favourite Pokémon may deserve a higher rarity regardless of BST). Always review and adjust after adding:
```
!pg downloadseed → edit CSV → !pg uploadseed → !pg reseed --confirm
```

**Safeguards:**

- ❌ Aborts if the region already has Pokémon in the DB
- ❌ Aborts if >10% of fetch calls fail with hard errors (network issues)
- ✅ 404s (alternate-form slots, ID gaps) are silently skipped and reported
- ✅ Each Pokémon is validated (valid BST > 0, non-empty name) before saving
- ✅ CSV is only saved after all fetches complete — no partial writes
- ✅ DB inserts use `findOrCreate` to prevent duplicates
- ✅ Requires `--confirm` flag to make any changes

**Notes:**

- The Special region is not supported (those are custom/event Pokémon)
- Estimated time: ~30–60 seconds for a typical region (96–105 Pokémon)
- After adding, use `!pg regions` to confirm the region is now available

---

### `!pg deletetrainer <@user|user_id>`

**⚠️ DANGEROUS ADMIN COMMAND**

Permanently delete a trainer and ALL their PikaGacha data.

**Usage:**

```
!pg deletetrainer @User                    # Delete by mention
!pg deletetrainer 123456789012345678       # Delete by ID
```

**Permissions:** Admins only  
**Confirmation Required:** ✅ Yes (30-second button confirmation)

**What it deletes:**

- Trainer profile (name, team, rank, EXP)
- All Pokemon in inventory
- All items (Poké Balls, Great Balls, etc.)
- All favorites
- All jackpot entries
- Resets pikapoints and savings to 0

**⚠️ WARNING: This action is permanent and cannot be undone!**

---

## Permission Summary

| Command Category  | Who Can Use | Notes                                 |
| ----------------- | ----------- | ------------------------------------- |
| Gacha & Rolling   | Everyone    | Requires pikapoints                   |
| Profile & Economy | Everyone    | -                                     |
| Inventory         | Everyone    | Can view others' inventories          |
| Collection        | Everyone    | -                                     |
| Release           | Everyone    | Own Pokemon only                      |
| Trading           | Everyone    | Both users must confirm               |
| Battles           | Everyone    | Requires pikapoints, both participate |
| Leaderboards      | Everyone    | -                                     |
| Regions           | Everyone    | -                                     |
| Admin Commands    | Admins only | Server owner or added admins          |

---

## Command Aliases

| Command           | Aliases       |
| ----------------- | ------------- |
| `!pg trainer`     | `!pg profile` |
| `!pg balance`     | `!pg bal`     |
| `!pg pokedex`     | `!pg dex`     |
| `!pg inventory`   | `!pg inv`     |
| `!pg leaderboard` | `!pg lb`      |
| `!pg favorite`    | `!pg fav`     |
| `!pg favorites`   | `!pg favs`    |
| `!pg register`    | `!pg signup`  |

---

## Cost Summary

| Action        | Cost                                        |
| ------------- | ------------------------------------------- |
| Single roll   | 30 pikapoints                               |
| Multi-roll    | 30 × count pikapoints                       |
| Trade         | Both players confirm (no point cost)        |
| Battle        | User-defined wager (1-100)                  |
| Open ball     | 1 ball (consumed)                           |
| Team switch   | Configurable (default: free for first join) |
| Release       | Free (earns points)                         |
| Favorite      | Free                                        |
| View commands | Free                                        |

---

## Economy Flow

**Earning Pikapoints:**

- Release Pokemon (5-60 per Pokemon based on rarity)
- Win battles (equals wager amount)
- Open balls (50% chance, 1-150 points based on ball type)
- Jackpot wins (varies, 2× for Mythic)
- Voice chat rewards (passive)
- League of Legends games (30 pts per game)
- Quiz correct answers (20-60 pts)

**Spending Pikapoints:**

- Roll gacha (30 per roll)
- Battle wagers (1-100)

**Banking:**

- Deposit points to savings (safe storage)
- Withdraw from savings when needed
- Total balance = pikapoints + savings

---

## Notes

- All commands require the `!pg` prefix (e.g. `!pg roll`, `!pg bag`)
- All commands are case-insensitive
- Pokemon names are case-insensitive
- User mentions (@User) or user IDs work for user arguments
- Region names can be lowercase (kanto, johto, etc.)
- Use `!pg regions` to check which regions have Pokemon seeded
- Favorite Pokemon are protected from all release commands
- Battle wagers are limited to 1-100 to prevent excessive losses
- Minimum balance for battles is -100 (debt limit)
- Add `help` after any command to see detailed usage: `!pg roll help`

---

## Support & Troubleshooting

**"You don't have enough pikapoints!"**
→ Release Pokemon, open balls, win battles, or join voice chat to earn more

**"This command is admin-only!"**
→ Only server owners and database admins can use admin commands. Use `!admin add @User` to grant admin permissions.

**"Trade timed out..."**
→ One user didn't react within 30 seconds, try again

**"Pokemon not found!"**
→ Check spelling or use Pokemon ID instead (`!pg pokedex 25`)

**"This Pokemon is favorited!"**
→ Unfavorite first with `!pg favorite <pokemon>`

**"No pokemon available for rarity X in selected region"**
→ That region may not be seeded yet. Use `!pg regions` to check availability.

---

For detailed implementation information, see [IMPLEMENTATION.md](IMPLEMENTATION.md)

---

## 📊 Command Categories

- [Getting Started](#getting-started) - Registration and signup
- [Gacha & Rolling](#gacha--rolling) - Roll for Pokemon
- [Profile & Economy](#profile--economy) - Check stats and points
- [Inventory Management](#inventory-management) - View and manage Pokemon
- [Collection](#collection) - Pokemon lookup and favorites
- [Social & Trading](#social--trading) - Trade and battle with others
- [Leaderboards](#leaderboards) - Competitive rankings
- [Rank System](#rank-system) - Promotion and prestige
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

---

## 💰 Ways to Earn Pikapoints

PikaGacha has multiple ways to earn pikapoints for more rolls and activities:

### Active Earning Methods

1. **Registration Bonus** - 100 pikapoints (one-time)
2. **Opening Balls** - 1-150 pikapoints based on ball rarity
3. **Releasing Pokemon** - 5-60 pikapoints based on Pokemon rarity
4. **Winning Battles** - Wager amount (1-100 pikapoints)
5. **Jackpot Wins** - Share of communal pool for ultra-rare Pokemon
6. **Quiz System** - 20-60 pikapoints for answering Pokemon trivia

### Passive Earning Methods

7. **League of Legends Games** - 30 pikapoints for completing 15+ minute matches
   - Automatically tracks your Discord status
   - Must be playing for the full game duration
   - Prevents farming from short matches

8. **Quiz Streak Bonuses** - Additional rewards for consecutive correct answers
   - Streak multiplier: 20 + (10 × current_streak), max 60 points
   - Ball rewards at streaks 5, 10, 15, 20+ (Pokeball → Masterball)
   - Shutdown bonuses when other players break your streak

### Admin Commands

9. **Manual Awards** - Administrators can grant points for events or rewards

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

## Rank System

The PikaGacha module features a rank progression system where trainers gain experience (EXP) through various activities and advance through 13 ranks.

### How to Gain EXP

- **Rolling Pokemon:** +1 EXP per roll
- **Opening Balls:** +1 EXP per ball opened
- **Winning Battles:** Variable EXP based on battle odds and wager

### `!promote`

Advance to the next rank when you have enough EXP.

**Usage:**

```
!promote              # Promote to the next rank
```

**Permissions:** All users  
**Requirements:** Must have enough rank EXP for the next rank

**Features:**

- Advances you to the next rank in the progression
- Resets your rank EXP to 0
- Awards pokeballs, great balls, or ultra balls based on rank tier
- Check your current rank and EXP progress with `!profile`

**Rank Progression:**

1. **Recruit** (0 EXP) - Starting rank
2. **Crook** (250 EXP) - Tier 1 reward
3. **Thug** (500 EXP) - Tier 1 reward
4. **Hitman** (750 EXP) - Tier 1 reward
5. **Officer** (1000 EXP) - Tier 2 reward
6. **Enforcer** (1250 EXP) - Tier 2 reward
7. **Lieutenant** (1500 EXP) - Tier 2 reward
8. **Admin** (1750 EXP) - Tier 3 reward
9. **Executive** (2000 EXP) - Tier 3 reward
10. **Underboss** (2500 EXP) - Tier 3 reward
11. **Boss** (3500 EXP) - Max rank, eligible for prestige

**Rewards by Tier:**

- **Tier 1** (Crook-Hitman): 1× Poké Ball
- **Tier 2** (Officer-Lieutenant): 1× Great Ball
- **Tier 3** (Admin-Boss): 1× Ultra Ball

---

### `!prestige`

Reset to Recruit rank from Boss rank to earn a Master Ball and increase your prestige level.

**Usage:**

```
!prestige             # Prestige from Boss rank
```

**Permissions:** All users  
**Requirements:** Must be at Boss rank

**Effects:**

- Resets rank to **Recruit**
- Resets rank EXP to 0
- Increments your prestige level by 1
- Awards **1× Master Ball**
- Your total EXP and prestige level are preserved and displayed on your profile

**Notes:**

- Prestiging is optional but earns you rare Master Balls
- You can prestige multiple times to increase your prestige level
- Your prestige level shows your dedication as a trainer

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

### `!pg deletetrainer <@user|user_id>`

**⚠️ DANGEROUS ADMIN COMMAND**

Permanently delete a trainer and ALL their PikaGacha data.

**Usage:**

```
!pg deletetrainer @User                    # Delete by mention
!pg deletetrainer 123456789012345678       # Delete by ID
```

**Permissions:** Admins only  
**Confirmation Required:** ✅ Yes (30 second button confirmation)

**What it deletes:**

- Trainer profile (name, team, rank, EXP)
- All Pokemon in inventory
- All items (Poké Balls, Great Balls, etc.)
- All favorites
- All jackpot entries
- Resets pikapoints and savings to 0

**⚠️ WARNING:**

- **This action is permanent and cannot be undone!**
- The user will need to register again to play
- All progress, Pokemon, and items will be lost forever
- A confirmation dialog will show all data before deletion

**Confirmation Process:**

1. Command shows preview with all data to be deleted
2. Admin has 30 seconds to click "Confirm Delete" button
3. Only the admin who ran the command can confirm
4. Clicking "Cancel" or waiting 30 seconds cancels deletion

**When to use:**

- User requests data deletion
- Banning a user from PikaGacha
- Clearing inactive accounts
- Testing/debugging (with permission)

**Example:**

```
!pg deletetrainer @OldUser

⚠️ Confirm Trainer Deletion
Are you sure you want to delete OldUser's trainer profile?

This will permanently delete:
• Trainer Name: OldPlayer
• Team: Electrocution
• Rank: Captain
• Pokémon in Inventory: 47
• Items (Balls): 12
• Favorites: 5
• Jackpot Entries: 3
• Pikapoints: 2,450
• Savings: 1,000

[✅ Confirm Delete] [❌ Cancel]

⚠️ This action cannot be undone!
```

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
