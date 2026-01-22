import { Message, EmbedBuilder } from 'discord.js';
import trainerService from '../services/TrainerService';
import rankService from '../services/RankService';
import userService from '../services/UserService';
import Logger from '../../../utils/logger';

export async function handleProfile(
  message: Message,
  args: string[],
): Promise<void> {
  // If no name provided, show usage
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('🎮 Trainer Profile Usage')
      .setDescription(
        '**Usage:** `!pg trainer <trainer_name>`\n\n' +
          "View a trainer's profile card with all their stats.",
      )
      .setColor(0xffd700);
    await message.reply({ embeds: [embed] });
    return;
  }

  const trainerName = args.join(' ');

  try {
    // Get trainer by name
    const trainer = await trainerService.getTrainerByName(trainerName);

    if (!trainer) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Trainer Not Found')
        .setDescription(
          `There is no registered Pokémon Trainer with the name **${trainerName}**!`,
        )
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Get user from Discord
    const user = await message.client.users.fetch(trainer.userId);
    if (!user) {
      const embed = new EmbedBuilder()
        .setTitle('❌ User Not Found')
        .setDescription('Could not find user information.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Get next rank info
    const nextRank = await rankService.getNextRank(trainer.rank);
    let expUntilPromotion: string;

    if (trainer.team === '') {
      expUntilPromotion = 'N/A';
    } else if (trainer.rank === 'Boss') {
      // Only Boss rank can prestige
      expUntilPromotion = 'Eligible for Prestige!';
    } else if (!nextRank) {
      // Rank not found in database
      expUntilPromotion = 'Unknown (rank not found)';
    } else {
      expUntilPromotion = Math.max(
        0,
        nextRank.expRequired - trainer.rankExp,
      ).toString();
    }

    // Build trainer card
    const teamPrefix = trainer.team !== '' ? `${trainer.team} ` : '';
    const rankName = trainer.rank || 'Recruit';
    const title = `${user.username}'s Trainer Card`;
    const description =
      `${teamPrefix}${rankName} ${trainer.name}\nID: ${trainer.userId}\n\n` +
      `Total EXP Gained: ${trainer.totalExp}\n` +
      `EXP Gained in Current Rank: ${trainer.rankExp}\n` +
      `EXP Until Promotion: ${expUntilPromotion}\n` +
      `Prestige: ${trainer.prestige}\n\n` +
      `**__Summoning Stats__**\n` +
      `Pokémon Rolled: ${trainer.rolls}\n` +
      `Bricks: ${trainer.bricks}\n` +
      `Jackpot Participation: ${trainer.jackpots}\n` +
      `Balls Opened: ${trainer.opens}\n` +
      `Pokémon Released: ${trainer.releases}\n` +
      `Pokémon Traded: ${trainer.trades}\n\n` +
      `**__Quiz Stats__**\n` +
      `Quizzes Answered: ${trainer.quizAnswered}\n` +
      `Hot Streaks: ${trainer.hotStreaks}\n` +
      `Hot Streak Shutdowns: ${trainer.shutdowns}\n` +
      `Highest Streak: ${trainer.highestStreak}\n\n` +
      `**__Battle Stats__**\n` +
      `Total Battles: ${trainer.battles}\n` +
      `Total Wins: ${trainer.wins}\n` +
      `Underdog Wins: ${trainer.underdogWins}\n` +
      `High Stake Wins: ${trainer.highStakeWins}\n` +
      `Total Losses: ${trainer.losses}\n` +
      `Never Lucky Losses: ${trainer.neverLuckyLosses}\n` +
      `High Stake Losses: ${trainer.highStakeLosses}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xffffff)
      .setThumbnail(user.displayAvatarURL());

    if (message.channel.isSendable()) {
      await message.channel.send({ embeds: [embed] });
    }

    Logger.info(
      `Displayed trainer card for ${trainerName} (${trainer.userId})`,
    );
  } catch (error) {
    Logger.error('Error handling trainer command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while fetching trainer information. Please try again.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleBalance(message: Message): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  try {
    const balance = await userService.getPikapoints(userId);
    const savings = await userService.getSavings(userId);

    const embed = new EmbedBuilder()
      .setTitle(`💰 ${username}'s Balance`)
      .addFields([
        { name: 'Pikapoints', value: balance.toString(), inline: true },
        { name: 'Savings', value: savings.toString(), inline: true },
        {
          name: 'Total',
          value: (balance + savings).toString(),
          inline: true,
        },
      ])
      .setColor(0xffd700)
      .setThumbnail(message.author.displayAvatarURL());

    await message.reply({ embeds: [embed] });

    Logger.info(
      `${username} (${userId}) checked balance: ${balance} pikapoints, ${savings} savings`,
    );
  } catch (error) {
    Logger.error('Error handling balance command', error);
    const embed = new EmbedBuilder()
      .setDescription(
        '❌ An error occurred while fetching your balance. Please try again.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}
