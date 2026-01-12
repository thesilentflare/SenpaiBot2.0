# PikaGacha Utilities

## Image Generation (IMPLEMENTED)

The TypeScript implementation includes image generation for battle previews using the `canvas` library (Node.js implementation of Canvas API).

### Battle Preview Images

Visual representation of battle matchups showing:

- Both Pokémon sprites (fetched from Serebii or PokéAPI)
- Player usernames
- BST values with bonuses from duplicates
- Win odds percentages
- Current balances
- Potential payouts
- Base wager amount

### Implementation

**Dependencies:**

- `canvas` - Node.js Canvas API implementation
- `axios` - For fetching Pokémon sprites from external URLs

**Files:**

- `utils/imageGenerator.ts` - Main image generation utility
- `assets/images/battle_background.png` - Battle background image
- `assets/images/battle_text_box.png` - Text box overlay
- `assets/images/arial.ttf` - Arial font for text rendering

**Usage:**

```typescript
import { generateBattleImage } from './utils/imageGenerator';

const imageBuffer = await generateBattleImage({
  username1: 'Player1',
  pokemon1: 'Charizard',
  pokemon1Plus: ' +3',
  pokemon1Bst: 534,
  pokemon1BstBonus: ' +15',
  pokemon1Odds: 62.5,
  pokemon1Id: 6,
  balance1: 150,
  payout1: 80,

  username2: 'Player2',
  pokemon2: 'Blastoise',
  pokemon2Plus: ' +1',
  pokemon2Bst: 530,
  pokemon2BstBonus: ' +5',
  pokemon2Odds: 37.5,
  pokemon2Id: 9,
  balance2: 200,
  payout2: 133,

  wager: 50,
});

// Send as Discord attachment
const attachment = new AttachmentBuilder(imageBuffer, { name: 'battle.png' });
await message.channel.send({ files: [attachment] });
```

### Features

- **Automatic sprite fetching**: Retrieves Pokémon sprites from Serebii (primary) with PokéAPI fallback
- **Special Pokémon support**: Handles custom sprites for special Pokémon (ID >= 10000)
- **Sprite flipping**: Player 1's Pokémon is horizontally flipped to face opponent
- **Error handling**: Shows placeholder if sprite fails to load
- **Font rendering**: Uses Arial font for all text elements

### References

- Python implementation: `SenpaiBot/src/senpai_shop.py` lines 2259-2342 (`draw_battle` function)
- Assets: battle_background.png (850x450), battle_text_box.png (300x150), arial.ttf
- Sprite sources: Serebii.net, PokéAPI
