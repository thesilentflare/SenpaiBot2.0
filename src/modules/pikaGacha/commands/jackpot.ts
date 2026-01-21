import { Message, EmbedBuilder } from 'discord.js';
import jackpotService from '../services/JackpotService';
import Logger from '../../../utils/logger';

const logger = Logger.forModule('pikaGacha-jackpot');
const COLOR_JACKPOT = 0xffd700; // Gold color

/**
 * Handle !pg jackpot command - View current jackpot information
 */
export async function handleJackpot(message: Message): Promise<void> {
  try {
    const totalJackpot = await jackpotService.getTotalJackpot();
    const userContribution = await jackpotService.getUserContribution(
      message.author.id,
    );
    const isEligible = await jackpotService.isEligible(message.author.id);
    const contributors = await jackpotService.getContributors();
    const eligibleCount = contributors.filter(
      (c) => c.contribution >= 3,
    ).length;

    const embed = new EmbedBuilder()
      .setTitle('💰 Jackpot Pool')
      .setDescription(
        `The jackpot is a shared pool that pays out when someone rolls a Legendary or Mythic Pokémon!\n\n` +
          `**Current Pool:** ${totalJackpot} pikapoints\n` +
          `**Total Contributors:** ${contributors.length}\n` +
          `**Eligible Contributors:** ${eligibleCount}\n\n` +
          `**Your Contribution:** ${userContribution} pikapoints\n` +
          `**Your Status:** ${isEligible ? '✅ Eligible for rewards' : '❌ Need 3+ points to be eligible'}\n\n` +
          `**How it works:**\n` +
          `• Every roll contributes points to the jackpot\n` +
          `• When someone rolls a 6⭐ Legendary, the jackpot pays out\n` +
          `• When someone rolls a 7⭐ Mythic, the jackpot pays out at 2x\n` +
          `• Eligible contributors (3+ points) split the pool equally\n` +
          `• Each winner also receives a random ball!`,
      )
      .setColor(COLOR_JACKPOT)
      .setFooter({ text: 'Keep rolling to increase your share!' })
      .setTimestamp();

    // Add top contributors if there are any
    if (contributors.length > 0) {
      const topContributors = contributors.slice(0, 5);
      const contributorList = await Promise.all(
        topContributors.map(async (c, index) => {
          try {
            const user = await message.client.users.fetch(c.userId);
            const eligibleEmoji = c.contribution >= 3 ? '✅' : '❌';
            return `${index + 1}. ${eligibleEmoji} ${user.tag}: ${c.contribution} points`;
          } catch (error) {
            return `${index + 1}. Unknown User: ${c.contribution} points`;
          }
        }),
      );

      embed.addFields({
        name: '🏆 Top Contributors',
        value: contributorList.join('\n'),
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error handling jackpot command', error);
    await message.reply(
      '❌ An error occurred while fetching jackpot information.',
    );
  }
}
