# PikaGacha Module - Implementation Complete

Complete TypeScript/Sequelize implementation of the PikaGacha Pokémon gacha system, migrated from Python/discord.py.

## 📦 What Was Implemented

### Database Models (7 models)

- **User** - Points, savings, pity rates (threePity, fourPity, fivePity, focusPity)
- **Pokemon** - Pokémon data (id, name, rarity 1-8, bst, focus, regionId, isSpecial)
- **Inventory** - User Pokémon ownership tracking
- **Item** - User ball inventory (pokeball, greatball, ultraball, masterball)
- **Jackpot** - Contribution tracking for jackpot system
- **Trainer** - 24 stats including rank, exp, battles, wins, losses, trades, etc.
- **Favorite** - Favorite Pokémon marking

### Services (9 services)

- **UserService** - Points, pity, banking (deposit/withdraw)
- **PokemonService** - Pokemon lookup, roll options, focus control
- **InventoryService** - Add/remove pokemon, release mechanics, favorites
- **GachaService** - Roll system with pity (540/420/30/10), rarity determination
- **JackpotService** - 3pt contributions, payout with 2× Mythic multiplier
- **TrainerService** - Registration, stats, exp, rank progression, leaderboards
- **ItemService** - Ball inventory, opening (50% points, 50% pokemon)
- **TradeService** - Pokemon trading with 60×rarity cost
- **BattleService** - BST-based battles with +5 per duplicate bonus

### Commands (20+ commands)

**Rolling:**

- `!roll [region]` - Single gacha roll (30 pikapoints)
- `!fullroll [region] [count]` - Multiple rolls at once

**Profile:**

- `!trainer <name>` - View trainer card with all stats
- `!balance` - Check points and savings

**Inventory:**

- `!bag [user]` - View ball inventory
- `!open <ball_type>` - Open balls (50% points, 50% pokemon)
- `!pokedex <pokemon>` - Pokemon lookup with Serebii image
- `!inventory [user]` - View Pokemon collection grouped by rarity
- `!favorite <pokemon>` - Toggle favorite status
- `!favorites` - List favorite Pokemon

**Management:**

- `!release <pokemon> [all|dupes]` - Release for pikapoints (3★:5, 4★:10, 5★:15, 6★:30, 7★:60, 8★:45)
- `!releasedupes <rarity> [region]` - Bulk release duplicates

**Social:**

- `!trade <your_pokemon> <their_pokemon> <their_id>` - Trade with confirmation
- `!battle <their_id> <wager>` - Pokemon battle with visual preview
- `!leaderboard [stat_type]` - 18 stat categories (totalxp, rolls, bricks, jackpots, opens, releases, trades, battles, wins, losses, etc.)

### Image Generation

- **Battle Preview** - 850x450px battle matchup visualization
- **Canvas-based** - Uses Node.js `canvas` library
- **Sprite Fetching** - Automatic from Serebii.net (primary) with PokéAPI fallback
- **Features** - Background, text boxes, Pokemon sprites (flipped for player 1), stats, odds, payouts

## 🎮 Key Mechanics

### Gacha System

- **Cost**: 30 pikapoints per roll
- **Pity Rates**: 3★ (540), 4★ (420), 5★ (30), Focus (10)
- **Jackpot**: 3pt contribution per roll, 2× multiplier for Mythic pulls
- **Regions**: 8 regions (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Special)
- **Rarities**: 1-8 stars with focus system

### Trading System

- **Cost**: 60 × rarity pikapoints (both players)
- **Validation**: Rarity must match, ownership verified
- **Confirmation**: Reaction-based (✅/❌) with 30s timeout

### Battle System

- **Wager**: 1-100 pikapoints
- **BST Calculation**: Base + (5 × duplicates)
- **Odds**: Calculated from BST ratio
- **Payout**: Dynamic based on win probability
- **EXP Rewards**: 10-30 for winner, 5-15 for loser
- **Visual Preview**: Generated battle image with confirmation

### Release System

- **Values**: 3★=5, 4★=10, 5★=15, 6★=30, 7★=60, 8★=45 pikapoints
- **Options**: Single, all copies, duplicates only
- **Bulk Release**: By rarity and optional region filter

### Trainer Progression

- **Ranks**: Rookie → Trainer → Ace Trainer → Gym Leader → Elite Four → Champion → Master
- **EXP**: Gained from battles (10-30 win, 5-15 loss) and other activities
- **Stats**: 24 tracked stats including battles, trades, jackpots, streaks
- **Leaderboards**: 18 categories for competitive tracking

## 📁 File Structure

```
modules/pikaGacha/
├── config/
│   └── database.ts (Sequelize initialization)
├── models/
│   ├── User.ts, Pokemon.ts, Inventory.ts
│   ├── Item.ts, Jackpot.ts, Trainer.ts, Favorite.ts
│   └── index.ts (relationships)
├── services/
│   ├── UserService.ts, PokemonService.ts, InventoryService.ts
│   ├── GachaService.ts, JackpotService.ts, TrainerService.ts
│   ├── ItemService.ts, TradeService.ts, BattleService.ts
├── commands/
│   ├── roll.ts, profile.ts, bag.ts
│   ├── collection.ts, release.ts, favorite.ts
│   ├── trade.ts, battle.ts, leaderboard.ts
├── utils/
│   ├── imageGenerator.ts (canvas-based image generation)
│   └── README.md
├── assets/
│   └── images/ (battle_background.png, battle_text_box.png, arial.ttf)
├── types.ts (REGIONS, BALL_TYPES, constants)
└── index.ts (module registration)
```

## 🔧 Dependencies Added

- `sequelize` - ORM for database management
- `sqlite3` - SQLite database driver
- `canvas` - Image generation for battle previews
- `axios` - HTTP requests for Pokemon sprites

## ✅ Testing Status

- **TypeScript Compilation**: ✅ No errors
- **Service Layer**: Complete with error handling
- **Command Layer**: All commands implemented with validation
- **Image Generation**: Implemented with fallback handling
- **Database**: Models and relationships defined

## 🚀 Next Steps (User Actions)

### 1. Database Seeding (Required)

Populate the Pokemon table with the included Pokemon data:

```bash
npx ts-node src/modules/pikaGacha/scripts/seedPokemon.ts
```

This will:

- Read `pokedata.csv` from the scripts directory (809+ Pokemon, already included)
- Automatically assign regions based on Pokemon ID ranges
- Insert all Pokemon with their stats (name, rarity, BST, etc.)
- Mark special Pokemon (ID >= 10000) as active

See [scripts/README.md](scripts/README.md) for detailed instructions and troubleshooting.

**Verify the seeding:**

```bash
npx ts-node src/modules/pikaGacha/scripts/verifyPokemon.ts
```

### 2. Other Setup Tasks

1. **Focus System**: Configure focus Pokemon for special rate-up events
2. **Testing**: Test all commands in a Discord server environment
3. **Fine-tuning**: Adjust pity rates, costs, and payouts based on gameplay
4. **Special Pokemon**: Verify custom sprites/URLs for special Pokemon (10000+ IDs)

## 📚 Documentation

- Command help: In-code documentation with usage examples
- Service methods: JSDoc comments for all public methods
- Types: Strongly typed throughout with TypeScript
- README: This file + utils/README.md for image generation

---

**Migration Status**: ✅ Complete - All features from Python version implemented in TypeScript with Sequelize ORM
