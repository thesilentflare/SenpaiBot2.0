# Database Seeding Guide

## Overview

The PikaGacha module requires Pokemon data to be populated in the database. The Python version used a `pokedata.csv` file with 809+ Pokemon entries.

## CSV Format

The `pokedata.csv` file has the following format:

```
id,name,rarity,focus,bst
1,Bulbasaur,3,0,318
2,Ivysaur,4,0,405
3,Venusaur,5,0,525
...
```

**Fields:**

- `id` - Pokemon ID (1-809 for normal, 10000+ for special)
- `name` - Pokemon name
- `rarity` - Star rating (1-8, where 8 is Mythic)
- `focus` - Focus flag (1 = focus Pokemon, 0 = not focus)
- `bst` - Base Stat Total for battle calculations

## Seeding Methods

### Method 1: Automated Script (Recommended)

The seeding script reads from `pokedata.csv` located in the scripts directory:

```bash
npx ts-node src/modules/pikaGacha/scripts/seedPokemon.ts
```

**Requirements:**

- `pokedata.csv` must exist at `src/modules/pikaGacha/scripts/pokedata.csv`
- The CSV file is already included in this repository (copied from the Python version)

**What it does:**

- Initializes the database
- Parses `pokedata.csv` (809+ Pokemon entries)
- Automatically assigns `regionId` based on Pokemon ID ranges:
  - 1-151: Kanto (regionId 1)
  - 152-251: Johto (regionId 2)
  - 252-386: Hoenn (regionId 3)
  - 387-493: Sinnoh (regionId 4)
  - 494-649: Unova (regionId 5)
  - 650-721: Kalos (regionId 6)
  - 722-809: Alola (regionId 7)
  - 10000+: Special (regionId 8)
- Marks special Pokemon (ID >= 10000) as active by default
- Uses `findOrCreate` to avoid duplicates
- Shows progress every 100 Pokemon

### Method 3: Manual SQL Import

If you prefer direct SQL:

1. Convert CSV to SQL (example Python script):

```python
import csv

with open('pokedata.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        id, name, rarity, focus, bst = row
        regionId = 1 if int(id) <= 151 else 2 if int(id) <= 251 else 3
        isSpecial = 1 if int(id) >= 10000 else 0
        print(f"INSERT INTO Pokemon (id, name, rarity, focus, bst, regionId, isSpecial) VALUES ({id}, '{name}', {rarity}, {focus}, {bst}, {regionId}, {isSpecial});")
```

2. Run SQL against your database

## Special 2okemon

The Python version has special Pokemon (ID 10000+) with custom sprites:

- 10000: Unknown
- 10001: Mega Rayquaza
- 10002: Primal Kyogre
- 10003: Primal Groudon
- 10004: Mega Lopunny
- 10005: Pirouette Meloetta
- 10006: Ash-Greninja
- 10007: Ultra Necrozma
- 10008: Eternamax Eternatus

These require custom sprite URLs defined in `types.ts` `SPECIAL_POKEMON` mapping.

## Verifying the Seed

After seeding, verify the data:

```bash
# Run TypeScript REPL
npx ts-node

# In the REPL:
> const { Pokemon } = require('./src/modules/pikaGacha/models');
> const { initializeDatabase } = require('./src/modules/pikaGacha/config/database');
> await initializeDatabase();
> const count = await Pokemon.count();
> console.log(`Total Pokemon: ${count}`);
> const pikachu = await Pokemon.findByPk(25);
> console.log(pikachu?.toJSON());
```

Expected output:

```
Total Pokemon: 809 (or more with special Pokemon)
{
  id: 25,
  name: 'Pikachu',
  rarity: 5,
  focus: false,
  bst: 320,
  regionId: 1,
  isSpecial: false,
  active: false
}
```

## Managing Focus Pokemon

To set a Pokemon as focus (rate-up):

```typescript
import pokemonService from './src/modules/pikaGacha/services/PokemonService';

// Set Charizard (ID 6) as focus
await pokemonService.setFocus(6, true);

// Remove focus
await pokemonService.setFocus(6, false);
```

## Troubleshooting

**Error: pokedata.csv not found**

- Ensure `pokedata.csv` exists at `src/modules/pikaGacha/scripts/pokedata.csv`
- The file should already be included in the repository
- If missing, it can be copied from the original SenpaiBot Python version

**Error: Database connection failed**

- Ensure SQLite is installed
- Check database permissions
- Verify `config/database.ts` settings

**Duplicate entries**

- The script uses `findOrCreate`, so duplicates are automatically handled
- Existing entries will be updated with new values

## Next Steps

After seeding:

1. Test gacha rolls: `!roll kanto`
2. Check Pokemon lookup: `!pokedex Pikachu`
3. Set focus Pokemon for events
4. Adjust rarity distributions if needed
