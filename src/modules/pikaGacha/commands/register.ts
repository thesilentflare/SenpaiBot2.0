import { Message, EmbedBuilder } from 'discord.js';
import trainerService from '../services/TrainerService';
import userService from '../services/UserService';
import Logger from '../../../utils/logger';

const COLOR = 0xffd700; // Gold color for PikaGacha

export async function handleRegister(
  message: Message,
  args: string[],
): Promise<void> {
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Register as a Trainer')
      .setDescription(
        '**Usage:** `!pg register <trainer_name>`\n\n' +
          '**Examples:**\n' +
          '• `!pg register Ash`\n' +
          '• `!pg register "Red Oak"` (use quotes for spaces)\n\n' +
          'Create your PikaGacha profile and receive starter pikapoints!',
      )
      .setColor(COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  const trainerName = args.join(' ');

  // Validate name length
  if (trainerName.length < 2 || trainerName.length > 20) {
    const embed = new EmbedBuilder()
      .setDescription('❌ Trainer name must be between 2 and 20 characters!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    // Ensure User record exists first (Trainer has foreign key to User)
    await userService.getOrCreateUser(message.author.id);

    const result = await trainerService.register(
      message.author.id,
      trainerName,
    );

    if (result.status === 'taken') {
      const embed = new EmbedBuilder()
        .setDescription(
          `❌ The trainer name **${trainerName}** is already taken!\nPlease choose a different name.`,
        )
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (result.status === 'unchanged') {
      const embed = new EmbedBuilder()
        .setDescription(
          `✅ You're already registered as **${trainerName}**!\n\nUse \`!pg balance\` to check your pikapoints.`,
        )
        .setColor(0x00ff00);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (result.status === 'updated') {
      const embed = new EmbedBuilder()
        .setDescription(
          `✅ Your trainer name has been updated to **${trainerName}**!`,
        )
        .setColor(0x00ff00);
      await message.reply({ embeds: [embed] });
      return;
    }

    // New registration - give starter bonus
    if (result.status === 'created') {
      const STARTER_BONUS = 100;
      await userService.adjustPoints(message.author.id, STARTER_BONUS);

      const embed = new EmbedBuilder()
        .setTitle(`🎉 Welcome to PikaGacha, ${trainerName}!`)
        .setDescription(
          `You've been registered and received **${STARTER_BONUS} pikapoints** to get started!\n\n` +
            `**📋 Getting Started:**\n` +
            `• \`!pg roll\` - Gacha for Pokémon (30 pikapoints)\n` +
            `• \`!pg balance\` - Check your points\n` +
            `• \`!pg inventory\` - View your collection\n` +
            `• \`!pg trainer ${trainerName}\` - View your profile\n\n` +
            `Good luck on your journey! 🌟`,
        )
        .setColor(COLOR)
        .setThumbnail(message.author.displayAvatarURL());

      await message.reply({ embeds: [embed] });

      Logger.info(
        `New trainer registered: ${trainerName} (${message.author.id}) with ${STARTER_BONUS} starter bonus`,
      );
    }
  } catch (error) {
    Logger.error('Error handling register command', error);
    const embed = new EmbedBuilder()
      .setDescription(
        '❌ An error occurred during registration. Please try again.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}
