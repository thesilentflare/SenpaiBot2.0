import { EmbedBuilder } from 'discord.js';
import { ROLL_COST, MAX_FAVORITES, TEAM_SWITCH_COST } from '../config/config';

const COLOR_HELP = 0x9370db;

export const COMMAND_HELP = {
  roll: () =>
    new EmbedBuilder()
      .setTitle('🎲 Roll Command Help')
      .setDescription(
        `**Description:** Roll for Pokémon (costs ${ROLL_COST} pikapoints per roll)\n\n` +
          '**Usage Variations:**\n' +
          '• `!pg roll` - Roll once from all regions\n' +
          '• `!pg roll <count>` - Roll multiple times from all regions\n' +
          '• `!pg roll <region>` - Roll once from specific region\n' +
          '• `!pg roll <region> <count>` - Roll multiple times from region\n' +
          '• `!pg roll <count> <region>` - Same as above\n\n' +
          '**Examples:**\n' +
          '• `!pg roll` - Roll once\n' +
          '• `!pg roll 5` - Roll 5 times\n' +
          '• `!pg roll kanto` - Roll from Kanto region\n' +
          '• `!pg roll johto 10` - Roll 10 times from Johto\n\n' +
          '**Available Regions:**\n' +
          'kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, paldea, special\n' +
          '*Use `!pg regions` to see which regions have Pokémon available*',
      )
      .setColor(COLOR_HELP),

  fullroll: () =>
    new EmbedBuilder()
      .setTitle('🎲 Full Roll Command Help')
      .setDescription(
        `**Description:** Roll multiple times with condensed results\n\n` +
          '**Usage Variations:**\n' +
          '• `!pg fullroll <count>` - Roll multiple times, condensed view\n' +
          '• `!pg fullroll <count> <region>` - Roll from specific region\n' +
          '• `!pg fullroll <region> <count>` - Same as above\n' +
          '• `!pg fullroll <count> <region> --detailed` - Show detailed results\n\n' +
          '**Examples:**\n' +
          '• `!pg fullroll 10` - Roll 10 times\n' +
          '• `!pg fullroll 20 kanto` - Roll 20 times from Kanto\n' +
          '• `!pg fullroll 15 hoenn --detailed` - Detailed view\n\n' +
          '**Flags:**\n' +
          '• `--detailed` - Show full details for each roll',
      )
      .setColor(COLOR_HELP),

  register: () =>
    new EmbedBuilder()
      .setTitle('📝 Register Command Help')
      .setDescription(
        '**Description:** Create your trainer profile\n\n' +
          '**Usage:**\n' +
          '• `!pg register <name>` - Register with your trainer name\n\n' +
          '**Examples:**\n' +
          '• `!pg register Ash` - Register as "Ash"\n' +
          '• `!pg register Gary Oak` - Register as "Gary Oak"\n\n' +
          '**Note:** You can only register once! Choose your name wisely.',
      )
      .setColor(COLOR_HELP),

  trainer: () =>
    new EmbedBuilder()
      .setTitle('👤 Trainer Command Help')
      .setDescription(
        '**Description:** View trainer profile card\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg trainer` - View your own profile\n' +
          "• `!pg trainer <@user>` - View another user's profile\n" +
          '• `!pg profile` - Alias for trainer\n\n' +
          '**Examples:**\n' +
          '• `!pg trainer` - View your profile\n' +
          "• `!pg trainer @Friend` - View Friend's profile",
      )
      .setColor(COLOR_HELP),

  balance: () =>
    new EmbedBuilder()
      .setTitle('💰 Balance Command Help')
      .setDescription(
        '**Description:** Check your pikapoints and savings\n\n' +
          '**Usage:**\n' +
          '• `!pg balance` - View your pikapoints and bank balance\n' +
          '• `!pg bal` - Short alias\n\n' +
          '**Example:**\n' +
          '• `!pg balance` - Check your points',
      )
      .setColor(COLOR_HELP),

  transfer: () =>
    new EmbedBuilder()
      .setTitle('🏦 Transfer Command Help')
      .setDescription(
        '**Description:** Move pikapoints to savings\n\n' +
          '**Usage:**\n' +
          '• `!pg transfer <amount>` - Transfer points to savings\n' +
          '• `!pg transfer all` - Transfer all available points\n\n' +
          '**Examples:**\n' +
          '• `!pg transfer 1000` - Save 1000 points\n' +
          '• `!pg transfer all` - Save all points',
      )
      .setColor(COLOR_HELP),

  withdraw: () =>
    new EmbedBuilder()
      .setTitle('🏦 Withdraw Command Help')
      .setDescription(
        '**Description:** Withdraw pikapoints from savings\n\n' +
          '**Usage:**\n' +
          '• `!pg withdraw <amount>` - Withdraw from savings\n' +
          '• `!pg withdraw all` - Withdraw all savings\n\n' +
          '**Examples:**\n' +
          '• `!pg withdraw 500` - Withdraw 500 points\n' +
          '• `!pg withdraw all` - Withdraw everything',
      )
      .setColor(COLOR_HELP),

  bag: () =>
    new EmbedBuilder()
      .setTitle('🎒 Bag Command Help')
      .setDescription(
        '**Description:** View your balls with sprites\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg bag` - View your own bag\n' +
          "• `!pg bag <@user>` - View another user's bag\n\n" +
          '**Examples:**\n' +
          '• `!pg bag` - Check your balls\n' +
          "• `!pg bag @Friend` - Check Friend's balls",
      )
      .setColor(COLOR_HELP),

  open: () =>
    new EmbedBuilder()
      .setTitle('🎁 Open Command Help')
      .setDescription(
        '**Description:** Open balls for rewards\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg open <ball_type>` - Open one ball\n' +
          '• `!pg open <ball_type> <amount>` - Open multiple\n' +
          '• `!pg open <ball_type> all` - Open all of that type\n' +
          '• `!pg open all` - Open all balls\n\n' +
          '**Examples:**\n' +
          '• `!pg open poke` - Open 1 Poké Ball\n' +
          '• `!pg open great 5` - Open 5 Great Balls\n' +
          '• `!pg open ultra all` - Open all Ultra Balls\n' +
          '• `!pg open all` - Open every ball\n\n' +
          '**Ball Types:**\n' +
          'poke, great, ultra, master',
      )
      .setColor(COLOR_HELP),

  box: () =>
    new EmbedBuilder()
      .setTitle('📦 Box Command Help')
      .setDescription(
        '**Description:** View Pokémon collection with sprites\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg box` - View your box (6x3 grid)\n' +
          "• `!pg box <@user>` - View another user's box\n" +
          '• `!pg box --favorites` - View favorites only (3x2 grid)\n' +
          "• `!pg box <@user> --favorites` - View user's favorites\n\n" +
          '**Examples:**\n' +
          '• `!pg box` - View your Pokémon\n' +
          '• `!pg box --favorites` - View favorite Pokémon\n' +
          "• `!pg box @Friend` - View Friend's box",
      )
      .setColor(COLOR_HELP),

  inventory: () =>
    new EmbedBuilder()
      .setTitle('📋 Inventory Command Help')
      .setDescription(
        '**Description:** List your Pokémon collection (text)\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg inventory` - View your inventory\n' +
          "• `!pg inventory <@user>` - View another user's inventory\n" +
          '• `!pg inv` - Short alias\n\n' +
          '**Examples:**\n' +
          '• `!pg inventory` - List your Pokémon\n' +
          "• `!pg inv @Friend` - List Friend's Pokémon",
      )
      .setColor(COLOR_HELP),

  pokedex: () =>
    new EmbedBuilder()
      .setTitle('📖 Pokédex Command Help')
      .setDescription(
        '**Description:** Look up information about a specific Pokémon\n\n' +
          '**Usage:**\n' +
          '• `!pg pokedex <pokemon_name_or_id>` - Look up by name or ID\n' +
          '• `!pg dex <pokemon_name_or_id>` - Short alias\n\n' +
          '**Examples:**\n' +
          '• `!pg pokedex Pikachu` - Look up Pikachu\n' +
          '• `!pg dex 25` - Look up Pokémon #25\n' +
          '• `!pg pokedex Charizard` - Look up Charizard\n\n' +
          '**Displays:** Name, ID, Rarity, BST, Region, sprite image',
      )
      .setColor(COLOR_HELP),

  release: () =>
    new EmbedBuilder()
      .setTitle('🔓 Release Command Help')
      .setDescription(
        '**Description:** Release Pokémon for points\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg release <pokemon>` - Release one by name/ID\n' +
          '• `!pg release <pokemon> <count>` - Release multiple\n\n' +
          '**Examples:**\n' +
          '• `!pg release Pikachu` - Release 1 Pikachu\n' +
          '• `!pg release 25` - Release Pokémon ID 25\n' +
          '• `!pg release Pidgey 5` - Release 5 Pidgey\n\n' +
          '**Note:** Cannot release favorite Pokémon',
      )
      .setColor(COLOR_HELP),

  releasedupes: () =>
    new EmbedBuilder()
      .setTitle('🔓 Release Dupes Command Help')
      .setDescription(
        '**Description:** Release all duplicate Pokémon\n\n' +
          '**Usage:**\n' +
          '• `!pg releasedupes` - Preview what will be released\n' +
          '• `!pg releasedupes --confirm` - Confirm and release\n\n' +
          '**Examples:**\n' +
          '• `!pg releasedupes` - See duplicates\n' +
          '• `!pg releasedupes --confirm` - Release all dupes\n\n' +
          '**Note:** Keeps 1 of each Pokémon, favorites protected',
      )
      .setColor(COLOR_HELP),

  favorite: () =>
    new EmbedBuilder()
      .setTitle('⭐ Favorite Command Help')
      .setDescription(
        `**Description:** Toggle Pokémon as favorite (max ${MAX_FAVORITES})\n\n` +
          '**Usage:**\n' +
          '• `!pg favorite <pokemon>` - Toggle favorite status\n' +
          '• `!pg fav <pokemon>` - Short alias\n\n' +
          '**Examples:**\n' +
          '• `!pg favorite Charizard` - Favorite Charizard\n' +
          '• `!pg fav 6` - Favorite Pokémon ID 6\n\n' +
          '**Note:** Favorites cannot be released',
      )
      .setColor(COLOR_HELP),

  favorites: () =>
    new EmbedBuilder()
      .setTitle('⭐ Favorites Command Help')
      .setDescription(
        '**Description:** List favorite Pokémon\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg favorites` - View your favorites\n' +
          "• `!pg favorites <@user>` - View another user's favorites\n" +
          '• `!pg favs` - Short alias\n\n' +
          '**Examples:**\n' +
          '• `!pg favorites` - List your favorites\n' +
          "• `!pg favs @Friend` - View Friend's favorites",
      )
      .setColor(COLOR_HELP),

  trade: () =>
    new EmbedBuilder()
      .setTitle('🔄 Trade Command Help')
      .setDescription(
        '**Description:** Trade Pokémon with another player\n\n' +
          '**Usage:**\n' +
          '• `!pg trade <@user>` - Initiate trade\n\n' +
          '**Example:**\n' +
          '• `!pg trade @Friend` - Start trade with Friend\n\n' +
          '**How it works:**\n' +
          '1. Use command to start trade\n' +
          '2. Select Pokémon to offer\n' +
          '3. Both players confirm\n' +
          '4. Trade completes!',
      )
      .setColor(COLOR_HELP),

  battle: () =>
    new EmbedBuilder()
      .setTitle('⚔️ Battle Command Help')
      .setDescription(
        '**Description:** Battle another trainer\n\n' +
          '**Usage:**\n' +
          '• `!pg battle <@user>` - Challenge to battle\n\n' +
          '**Example:**\n' +
          '• `!pg battle @Friend` - Battle Friend\n\n' +
          '**Note:** Battle power based on Pokémon stats (BST)',
      )
      .setColor(COLOR_HELP),

  team: () =>
    new EmbedBuilder()
      .setTitle('🏆 Team Command Help')
      .setDescription(
        '**Description:** View and join teams\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg team` - View available teams\n' +
          '• `!pg team <name>` - Join a team\n\n' +
          '**Examples:**\n' +
          '• `!pg team` - See all teams\n' +
          '• `!pg team electrocution` - Join Electrocution\n' +
          '• `!pg team lensflare` - Join Lensflare\n' +
          '• `!pg team hyperjoy` - Join Hyperjoy\n\n' +
          `**Note:** First join is FREE! Switching costs ${TEAM_SWITCH_COST} points and resets rank/EXP`,
      )
      .setColor(COLOR_HELP),

  promote: () =>
    new EmbedBuilder()
      .setTitle('📈 Promote Command Help')
      .setDescription(
        '**Description:** Rank up within your current prestige level using EXP\n\n' +
          '**Usage:**\n' +
          '• `!pg promote` - Rank up if you have enough EXP\n\n' +
          '**Example:**\n' +
          '• `!pg promote` - Use EXP to rank up\n\n' +
          '**How it works:**\n' +
          '• Earn EXP from rolling, opening balls, battles, and quizzes\n' +
          '• Each rank requires more EXP than the last\n' +
          '• Ranks reset when you prestige\n' +
          '• Higher ranks give you better rewards and bonuses',
      )
      .setColor(COLOR_HELP),

  prestige: () =>
    new EmbedBuilder()
      .setTitle('✨ Prestige Command Help')
      .setDescription(
        '**Description:** Reset your rank for permanent bonuses\n\n' +
          '**Usage:**\n' +
          '• `!pg prestige` - Prestige to the next level\n\n' +
          '**Example:**\n' +
          '• `!pg prestige` - Reset rank for permanent bonuses\n\n' +
          '**How it works:**\n' +
          '• Resets your rank back to 1\n' +
          '• Increases your prestige level by 1\n' +
          '• Grants permanent multipliers and bonuses\n' +
          '• Your Pokémon collection is NOT affected\n' +
          '• Different from promote - prestige is a full reset for long-term power',
      )
      .setColor(COLOR_HELP),

  leaderboard: () =>
    new EmbedBuilder()
      .setTitle('🏅 Leaderboard Command Help')
      .setDescription(
        '**Description:** View rankings\n\n' +
          '**Usage Variations:**\n' +
          '• `!pg leaderboard` - View points leaderboard\n' +
          '• `!pg leaderboard <category>` - View specific category\n' +
          '• `!pg lb` - Short alias\n\n' +
          '**Examples:**\n' +
          '• `!pg leaderboard` - Top trainers by points\n' +
          '• `!pg lb collection` - Top by collection\n\n' +
          '**Categories:**\n' +
          'points, collection, rank, prestige',
      )
      .setColor(COLOR_HELP),

  regions: () =>
    new EmbedBuilder()
      .setTitle('🌍 Regions Command Help')
      .setDescription(
        '**Description:** List all Pokémon regions and their availability\n\n' +
          '**Usage:**\n' +
          '• `!pg regions` - Show all regions and Pokémon counts\n\n' +
          '**Example:**\n' +
          '• `!pg regions` - See which regions are available\n\n' +
          '**Available Regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, paldea, special\n' +
          '**Future Release regions** are regions not yet seeded in the database',
      )
      .setColor(COLOR_HELP),

  jackpot: () =>
    new EmbedBuilder()
      .setTitle('💰 Jackpot Command Help')
      .setDescription(
        '**Description:** View current jackpot pool and your contribution\n\n' +
          '**Usage:**\n' +
          '• `!pg jackpot` - View jackpot information\n\n' +
          '**Example:**\n' +
          '• `!pg jackpot` - Check the current pool\n\n' +
          '**How it works:**\n' +
          '• Every roll automatically contributes to the jackpot\n' +
          '• When someone rolls a 6⭐ Legendary, jackpot pays out at 1x\n' +
          '• When someone rolls a 7⭐ Mythic, jackpot pays out at 2x\n' +
          '• All contributors with 3+ points split the pool equally\n' +
          '• Each winner receives points + a random ball!\n' +
          '• After payout, the jackpot resets',
      )
      .setColor(COLOR_HELP),
};
