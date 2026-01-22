import { Message, EmbedBuilder } from 'discord.js';
import trainerService from '../services/TrainerService';
import Logger from '../../../utils/logger';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

type LeaderboardType =
  | 'totalxp'
  | 'rolls'
  | 'bricks'
  | 'jackpots'
  | 'opens'
  | 'releases'
  | 'trades'
  | 'quizzes'
  | 'streaks'
  | 'shutdowns'
  | 'highstreak'
  | 'battles'
  | 'wins'
  | 'underdogs'
  | 'highstakewins'
  | 'losses'
  | 'neverlucky'
  | 'highstakeloss';

const LEADERBOARD_TITLES: Record<LeaderboardType, string> = {
  totalxp: 'Total EXP Gained',
  rolls: 'Pokémon Rolled',
  bricks: 'Bricks',
  jackpots: 'Jackpot Participation',
  opens: 'Balls Opened',
  releases: 'Pokémon Released',
  trades: 'Pokémon Traded',
  quizzes: 'Quizzes Answered',
  streaks: 'Hot Streaks',
  shutdowns: 'Hot Streak Shutdowns',
  highstreak: 'Highest Streak',
  battles: 'Total Battles',
  wins: 'Total Wins',
  underdogs: 'Underdog Wins',
  highstakewins: 'High Stake Wins',
  losses: 'Total Losses',
  neverlucky: 'Never Lucky Losses',
  highstakeloss: 'High Stake Losses',
};

const LEADERBOARD_FIELDS: Record<LeaderboardType, keyof any> = {
  totalxp: 'totalExp',
  rolls: 'rolls',
  bricks: 'bricks',
  jackpots: 'jackpots',
  opens: 'opens',
  releases: 'releases',
  trades: 'trades',
  quizzes: 'quizAnswered',
  streaks: 'hotStreaks',
  shutdowns: 'shutdowns',
  highstreak: 'highestStreak',
  battles: 'battles',
  wins: 'wins',
  underdogs: 'underdogWins',
  highstakewins: 'highStakeWins',
  losses: 'losses',
  neverlucky: 'neverLuckyLosses',
  highstakeloss: 'highStakeLosses',
};

export async function handleLeaderboard(
  message: Message,
  args: string[],
): Promise<void> {
  const pageArg = args.length > 0 ? args[0].toLowerCase() : 'totalxp';

  // Check if it's a valid leaderboard type
  if (!(pageArg in LEADERBOARD_TITLES)) {
    // Show available leaderboards
    const title = '**__Available Leaderboards__**';
    let description = '';
    for (const key of Object.keys(LEADERBOARD_TITLES)) {
      description += `\n${key}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x000080);

    await message.reply({ embeds: [embed] });
    return;
  }

  const leaderboardType = pageArg as LeaderboardType;
  const title = `**__${LEADERBOARD_TITLES[leaderboardType]} Leaderboard__**`;
  const field = LEADERBOARD_FIELDS[leaderboardType];

  try {
    // Get all trainers sorted by the field
    const trainers = await trainerService.getTopTrainers(field as string, 10);

    if (trainers.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📊 Empty Leaderboard')
        .setDescription('No trainers found on the leaderboard!')
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Build description
    let description = '';
    for (const trainer of trainers) {
      const value = (trainer as any)[field];
      description += `\n${trainer.name} --- ${value}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x000080);

    await message.reply({ embeds: [embed] });

    Logger.info(`Displayed ${leaderboardType} leaderboard`);
  } catch (error) {
    Logger.error('Error handling leaderboard command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while fetching the leaderboard. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
