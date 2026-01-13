import { Message, EmbedBuilder } from 'discord.js';
import pokemonService from '../services/PokemonService';
import { Pokemon, Trainer } from '../models';
import { isAdmin } from '../../adminManager/helpers';
import Logger from '../../../utils/logger';
import userService from '../services/UserService';
import { QuizService } from '../services/QuizService';
import { VoiceRewardService } from '../services/VoiceRewardService';
import * as fs from 'fs';
import * as path from 'path';
import {
  getLatestSeedFile,
  saveUploadedSeedFile,
  listUploadedSeedFiles,
  deleteUploadedSeedFile,
} from '../utils/seedManager';
import axios from 'axios';

const ADMIN_COLOR = 0xff6b6b; // Red color for admin commands

interface PokemonData {
  id: number;
  name: string;
  rarity: number;
  focus: number;
  bst: number;
}

/**
 * Parse pokedata.csv file
 */
function parsePokemonCSV(filePath: string): PokemonData[] {
  const data: PokemonData[] = [];
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    if (parts.length < 5) continue;

    data.push({
      id: parseInt(parts[0]),
      name: parts[1].trim(),
      rarity: parseInt(parts[2]),
      focus: parseInt(parts[3]),
      bst: parseInt(parts[4]),
    });
  }

  return data;
}

/**
 * Determine regionId based on Pokemon ID
 */
function getRegionId(pokemonId: number): number {
  if (pokemonId >= 10000) return 0; // Special
  if (pokemonId <= 151) return 1; // Kanto
  if (pokemonId <= 251) return 2; // Johto
  if (pokemonId <= 386) return 3; // Hoenn
  if (pokemonId <= 493) return 4; // Sinnoh
  if (pokemonId <= 649) return 5; // Unova
  if (pokemonId <= 721) return 6; // Kalos
  if (pokemonId <= 809) return 7; // Alola
  if (pokemonId <= 905) return 8; // Galar
  if (pokemonId <= 1025) return 9; // Paldea
  return 0; // Special (fallback)
}

/**
 * Check if Pokemon is special (custom/event Pokemon)
 */
function isSpecialPokemon(pokemonId: number): boolean {
  return pokemonId >= 10000;
}

export async function handleReseed(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check using server database
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  const confirmFlag = args.includes('--confirm');

  if (!confirmFlag) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Database Reseed Warning')
      .setDescription(
        'This will update all Pokemon data from pokedata.csv.\n' +
          'Existing Pokemon will be updated with new stats.\n' +
          'New Pokemon will be added.\n\n' +
          'This operation is **safe** and will not delete user data (inventories, etc.)\n\n' +
          'To proceed, run: `!pg reseed --confirm`',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  const startEmbed = new EmbedBuilder()
    .setTitle('🔄 Reseeding Database')
    .setDescription('Starting database reseed... This may take a minute.')
    .setColor(ADMIN_COLOR);
  const statusMessage = await message.reply({ embeds: [startEmbed] });

  try {
    // Get the latest seed file (uploaded or default)
    const csvPath = getLatestSeedFile();
    Logger.info(`Reseeding from: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Seed file not found!')
        .setColor(0xff0000);
      await statusMessage.edit({ embeds: [embed] });
      return;
    }

    // Parse CSV
    const pokemonData = parsePokemonCSV(csvPath);
    Logger.info(`Reseeding ${pokemonData.length} Pokemon...`);

    let inserted = 0;
    let updated = 0;

    for (const data of pokemonData) {
      const regionId = getRegionId(data.id);
      const isSpecial = isSpecialPokemon(data.id);

      const [pokemon, created] = await Pokemon.findOrCreate({
        where: { id: data.id },
        defaults: {
          id: data.id,
          name: data.name,
          rarity: data.rarity,
          focus: data.focus === 1,
          bst: data.bst,
          regionId,
          isSpecial,
          active: isSpecial ? true : false,
        },
      });

      if (created) {
        inserted++;
      } else {
        // Update existing Pokemon
        await pokemon.update({
          name: data.name,
          rarity: data.rarity,
          focus: data.focus === 1,
          bst: data.bst,
          regionId,
          isSpecial,
        });
        updated++;
      }
    }

    const seedFileName = path.basename(csvPath);
    const completeEmbed = new EmbedBuilder()
      .setTitle('✅ Database Reseed Complete!')
      .addFields([
        { name: 'New Pokemon Added', value: `**${inserted}**`, inline: true },
        {
          name: 'Existing Pokemon Updated',
          value: `**${updated}**`,
          inline: true,
        },
        {
          name: 'Total Pokemon',
          value: `**${pokemonData.length}**`,
          inline: true,
        },
        {
          name: 'Seed File Used',
          value: `${seedFileName}`,
          inline: false,
        },
      ])
      .setDescription('The bot is still running normally.')
      .setColor(ADMIN_COLOR);

    await statusMessage.edit({ embeds: [completeEmbed] });

    Logger.info(`Reseed complete: ${inserted} inserted, ${updated} updated`);
  } catch (error) {
    Logger.error('Error during reseed', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Reseed Error')
      .setDescription(
        'An error occurred during the reseed. Check logs for details.',
      )
      .setColor(0xff0000);
    await statusMessage.edit({ embeds: [embed] });
  }
}

export async function handleUploadSeed(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Check if a file is attached
  if (message.attachments.size === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📎 Upload Seed CSV')
      .setDescription(
        'Please attach a CSV file to this command.\n\n' +
          'The file should have the format:\n' +
          '`id,name,rarity,focus,bst`\n\n' +
          'Example: `!pg uploadseed` with a .csv file attached',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  const attachment = message.attachments.first();

  if (!attachment) {
    await message.reply('❌ No attachment found!');
    return;
  }

  // Check file extension
  if (!attachment.name?.endsWith('.csv')) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid File Type')
      .setDescription('Please upload a .csv file!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const processingEmbed = new EmbedBuilder()
      .setTitle('📥 Downloading CSV...')
      .setDescription('Please wait...')
      .setColor(ADMIN_COLOR);
    const statusMessage = await message.reply({ embeds: [processingEmbed] });

    // Download the file
    const response = await axios.get(attachment.url, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Validate CSV format by parsing
    const csvContent = buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid CSV')
        .setDescription('The CSV file is empty!')
        .setColor(0xff0000);
      await statusMessage.edit({ embeds: [embed] });
      return;
    }

    // Basic validation - check first line has correct number of columns
    const firstLine = lines[0].split(',');
    if (firstLine.length < 5) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid CSV Format')
        .setDescription(
          'CSV must have at least 5 columns: `id,name,rarity,focus,bst`',
        )
        .setColor(0xff0000);
      await statusMessage.edit({ embeds: [embed] });
      return;
    }

    // Save the file
    const savedPath = await saveUploadedSeedFile(buffer, attachment.name);
    const filename = path.basename(savedPath);

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Seed CSV Uploaded!')
      .addFields([
        { name: 'Filename', value: filename, inline: false },
        { name: 'Size', value: `${buffer.length} bytes`, inline: true },
        { name: 'Entries', value: `~${lines.length}`, inline: true },
      ])
      .setDescription(
        'The CSV has been saved and will be used for the next reseed.\n\n' +
          'Run `!pg reseed --confirm` to apply the new data.',
      )
      .setColor(ADMIN_COLOR);

    await statusMessage.edit({ embeds: [successEmbed] });
    Logger.info(
      `Admin ${message.author.tag} uploaded new seed CSV: ${filename}`,
    );
  } catch (error) {
    Logger.error('Error uploading seed CSV', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Upload Error')
      .setDescription('Failed to upload the CSV file. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleListSeeds(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const seedFiles = listUploadedSeedFiles();
    const currentSeedFile = getLatestSeedFile();

    const embed = new EmbedBuilder()
      .setTitle('📋 Uploaded Seed Files')
      .setColor(ADMIN_COLOR);

    if (seedFiles.length === 0) {
      embed.setDescription(
        'No uploaded seed files found.\n\n' +
          `Currently using: **${path.basename(currentSeedFile)}** (default)`,
      );
    } else {
      let description = `**Currently using:** ${path.basename(currentSeedFile)}\n\n`;
      description += '**Uploaded Files:**\n';

      for (const file of seedFiles) {
        const sizeKB = (file.size / 1024).toFixed(2);
        const dateStr = file.created.toLocaleString();
        description += `• ${file.filename}\n  Size: ${sizeKB} KB | Uploaded: ${dateStr}\n`;
      }

      embed.setDescription(description);
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error('Error listing seed files', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('Failed to list seed files.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleSetFocus(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check using server database
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (args.length < 2) {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Set Focus Usage')
      .setDescription(
        '**Usage:** `!pg setfocus <pokemon_name_or_id> <true|false>`\n\n' +
          '**Examples:**\n' +
          '• `!pg setfocus Charizard true` - Set Charizard as focus\n' +
          '• `!pg setfocus 6 false` - Remove focus from Pokémon ID 6',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  const pokemonIdentifier = args[0];
  const focusValue = args[1].toLowerCase() === 'true';

  try {
    // Try to parse as ID first
    const pokemonId = parseInt(pokemonIdentifier);
    let pokemon;

    if (!isNaN(pokemonId)) {
      pokemon = await Pokemon.findByPk(pokemonId);
    } else {
      pokemon = await pokemonService.getPokemon(pokemonIdentifier);
    }

    if (!pokemon) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Not Found')
        .setDescription('Pokemon not found!')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Update focus directly
    await pokemon.update({ focus: focusValue });

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Focus Updated')
      .addFields([
        { name: 'Pokemon', value: pokemon.name, inline: true },
        {
          name: 'Focus Status',
          value: focusValue
            ? 'Now a focus Pokemon'
            : 'No longer a focus Pokemon',
          inline: true,
        },
      ])
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [successEmbed] });

    Logger.info(
      `Focus updated: ${pokemon.name} (${pokemon.id}) set to ${focusValue}`,
    );
  } catch (error) {
    Logger.error('Error setting focus', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleRemoveFocus(message: Message): Promise<void> {
  // Admin-only check using server database
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    // Remove focus from all Pokemon
    const result = await Pokemon.update(
      { focus: false },
      { where: { focus: true } },
    );

    const count = result[0]; // Number of rows updated

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Focus Removed')
      .setDescription(
        `Focus has been removed from **${count}** Pokémon.\n\n` +
          'All Pokémon are now rolling at normal rates.',
      )
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [successEmbed] });

    Logger.info(`Focus removed from ${count} Pokemon`);
  } catch (error) {
    Logger.error('Error removing focus', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleAddPoints(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check using server database
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (args.length < 2) {
    const embed = new EmbedBuilder()
      .setTitle('💰 Add Points Usage')
      .setDescription(
        '**Usage:** `!pg addpoints <@user|user_id> <amount>`\n\n' +
          '**Examples:**\n' +
          '• `!pg addpoints @User 1000` - Give 1000 pikapoints to User\n' +
          '• `!pg addpoints 123456789012345678 500` - Give 500 points by ID',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Parse user mention or ID (addpoints)
  const userMention = args[0];
  const userId = userMention.replace(/[<@!>]/g, '');
  const amount = parseInt(args[1]);

  if (isNaN(amount)) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Amount')
      .setDescription('Amount must be a number!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (amount <= 0) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Amount')
      .setDescription(
        'Amount must be positive! Use `!pg removepoints` to subtract.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const user = await userService.getOrCreateUser(userId);
    const oldBalance = user.points;
    await userService.adjustPoints(userId, amount);
    const newBalance = oldBalance + amount;

    // Try to get Discord user for display name
    let displayName = userId;
    try {
      const discordUser = await message.client.users.fetch(userId);
      displayName = discordUser.username;
    } catch {
      // User not found, use ID
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Points Added')
      .addFields([
        { name: 'User', value: displayName, inline: false },
        {
          name: 'Amount',
          value: `+${amount.toLocaleString()} pikapoints`,
          inline: true,
        },
        {
          name: 'Old Balance',
          value: oldBalance.toLocaleString(),
          inline: true,
        },
        {
          name: 'New Balance',
          value: newBalance.toLocaleString(),
          inline: true,
        },
      ])
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [embed] });

    Logger.info(
      `Admin ${message.author.id} added ${amount} points to ${userId} (${oldBalance} → ${newBalance})`,
    );
  } catch (error) {
    Logger.error('Error adding points', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleRemovePoints(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check using server database
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (args.length < 2) {
    const embed = new EmbedBuilder()
      .setTitle('💰 Remove Points Usage')
      .setDescription(
        '**Usage:** `!pg removepoints <@user|user_id> <amount>`\n\n' +
          '**Examples:**\n' +
          '• `!pg removepoints @User 500` - Remove 500 pikapoints from User\n' +
          '• `!pg removepoints 123456789012345678 100` - Remove 100 points by ID',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Parse user mention or ID (removepoints)
  const userMention = args[0];
  const userId = userMention.replace(/[<@!>]/g, '');
  const amount = parseInt(args[1]);

  if (isNaN(amount)) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Amount')
      .setDescription('Amount must be a number!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (amount <= 0) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Amount')
      .setDescription('Amount must be positive! Use `!pg addpoints` to add.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const user = await userService.getOrCreateUser(userId);
    const oldBalance = user.points;
    await userService.adjustPoints(userId, -amount);
    const newBalance = oldBalance - amount;

    // Try to get Discord user for display name
    let displayName = userId;
    try {
      const discordUser = await message.client.users.fetch(userId);
      displayName = discordUser.username;
    } catch {
      // User not found, use ID
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Points Removed')
      .addFields([
        { name: 'User', value: displayName, inline: false },
        {
          name: 'Amount',
          value: `-${amount.toLocaleString()} pikapoints`,
          inline: true,
        },
        {
          name: 'Old Balance',
          value: oldBalance.toLocaleString(),
          inline: true,
        },
        {
          name: 'New Balance',
          value: newBalance.toLocaleString(),
          inline: true,
        },
      ])
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [embed] });

    Logger.info(
      `Admin ${message.author.id} removed ${amount} points from ${userId} (${oldBalance} → ${newBalance})`,
    );
  } catch (error) {
    Logger.error('Error removing points', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleGiveAll(
  message: Message,
  args: string[],
): Promise<void> {
  // Admin-only check using server database
  if (!(await isAdmin(message.author.id, message.guild))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('This command is admin-only!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (args.length < 1) {
    const embed = new EmbedBuilder()
      .setTitle('🎁 Give All Usage')
      .setDescription(
        '**Usage:** `!pg giveall <amount> [--confirm]`\n\n' +
          '**Examples:**\n' +
          '• `!pg giveall 500` - Preview giving 500 points to all registered users\n' +
          '• `!pg giveall 1000 --confirm` - Give 1000 points to all users\n\n' +
          '⚠️ This gives points to ALL registered trainers!',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  const amount = parseInt(args[0]);
  const confirmFlag = args.includes('--confirm');

  if (isNaN(amount)) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Amount')
      .setDescription('Amount must be a number!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  if (amount <= 0) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Amount')
      .setDescription('Amount must be positive!')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    // Get all registered trainers
    const trainers = await Trainer.findAll();

    if (trainers.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('❌ No Trainers Found')
        .setDescription('No registered trainers found!')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Preview mode
    if (!confirmFlag) {
      const previewEmbed = new EmbedBuilder()
        .setTitle('⚠️ Mass Give Points Preview')
        .addFields([
          {
            name: 'Amount per User',
            value: `${amount.toLocaleString()} pikapoints`,
            inline: true,
          },
          { name: 'Total Users', value: `${trainers.length}`, inline: true },
          {
            name: 'Total Points to Distribute',
            value: `${(amount * trainers.length).toLocaleString()}`,
            inline: false,
          },
        ])
        .setDescription(
          `This will give ${amount.toLocaleString()} pikapoints to all ${trainers.length} registered trainers.\n\n` +
            `To proceed, run: \`!pg giveall ${amount} --confirm\``,
        )
        .setColor(ADMIN_COLOR);
      await message.reply({ embeds: [previewEmbed] });
      return;
    }

    // Execute mass give
    const startEmbed = new EmbedBuilder()
      .setTitle('🔄 Processing Mass Give')
      .setDescription(
        `Giving ${amount.toLocaleString()} pikapoints to ${trainers.length} trainers...`,
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [startEmbed] });

    let successCount = 0;
    let failCount = 0;

    for (const trainer of trainers) {
      try {
        await userService.adjustPoints(trainer.userId, amount);
        successCount++;
      } catch (error) {
        Logger.error(`Failed to give points to ${trainer.userId}`, error);
        failCount++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Mass Give Complete!')
      .addFields([
        {
          name: 'Amount Given',
          value: `${amount.toLocaleString()} pikapoints`,
          inline: false,
        },
        { name: 'Successful', value: `${successCount} users`, inline: true },
        { name: 'Failed', value: `${failCount} users`, inline: true },
        {
          name: 'Total Distributed',
          value: `${(amount * successCount).toLocaleString()} pikapoints`,
          inline: false,
        },
      ])
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [embed] });

    Logger.info(
      `Admin ${message.author.id} gave ${amount} points to ${successCount} users (${failCount} failed)`,
    );
  } catch (error) {
    Logger.error('Error in mass give points', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

/**
 * Trigger a quiz in 10 seconds
 * Usage: !pg admin triggerquiz [text|sprite]
 */
export async function handleTriggerQuiz(
  message: Message,
  args: string[],
): Promise<void> {
  if (!(await isAdmin(message.author.id))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('Only administrators can trigger quizzes.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const quizService = QuizService.getInstance();
    const stats = quizService.getQuizStats();

    if (!stats.isActive) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Quiz System Inactive')
        .setDescription('Quiz system is not currently running.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (stats.activeQuiz) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Quiz Already Active')
        .setDescription('There is already an active quiz in progress.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Parse quiz type (optional)
    const quizType = args[0]?.toLowerCase();
    let type: 'text' | 'sprite' | undefined = undefined;

    if (quizType === 'text' || quizType === 'sprite') {
      type = quizType;
    }

    // Schedule quiz in 10 seconds
    setTimeout(async () => {
      await quizService.triggerQuiz(type);
    }, 10000);

    const typeStr = type ? ` (${type})` : ' (random)';
    const embed = new EmbedBuilder()
      .setTitle('⏰ Quiz Scheduled')
      .setDescription(`A${typeStr} quiz will start in **10 seconds**!`)
      .addFields([
        {
          name: 'Channel',
          value: stats.channelId ? `<#${stats.channelId}>` : 'Unknown',
          inline: false,
        },
      ])
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [embed] });

    Logger.info(`Admin ${message.author.id} triggered a quiz in 10 seconds`);
  } catch (error) {
    Logger.error('Error triggering quiz', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred while scheduling the quiz.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

/**
 * View voice channel stats for a user
 */
export async function handleVoiceStats(
  message: Message,
  args: string[],
): Promise<void> {
  if (!(await isAdmin(message.author.id))) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Access Denied')
      .setDescription('Only administrators can view voice stats.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    // Parse user mention or ID
    let targetUserId = message.author.id;
    if (args.length > 0) {
      const mention = args[0].match(/^<@!?(\d+)>$/);
      targetUserId = mention ? mention[1] : args[0];
    }

    const voiceService = VoiceRewardService.getInstance();
    const stats = await voiceService.getVoiceStats(targetUserId);

    if (!stats) {
      const embed = new EmbedBuilder()
        .setTitle('❌ User Not Found')
        .setDescription('User is not registered in PikaGacha.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎤 Voice Channel Stats')
      .setDescription(`Stats for <@${targetUserId}>`)
      .addFields([
        {
          name: 'Currently in Voice',
          value: stats.inVoice ? 'Yes ✅' : 'No ❌',
          inline: true,
        },
        {
          name: 'Time in Voice',
          value: stats.inVoice
            ? `${Math.floor(stats.timeInVoice / 60000)} minutes`
            : 'N/A',
          inline: true,
        },
        {
          name: 'Next Reward In',
          value: stats.inVoice
            ? `${Math.floor(stats.nextRewardIn / 60000)} minutes`
            : 'N/A',
          inline: true,
        },
      ])
      .setColor(ADMIN_COLOR)
      .setFooter({ text: 'Voice rewards: 2 points every 10 minutes' });

    await message.reply({ embeds: [embed] });

    Logger.info(
      `Admin ${message.author.id} checked voice stats for ${targetUserId}`,
    );
  } catch (error) {
    Logger.error('Error getting voice stats', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred while fetching voice stats.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}
