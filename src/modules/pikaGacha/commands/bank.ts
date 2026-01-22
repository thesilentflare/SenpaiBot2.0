import { Message, EmbedBuilder } from 'discord.js';
import userService from '../services/UserService';
import Logger from '../../../utils/logger';

const COLOR_SUCCESS = 0x00ff00;
const COLOR_ERROR = 0xff0000;
const COLOR_INFO = 0xffd700;

/**
 * Handle the !pg transfer command
 * Transfer pikapoints from balance to savings
 */
export async function handleTransfer(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('💰 Transfer to Savings')
      .setDescription(
        '**Usage:** `!pg transfer <amount>`\n\n' +
          'Transfer pikapoints from your balance to your savings account.\n\n' +
          '**Examples:**\n' +
          '• `!pg transfer 100` - Transfer 100 pikapoints to savings\n' +
          '• `!pg transfer all` - Transfer all your pikapoints to savings',
      )
      .setColor(COLOR_INFO);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const user = await userService.getUserDetails(userId);
    let amount: number;

    // Handle "all" keyword
    if (args[0].toLowerCase() === 'all') {
      amount = user.points;
    } else {
      amount = parseInt(args[0]);
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Please provide a valid positive amount!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check if user has enough points
    if (user.points < amount) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Insufficient Balance')
        .setDescription(
          `You don't have enough pikapoints!\n\n` +
            `**Balance:** ${user.points}\n` +
            `**Attempted Transfer:** ${amount}\n` +
            `**Shortage:** ${amount - user.points}`,
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Perform the transfer
    await userService.adjustPoints(userId, -amount);
    await userService.adjustSavings(userId, amount);

    const newUser = await userService.getUserDetails(userId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Transfer Successful')
      .setDescription(
        `Transferred **${amount} pikapoints** to savings!\n\n` +
          `**New Balance:** ${newUser.points}\n` +
          `**New Savings:** ${newUser.savings}`,
      )
      .setColor(COLOR_SUCCESS);

    await message.reply({ embeds: [embed] });

    Logger.info(`User ${userId} transferred ${amount} pikapoints to savings`);
  } catch (error) {
    Logger.error('Error handling transfer command', error);
    const embed = new EmbedBuilder()
      .setDescription('❌ An error occurred during the transfer.')
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}

/**
 * Handle the !pg withdraw command
 * Withdraw pikapoints from savings to balance
 */
export async function handleWithdraw(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('💸 Withdraw from Savings')
      .setDescription(
        '**Usage:** `!pg withdraw <amount>`\n\n' +
          'Withdraw pikapoints from your savings to your balance.\n\n' +
          '**Examples:**\n' +
          '• `!pg withdraw 100` - Withdraw 100 pikapoints from savings\n' +
          '• `!pg withdraw all` - Withdraw all your savings',
      )
      .setColor(COLOR_INFO);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const user = await userService.getUserDetails(userId);
    let amount: number;

    // Handle "all" keyword
    if (args[0].toLowerCase() === 'all') {
      amount = user.savings;
    } else {
      amount = parseInt(args[0]);
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Please provide a valid positive amount!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check if user has enough savings
    if (user.savings < amount) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Insufficient Savings')
        .setDescription(
          `You don't have enough pikapoints in savings!\n\n` +
            `**Savings:** ${user.savings}\n` +
            `**Attempted Withdrawal:** ${amount}\n` +
            `**Shortage:** ${amount - user.savings}`,
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Perform the withdrawal
    await userService.adjustSavings(userId, -amount);
    await userService.adjustPoints(userId, amount);

    const newUser = await userService.getUserDetails(userId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Withdrawal Successful')
      .setDescription(
        `Withdrew **${amount} pikapoints** from savings!\n\n` +
          `**New Balance:** ${newUser.points}\n` +
          `**New Savings:** ${newUser.savings}`,
      )
      .setColor(COLOR_SUCCESS);

    await message.reply({ embeds: [embed] });

    Logger.info(`User ${userId} withdrew ${amount} pikapoints from savings`);
  } catch (error) {
    Logger.error('Error handling withdraw command', error);
    const embed = new EmbedBuilder()
      .setDescription('❌ An error occurred during the withdrawal.')
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
