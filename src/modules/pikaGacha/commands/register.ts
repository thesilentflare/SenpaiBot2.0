import { Message, EmbedBuilder, MessageReaction, User } from 'discord.js';
import trainerService from '../services/TrainerService';
import userService from '../services/UserService';
import { TEAMS } from '../types';
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

      const welcomeEmbed = new EmbedBuilder()
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

      await message.reply({ embeds: [welcomeEmbed] });

      Logger.info(
        `New trainer registered: ${trainerName} (${message.author.id}) with ${STARTER_BONUS} starter bonus`,
      );

      // Prompt for team selection
      await promptTeamSelection(message, trainerName);
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

/**
 * Prompt user to select a team using reactions
 */
async function promptTeamSelection(
  message: Message,
  trainerName: string,
): Promise<void> {
  const teamEmbed = new EmbedBuilder()
    .setTitle('⚔️ Choose Your Team!')
    .setDescription(
      `**${trainerName}**, select your team by reacting below:\n\n` +
        `<:electrocution:${TEAMS.ELECTROCUTION.emojiId}> **${TEAMS.ELECTROCUTION.name}**\n` +
        `<:lensflare:${TEAMS.LENSFLARE.emojiId}> **${TEAMS.LENSFLARE.name}**\n` +
        `<:hyperjoy:${TEAMS.HYPERJOY.emojiId}> **${TEAMS.HYPERJOY.name}**\n\n` +
        `React within 60 seconds to join your team!`,
    )
    .setColor(0x00bfff);

  try {
    if (!message.channel.isSendable()) {
      Logger.warn('Cannot send team selection in this channel type');
      return;
    }

    const teamMessage = await message.channel.send({ embeds: [teamEmbed] });

    // Store emoji IDs as constants to ensure they're evaluated once
    const electrocutionId = TEAMS.ELECTROCUTION.emojiId;
    const lensflareId = TEAMS.LENSFLARE.emojiId;
    const hyperjoyId = TEAMS.HYPERJOY.emojiId;

    Logger.info(`Team emoji IDs: ${electrocutionId}, ${lensflareId}, ${hyperjoyId}`);

    // Add reaction emojis
    await teamMessage.react(electrocutionId);
    await teamMessage.react(lensflareId);
    await teamMessage.react(hyperjoyId);

    // Create reaction collector
    const filter = (reaction: MessageReaction, user: User) => {
      Logger.info(`Reaction filter - User: ${user.id}, Author: ${message.author.id}, Emoji ID: ${reaction.emoji.id}`);
      return (
        user.id === message.author.id &&
        [electrocutionId, lensflareId, hyperjoyId].includes(
          reaction.emoji.id || '',
        )
      );
    };

    const collector = teamMessage.createReactionCollector({
      filter,
      max: 1,
      time: 60000,
    });

    collector.on('collect', async (reaction: MessageReaction) => {
      Logger.info(`Collected reaction with emoji ID: ${reaction.emoji.id}`);
      let selectedTeam: string = '';

      if (reaction.emoji.id === electrocutionId) {
        selectedTeam = TEAMS.ELECTROCUTION.name;
      } else if (reaction.emoji.id === lensflareId) {
        selectedTeam = TEAMS.LENSFLARE.name;
      } else if (reaction.emoji.id === hyperjoyId) {
        selectedTeam = TEAMS.HYPERJOY.name;
      }

      Logger.info(`Selected team: ${selectedTeam}`);

      if (selectedTeam) {
        await trainerService.setTeam(message.author.id, selectedTeam);

        const confirmEmbed = new EmbedBuilder()
          .setTitle('✅ Team Selected!')
          .setDescription(
            `**${trainerName}** has joined **${selectedTeam}**!\n\n` +
              `You can now gain EXP and rank up through your team.\n` +
              `Use \`!pg trainer ${trainerName}\` to view your progress!`,
          )
          .setColor(0x00ff00);

        if (message.channel.isSendable()) {
          await message.channel.send({ embeds: [confirmEmbed] });
        }
        await teamMessage.delete().catch(() => {});

        Logger.info(
          `Trainer ${trainerName} (${message.author.id}) joined ${selectedTeam}`,
        );
      }
    });

    collector.on('end', async () => {
      if (collector.collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setDescription(
            `⏱️ Team selection timed out. You can join a team later using \`!pg team <team_name>\`.`,
          )
          .setColor(0xff9900);

        if (message.channel.isSendable()) {
          await message.channel.send({ embeds: [timeoutEmbed] });
        }
        await teamMessage.delete().catch(() => {});
      }
    });
  } catch (error) {
    Logger.error('Error in team selection prompt', error);
  }
}
