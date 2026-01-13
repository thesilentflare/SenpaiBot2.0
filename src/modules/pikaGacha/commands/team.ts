import { Message, EmbedBuilder } from 'discord.js';
import trainerService from '../services/TrainerService';
import userService from '../services/UserService';
import rankService from '../services/RankService';
import { TEAMS, TEAM_SWITCH_COST } from '../types';
import Logger from '../../../utils/logger';

const COLOR_SUCCESS = 0x00ff00;
const COLOR_ERROR = 0xff0000;
const COLOR_INFO = 0x00bfff;

/**
 * Handle the !pg team command
 */
export async function handleTeam(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;

  // If no args, show current team and available teams
  if (args.length === 0) {
    const trainer = await trainerService.getTrainer(userId);
    
    if (!trainer) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Not Registered')
        .setDescription('You must register first using `!pg register <name>`')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    const currentTeam = trainer.team || 'None';
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Team Information')
      .setDescription(
        `**Your Current Team:** ${currentTeam}\n\n` +
          `**Available Teams:**\n` +
          `• ${TEAMS.ELECTROCUTION.name}\n` +
          `• ${TEAMS.LENSFLARE.name}\n` +
          `• ${TEAMS.HYPERJOY.name}\n\n` +
          `**Usage:** \`!pg team <team_name>\`\n` +
          `**Examples:**\n` +
          `• \`!pg team electrocution\`\n` +
          `• \`!pg team lensflare\`\n` +
          `• \`!pg team hyperjoy\`\n\n` +
          (trainer.team !== '' 
            ? `**Note:** Switching teams costs **${TEAM_SWITCH_COST} pikapoints** and resets your rank and EXP!`
            : '**Note:** Joining your first team is free!'),
      )
      .setColor(COLOR_INFO);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Get the requested team
  const teamArg = args.join(' ').toLowerCase();
  let selectedTeam: string | null = null;

  if (teamArg.includes('electrocution')) {
    selectedTeam = TEAMS.ELECTROCUTION.name;
  } else if (teamArg.includes('lensflare')) {
    selectedTeam = TEAMS.LENSFLARE.name;
  } else if (teamArg.includes('hyperjoy')) {
    selectedTeam = TEAMS.HYPERJOY.name;
  }

  if (!selectedTeam) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Team')
      .setDescription(
        `Please choose from:\n` +
          `• ${TEAMS.ELECTROCUTION.name}\n` +
          `• ${TEAMS.LENSFLARE.name}\n` +
          `• ${TEAMS.HYPERJOY.name}`,
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const trainer = await trainerService.getTrainer(userId);
    
    if (!trainer) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Not Registered')
        .setDescription('You must register first using `!pg register <name>`')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check if already on this team
    if (trainer.team === selectedTeam) {
      const embed = new EmbedBuilder()
        .setDescription(`You're already on **${selectedTeam}**!`)
        .setColor(COLOR_INFO);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check if switching teams (costs points and resets rank)
    const isSwitching = trainer.team !== '';

    if (isSwitching) {
      // Check if user has enough points
      const user = await userService.getUserDetails(userId);
      if (user.points < TEAM_SWITCH_COST) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Insufficient Pikapoints')
          .setDescription(
            `Switching teams costs **${TEAM_SWITCH_COST} pikapoints**.\n` +
              `You have **${user.points} pikapoints**.\n` +
              `You need **${TEAM_SWITCH_COST - user.points} more**!`,
          )
          .setColor(COLOR_ERROR);
        await message.reply({ embeds: [embed] });
        return;
      }

      // Deduct points
      await userService.adjustPoints(userId, -TEAM_SWITCH_COST);
    }

    // Set the team (this will reset rank/exp if switching)
    await trainerService.setTeam(userId, selectedTeam);

    // If switching, also reset via RankService
    if (isSwitching) {
      await rankService.resetExp(userId);
    }

    const embed = new EmbedBuilder()
      .setTitle(isSwitching ? '🔄 Team Switched!' : '✅ Team Joined!')
      .setDescription(
        `**${trainer.name}** has ${isSwitching ? 'switched to' : 'joined'} **${selectedTeam}**!\n\n` +
          (isSwitching
            ? `**${TEAM_SWITCH_COST} pikapoints** deducted.\n` +
              `Your rank has been reset to **Recruit** and EXP reset to **0**.\n\n`
            : '') +
          `You can now gain EXP and rank up!\n` +
          `Use \`!pg trainer ${trainer.name}\` to view your progress.`,
      )
      .setColor(COLOR_SUCCESS);

    await message.reply({ embeds: [embed] });

    Logger.info(
      `Trainer ${trainer.name} (${userId}) ${isSwitching ? 'switched to' : 'joined'} ${selectedTeam}`,
    );
  } catch (error) {
    Logger.error('Error handling team command', error);
    const embed = new EmbedBuilder()
      .setDescription('❌ An error occurred while joining the team.')
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
