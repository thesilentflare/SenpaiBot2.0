import { Message, EmbedBuilder } from 'discord.js';
import { Op } from 'sequelize';
import {
  ROLL_COST,
  STARTER_BONUS,
  TEAM_SWITCH_COST,
  VOICE_REWARD_POINTS,
  VOICE_REWARD_INTERVAL_MS,
  BASE_REWARD,
  STREAK_BONUS,
  MAX_REWARD,
  LEAGUE_REWARD_POINTS,
  MAX_FAVORITES,
} from '../config/config';
import {
  TEAMS,
  KANTO,
  JOHTO,
  HOENN,
  SINNOH,
  UNOVA,
  KALOS,
  ALOLA,
  GALAR,
  PALDEA,
  SPECIAL,
  Region,
} from '../types';
import { Pokemon } from '../models';

const COLOR_INFO = 0x9370db;

/**
 * Handle !pg help command - Show all commands
 */
export async function handleHelp(message: Message): Promise<void> {
  const embed1 = new EmbedBuilder()
    .setTitle('🎮 PikaGacha Commands - Getting Started')
    .setDescription(
      '**Registration & Profile**\n' +
        '`!pg register <name>` - Create your trainer profile\n' +
        '`!pg trainer [user]` - View trainer profile card\n' +
        '`!pg balance` - Check your pikapoints and savings\n\n' +
        '**Teams**\n' +
        '`!pg team` - View available teams and your current team\n' +
        '`!pg team <name>` - Join a team (electrocution/lensflare/hyperjoy)\n\n' +
        '**Rolling & Collecting**\n' +
        '`!pg roll [region] [count]` - Roll for Pokémon (30 points each)\n' +
        '`!pg fullroll [region] [count] [--detailed]` - Roll multiple at once\n' +
        '`!pg bag [user]` - View your balls with sprites\n' +
        '`!pg open <ball_type> [amount|all]` - Open balls for rewards\n' +
        '`!pg open all` - Open all your balls',
    )
    .setColor(COLOR_INFO);

  const embed2 = new EmbedBuilder()
    .setTitle('🎮 PikaGacha Commands - Collection')
    .setDescription(
      '**Collection Management**\n' +
        '`!pg box [user] [--favorites]` - View Pokémon with sprites (3x2 grid for favorites)\n' +
        '`!pg inventory [user]` - List your Pokémon collection\n' +
        '`!pg pokedex [user]` - View completion progress\n' +
        '`!pg favorite <pokemon>` - Toggle Pokémon as favorite (max 6)\n' +
        '`!pg favorites [user]` - List favorite Pokémon\n' +
        '`!pg release <pokemon> [count]` - Release Pokémon for points\n' +
        '`!pg releasedupes [--confirm]` - Release all duplicate Pokémon\n\n' +
        '**Banking**\n' +
        '`!pg transfer <amount>` - Move points to savings\n' +
        '`!pg withdraw <amount>` - Withdraw from savings',
    )
    .setColor(COLOR_INFO);

  const embed3 = new EmbedBuilder()
    .setTitle('🎮 PikaGacha Commands - Competition')
    .setDescription(
      '**Progression**\n' +
        '`!pg promote` - Rank up within your current prestige (costs EXP)\n' +
        '`!pg prestige` - Reset rank for permanent bonuses (keeps Pokémon)\n' +
        '`!pg leaderboard [category]` - View rankings\n' +
        '`!pg jackpot` - View jackpot pool and your contribution\n\n' +
        '**Social**\n' +
        '`!pg trade <@user>` - Trade Pokémon\n' +
        '`!pg battle <@user>` - Battle another trainer\n\n' +
        '**Information**\n' +
        '`!pg help` - Show this help message\n' +
        '`!pg info` - Detailed guide on how PikaGacha works',
    )
    .setColor(COLOR_INFO);

  await message.reply({ embeds: [embed1, embed2, embed3] });
}

/**
 * Handle !pg info command - Detailed explanation
 */
export async function handleInfo(message: Message): Promise<void> {
  const voiceMinutes = Math.floor(VOICE_REWARD_INTERVAL_MS / 60000);

  const embed1 = new EmbedBuilder()
    .setTitle('📚 PikaGacha Guide - Getting Started')
    .setDescription(
      '**What is PikaGacha?**\n' +
        'PikaGacha is a Pokémon collecting game where you earn points, roll for Pokémon, join teams, and compete with others!\n\n' +
        '**First Steps:**\n' +
        '1. **Register:** `!pg register <your_name>` - Get started with ' +
        STARTER_BONUS +
        ' pikapoints\n' +
        '2. **Choose a Team:** `!pg team <name>` - Join Electrocution, Lensflare, or Hyperjoy\n' +
        '3. **Start Rolling:** `!pg roll` - Spend ' +
        ROLL_COST +
        ' points per roll\n\n' +
        '**Earning Pikapoints:**\n' +
        `• **Voice Chat:** ${VOICE_REWARD_POINTS} points every ${voiceMinutes} minutes (with 2+ people)\n` +
        `• **Quizzes:** ${BASE_REWARD}-${MAX_REWARD} points (bonus for streaks: +${STREAK_BONUS} per streak)\n` +
        `• **League of Legends:** ${LEAGUE_REWARD_POINTS} points per game (15+ min)\n` +
        `• **Opening Balls:** 50% chance for points, 50% for Pokémon\n` +
        '• **Releasing Pokémon:** Get points back based on rarity',
    )
    .setColor(COLOR_INFO);

  const embed2 = new EmbedBuilder()
    .setTitle('📚 PikaGacha Guide - Collection & Progression')
    .setDescription(
      '**Rolling System:**\n' +
        `• Each roll costs **${ROLL_COST} pikapoints**\n` +
        '• Choose specific regions (Kanto, Johto, etc.) or roll all regions\n' +
        '• Higher rarity = rarer Pokémon (1⭐ common → Legendary/Mythic)\n' +
        '• Use `!pg fullroll` for bulk rolling with condensed results\n\n' +
        '**Favorites:**\n' +
        `• Mark up to **${MAX_FAVORITES} Pokémon** as favorites\n` +
        '• Favorites cannot be accidentally released\n' +
        '• View favorites with larger sprites: `!pg box --favorites` (3x2 grid)\n\n' +
        '**Rank & Experience:**\n' +
        '• Gain EXP from various activities (rolling, opening, battling)\n' +
        '• Use `!pg promote` to rank up when you have enough EXP\n' +
        '• Each rank requires more EXP and unlocks bonuses\n\n' +
        '**Prestige:**\n' +
        '• Reset your rank for permanent bonuses\n' +
        '• Prestiging gives multipliers and special perks\n' +
        '• Keep your Pokémon collection!',
    )
    .setColor(COLOR_INFO);

  const embed3 = new EmbedBuilder()
    .setTitle('📚 PikaGacha Guide - Teams & Competition')
    .setDescription(
      '**Teams:**\n' +
        `• **${TEAMS.ELECTROCUTION.name}** - Competitive spirit\n` +
        `• **${TEAMS.LENSFLARE.name}** - Strategic collectors\n` +
        `• **${TEAMS.HYPERJOY.name}** - Enthusiastic trainers\n` +
        '• First team join is FREE!\n' +
        `• Switching teams costs **${TEAM_SWITCH_COST} pikapoints** and resets rank/EXP\n\n` +
        '**Trading:**\n' +
        '• Trade Pokémon with other players\n' +
        '• Both players must confirm the trade\n' +
        '• Great for completing your collection!\n\n' +
        '**Battling:**\n' +
        '• Challenge other trainers to battles\n' +
        '• Battle power is based on Pokémon stats (BST)\n' +
        '• Win to gain EXP and bragging rights\n\n' +
        '**Banking:**\n' +
        '• Save pikapoints in your bank to protect them\n' +
        '• Use `!pg transfer` and `!pg withdraw` to manage savings',
    )
    .setColor(COLOR_INFO);

  const embed4 = new EmbedBuilder()
    .setTitle('📚 PikaGacha Guide - Tips & Tricks')
    .setDescription(
      '**Pro Tips:**\n' +
        '• Release duplicate Pokémon for points: `!pg releasedupes`\n' +
        '• Answer quiz questions correctly to build streaks (up to ' +
        MAX_REWARD +
        ' points!)\n' +
        '• Open balls strategically - higher tier balls give better rewards\n' +
        '• Check the leaderboard to see top trainers: `!pg leaderboard`\n\n' +
        '**Ball Types:**\n' +
        '• **Poké Ball** - 1-15 points or 3-4⭐ Pokémon\n' +
        '• **Great Ball** - 15-30 points or 3-5⭐ Pokémon\n' +
        '• **Ultra Ball** - 30-60 points or 4-6⭐ Pokémon\n' +
        '• **Master Ball** - 60-150 points or 5-7⭐ Pokémon\n\n' +
        '**Need Help?**\n' +
        '• Use `!pg help` to see all commands\n' +
        '• Add `help` to any command for details: `!pg roll help`\n' +
        '• Ask in the chat if you need assistance!',
    )
    .setColor(COLOR_INFO)
    .setFooter({ text: 'Good luck, Trainer! 🎮' });

  await message.reply({ embeds: [embed1, embed2, embed3, embed4] });
}

/**
 * Handle !pg regions command - List available regions based on DB content
 */
export async function handleRegions(message: Message): Promise<void> {
  const ALL_REGIONS: Region[] = [
    KANTO,
    JOHTO,
    HOENN,
    SINNOH,
    UNOVA,
    KALOS,
    ALOLA,
    GALAR,
    PALDEA,
    SPECIAL,
  ];

  try {
    // Query Pokemon counts for each region in parallel
    const regionData = await Promise.all(
      ALL_REGIONS.map(async (region) => {
        const where: any = {
          id: { [Op.between]: [region.min, region.max] },
        };
        // For special region, only count active Pokemon
        if (region.id === 0) {
          where.active = true;
        }
        const count = await Pokemon.count({ where });
        return { region, count };
      }),
    );

    const lines = regionData.map(({ region, count }) => {
      if (count > 0) {
        const idRange =
          region.id === 0
            ? `ID ${region.min}+`
            : `IDs #${region.min}–#${region.max}`;
        return `**${region.name}** — ${count} Pokémon available *(${idRange})*`;
      } else {
        return `**${region.name}** — *Future Release*`;
      }
    });

    const availableCount = regionData.filter((r) => r.count > 0).length;

    const embed = new EmbedBuilder()
      .setTitle('🌍 PikaGacha Regions')
      .setDescription(
        `**${availableCount} of ${ALL_REGIONS.length} regions** currently have Pokémon available.\n\n` +
          lines.join('\n') +
          '\n\n' +
          '**Usage:** `!pg roll <region>` to roll in a specific region\n' +
          '*e.g. `!pg roll kanto`, `!pg roll johto`*',
      )
      .setColor(0x9370db)
      .setFooter({
        text: '🔒 Future Release regions will be added in upcoming updates',
      });

    await message.reply({ embeds: [embed] });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred while fetching region data.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}
