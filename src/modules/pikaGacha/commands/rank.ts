import { Message, EmbedBuilder } from 'discord.js';
import rankService from '../services/RankService';

const COLOR_SUCCESS = 0x00ff00;
const COLOR_ERROR = 0xff0000;

/**
 * Handle the !pg promote command
 */
export async function handlePromote(message: Message): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  try {
    const result = await rankService.promote(userId);

    if (!result.promoted) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Cannot Promote')
        .setDescription(
          result.message ||
            'You do not have enough EXP to promote to the next rank.',
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Promotion Success!')
      .setDescription(
        `**${username}** has been promoted to **${result.newRank}**!\n\n` +
          `${result.reward ? `**Reward:** ${result.reward}` : ''}`,
      )
      .setColor(COLOR_SUCCESS);
    await message.reply({ embeds: [embed] });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Promotion Failed')
      .setDescription(
        error instanceof Error ? error.message : 'An unknown error occurred',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}

/**
 * Handle the !pg prestige command
 */
export async function handlePrestige(message: Message): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  try {
    const canPrestige = await rankService.canPrestige(userId);

    if (!canPrestige) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Cannot Prestige')
        .setDescription('You must reach the **Boss** rank to prestige!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    const result = await rankService.prestige(userId);

    const embed = new EmbedBuilder()
      .setTitle('✨ Prestige Success!')
      .setDescription(
        `**${username}** has prestiged!\n\n` +
          `**Prestige Level:** ${result.prestigeLevel}\n` +
          `**Rank:** Reset to Recruit\n` +
          `**Reward:** 1× Master Ball`,
      )
      .setColor(COLOR_SUCCESS);
    await message.reply({ embeds: [embed] });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Prestige Failed')
      .setDescription(
        error instanceof Error ? error.message : 'An unknown error occurred',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
