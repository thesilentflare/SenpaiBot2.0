import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import pokemonService from '../services/PokemonService';
import { Pokemon, Trainer } from '../models';
import { Op } from 'sequelize';
import { isAdmin } from '../../adminManager/helpers';
import Logger from '../../../utils/logger';
import userService from '../services/UserService';
import itemService from '../services/ItemService';
import { QuizService } from '../services/QuizService';
import { VoiceRewardService } from '../services/VoiceRewardService';
import * as fs from 'fs';
import * as path from 'path';
import {
  getLatestSeedFile,
  saveUploadedSeedFile,
  listUploadedSeedFiles,
} from '../utils/seedManager';
import axios from 'axios';
import { getBallType, getRegionByName } from '../types';
import { AttachmentBuilder } from 'discord.js';

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
  _args: string[],
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
  _args: string[],
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

export async function handleDownloadSeed(
  message: Message,
  _args: string[],
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
    const processingEmbed = new EmbedBuilder()
      .setTitle('📥 Preparing CSV Download...')
      .setDescription('Please wait...')
      .setColor(ADMIN_COLOR);
    const statusMessage = await message.reply({ embeds: [processingEmbed] });

    // Get the latest seed file (uploaded or default)
    const seedFilePath = getLatestSeedFile();
    const filename = path.basename(seedFilePath);

    // Check if file exists
    if (!fs.existsSync(seedFilePath)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ File Not Found')
        .setDescription('The seed file could not be found.')
        .setColor(0xff0000);
      await statusMessage.edit({ embeds: [embed] });
      return;
    }

    // Read the file
    const fileBuffer = await fs.promises.readFile(seedFilePath);
    const fileStats = await fs.promises.stat(seedFilePath);
    const sizeKB = (fileStats.size / 1024).toFixed(2);

    // Count lines for entry count
    const csvContent = fileBuffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());
    const entryCount = lines.length - 1; // Subtract header row

    // Determine if this is default or uploaded
    const isDefault = seedFilePath.includes('scripts/pokedata.csv');
    const fileType = isDefault ? 'Default' : 'Uploaded';

    // Create attachment
    const attachment = new AttachmentBuilder(fileBuffer, {
      name: filename,
    });

    const successEmbed = new EmbedBuilder()
      .setTitle('📥 Seed CSV Ready!')
      .addFields([
        { name: 'File', value: filename, inline: false },
        { name: 'Type', value: fileType, inline: true },
        { name: 'Size', value: `${sizeKB} KB`, inline: true },
        { name: 'Entries', value: `${entryCount}`, inline: true },
      ])
      .setDescription(
        'The CSV file is attached. You can edit it and re-upload using `!pg uploadseed`.',
      )
      .setColor(ADMIN_COLOR);

    await statusMessage.edit({ embeds: [successEmbed], files: [attachment] });
    Logger.info(`Admin ${message.author.tag} downloaded seed CSV: ${filename}`);
  } catch (error) {
    Logger.error('Error downloading seed CSV', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Download Error')
      .setDescription(
        'Failed to download the CSV file. Check logs for details.',
      )
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
  if (!(await isAdmin(message.author.id, message.guild))) {
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
  if (!(await isAdmin(message.author.id, message.guild))) {
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

export async function handleDeleteTrainer(
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

  if (args.length < 1) {
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Delete Trainer Usage')
      .setDescription(
        '**Usage:** `!pg deletetrainer <@user|user_id>`\n\n' +
          '**Example:**\n' +
          "• `!pg deletetrainer @User` - Delete User's trainer profile\n" +
          '• `!pg deletetrainer 123456789012345678` - Delete trainer by ID\n\n' +
          '⚠️ **WARNING:** This will permanently delete:\n' +
          '• Trainer profile\n' +
          '• All Pokémon in inventory\n' +
          '• All items (Poké Balls, etc.)\n' +
          '• Favorites\n' +
          '• Jackpot entries\n' +
          '• User pikapoints and savings\n\n' +
          '**This action cannot be undone!**',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Parse user mention or ID
  const userMention = args[0];
  const userId = userMention.replace(/[<@!>]/g, '');

  try {
    // Check if trainer exists
    const trainer = await Trainer.findOne({ where: { userId } });

    if (!trainer) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Trainer Not Found')
        .setDescription('No trainer found with that ID!')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Try to get Discord user for display name
    let displayName = userId;
    try {
      const discordUser = await message.client.users.fetch(userId);
      displayName = discordUser.username;
    } catch {
      // Use trainer name as fallback
      displayName = trainer.name || userId;
    }

    // Get stats before deletion
    const { Inventory, Item, Favorite, Jackpot, User } =
      await import('../models');
    const inventoryCount = await Inventory.count({ where: { userId } });
    const itemsCount = await Item.count({ where: { userId } });
    const favoritesCount = await Favorite.count({ where: { userId } });
    const jackpotCount = await Jackpot.count({ where: { userId } });
    const user = await User.findOne({ where: { id: userId } });

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Trainer Deletion')
      .setDescription(
        `**Are you sure you want to delete ${displayName}'s trainer profile?**\n\n` +
          '**This will permanently delete:**',
      )
      .addFields([
        { name: 'Trainer Name', value: trainer.name || 'N/A', inline: true },
        { name: 'Team', value: trainer.team || 'None', inline: true },
        { name: 'Rank', value: trainer.rank || 'Recruit', inline: true },
        {
          name: 'Pokémon in Inventory',
          value: inventoryCount.toString(),
          inline: true,
        },
        { name: 'Items (Balls)', value: itemsCount.toString(), inline: true },
        { name: 'Favorites', value: favoritesCount.toString(), inline: true },
        {
          name: 'Jackpot Entries',
          value: jackpotCount.toString(),
          inline: true,
        },
        {
          name: 'Pikapoints',
          value: user ? `${user.points.toLocaleString()}` : '0',
          inline: true,
        },
        {
          name: 'Savings',
          value: user ? `${user.savings.toLocaleString()}` : '0',
          inline: true,
        },
      ])
      .setFooter({ text: '⚠️ This action cannot be undone!' })
      .setColor(0xff0000);

    // Create confirmation buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('delete_confirm')
        .setLabel('✅ Confirm Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('delete_cancel')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Secondary),
    );

    const reply = await message.reply({
      embeds: [confirmEmbed],
      components: [row],
    });

    // Create button collector
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000, // 30 seconds to confirm
    });

    collector.on('collect', async (interaction) => {
      // Only the admin who ran the command can confirm
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: 'Only the admin who ran this command can confirm!',
          ephemeral: true,
        });
        return;
      }

      if (interaction.customId === 'delete_confirm') {
        await interaction.deferUpdate();

        try {
          // Delete all related data
          await Inventory.destroy({ where: { userId } });
          await Item.destroy({ where: { userId } });
          await Favorite.destroy({ where: { userId } });
          await Jackpot.destroy({ where: { userId } });
          await Trainer.destroy({ where: { userId } });

          // Delete user from PikaGacha users table
          if (user) {
            await user.destroy();
          }

          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Trainer Deleted')
            .setDescription(
              `**${displayName}'s trainer profile has been permanently deleted.**\n\n` +
                '**Deleted:**\n' +
                `• Trainer profile\n` +
                `• ${inventoryCount} Pokémon\n` +
                `• ${itemsCount} items\n` +
                `• ${favoritesCount} favorites\n` +
                `• ${jackpotCount} jackpot entries\n` +
                `• User account and all pikapoints`,
            )
            .setColor(ADMIN_COLOR);

          await interaction.editReply({
            embeds: [successEmbed],
            components: [],
          });

          Logger.info(
            `Admin ${message.author.tag} deleted trainer ${displayName} (${userId})`,
          );
        } catch (error) {
          Logger.error('Error deleting trainer', error);
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('An error occurred while deleting the trainer.')
            .setColor(0xff0000);
          await interaction.editReply({
            embeds: [errorEmbed],
            components: [],
          });
        }
      } else if (interaction.customId === 'delete_cancel') {
        await interaction.deferUpdate();
        const cancelEmbed = new EmbedBuilder()
          .setTitle('❌ Deletion Cancelled')
          .setDescription('Trainer deletion was cancelled.')
          .setColor(ADMIN_COLOR);
        await interaction.editReply({
          embeds: [cancelEmbed],
          components: [],
        });
      }

      collector.stop();
    });

    collector.on('end', async (_collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⏱️ Confirmation Timeout')
          .setDescription('Deletion cancelled - confirmation timed out.')
          .setColor(ADMIN_COLOR);
        await reply.edit({
          embeds: [timeoutEmbed],
          components: [],
        });
      }
    });
  } catch (error) {
    Logger.error('Error in deletetrainer command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('An error occurred. Check logs for details.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

/**
 * Gift balls to a user
 * Usage: !pg giftballs <user> <ball_type> <amount>
 */
export async function handleGiftBalls(
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

  if (args.length < 3) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg giftballs <user> <ball_type> <amount>`\n\n' +
          '**Ball Types:**\n' +
          '- `pokeball` or `1` - Poké Ball\n' +
          '- `greatball` or `2` - Great Ball\n' +
          '- `ultraball` or `3` - Ultra Ball\n' +
          '- `masterball` or `4` - Master Ball\n\n' +
          '**Examples:**\n' +
          '`!pg giftballs @user pokeball 5`\n' +
          '`!pg giftballs @user 3 10` (10 Ultra Balls)',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    // Parse user
    let userId: string;
    const mention = args[0].match(/^<@!?(\d+)>$/);
    if (mention) {
      userId = mention[1];
    } else if (/^\d+$/.test(args[0])) {
      userId = args[0];
    } else {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid User')
        .setDescription('Please mention a user or provide a valid user ID.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Verify user exists
    try {
      await message.client.users.fetch(userId);
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('❌ User Not Found')
        .setDescription('Could not find that user.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check if user is registered
    const trainer = await Trainer.findOne({ where: { userId } });
    if (!trainer) {
      const embed = new EmbedBuilder()
        .setTitle('❌ User Not Registered')
        .setDescription('This user has not registered for PikaGacha yet.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Parse ball type
    const ballTypeArg = args[1].toLowerCase();
    let ballTypeId: number;

    // Check if it's a number (1-4)
    if (/^\d+$/.test(ballTypeArg)) {
      ballTypeId = parseInt(ballTypeArg);
      if (ballTypeId < 1 || ballTypeId > 4) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Invalid Ball Type')
          .setDescription('Ball type must be between 1 and 4.')
          .setColor(0xff0000);
        await message.reply({ embeds: [embed] });
        return;
      }
    } else {
      // Check if it's a ball name
      const ballTypeMapping: { [key: string]: number } = {
        pokeball: 1,
        'poke ball': 1,
        greatball: 2,
        'great ball': 2,
        ultraball: 3,
        'ultra ball': 3,
        masterball: 4,
        'master ball': 4,
      };

      ballTypeId = ballTypeMapping[ballTypeArg];
      if (!ballTypeId) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Invalid Ball Type')
          .setDescription(
            'Ball type must be: pokeball, greatball, ultraball, or masterball (or 1-4)',
          )
          .setColor(0xff0000);
        await message.reply({ embeds: [embed] });
        return;
      }
    }

    // Parse amount
    const amount = parseInt(args[2]);
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Amount')
        .setDescription('Amount must be a positive number.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (amount > 1000) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Amount Too Large')
        .setDescription('Maximum amount is 1000 balls per gift.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Get ball type info
    const ballType = getBallType(ballTypeId);
    if (!ballType) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Invalid ball type.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Gift the balls
    await itemService.addItem(userId, ballTypeId, amount);

    const user = await message.client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle('🎁 Balls Gifted!')
      .setDescription(
        `Successfully gifted **${amount}× ${ballType.displayName}** to **${user.username}** (${trainer.name})!`,
      )
      .setColor(ADMIN_COLOR);

    await message.reply({ embeds: [embed] });

    Logger.info(
      `Admin ${message.author.username} gifted ${amount}× ${ballType.displayName} to ${user.username} (${userId})`,
    );
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'Unknown error';
    Logger.error('Error in giftballs command:', errorMsg);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while gifting balls. Check logs for details.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }
}

/**
 * Auto-fetch and add a region's Pokemon from PokéAPI
 * Usage: !pg addregion <region> [--confirm]
 */
export async function handleAddRegion(
  message: Message,
  args: string[],
): Promise<void> {
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
      .setTitle('🌍 Add Region Usage')
      .setDescription(
        '**Usage:** `!pg addregion <region> [--confirm]`\n\n' +
          '**Examples:**\n' +
          '• `!pg addregion galar` — Preview without making changes\n' +
          '• `!pg addregion galar --confirm` — Fetch & add Galar Pokémon\n\n' +
          '**Available regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, paldea\n\n' +
          '**What this does:**\n' +
          '1. Fetches every Pokémon in the region\'s ID range from PokéAPI\n' +
          '2. Auto-assigns rarity (Mythical=7★, Legendary=6★, BST-based for 3–5★)\n' +
          '3. Appends new rows to the current seed CSV and saves it\n' +
          '4. Reseeds the database from the new file\n\n' +
          '⚠️ Auto-assigned rarities are a **best-effort first pass**. Review with\n' +
          '`!pg downloadseed` → edit → `!pg uploadseed` → `!pg reseed --confirm`',
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  const regionName = args[0].toLowerCase();
  const confirmFlag = args.includes('--confirm');

  // Reject "special" — those are custom/event Pokemon
  if (regionName === 'special') {
    const embed = new EmbedBuilder()
      .setTitle('❌ Special Region Not Supported')
      .setDescription(
        'The Special region contains custom/event Pokémon that cannot be auto-fetched from PokéAPI.\n\n' +
          'Use `!pg uploadseed` to manually add Special Pokémon via CSV.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Look up region
  const region = getRegionByName(regionName);
  if (!region || region.id === 0) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Unknown Region')
      .setDescription(
        `Region **${regionName}** not found.\n\n` +
          '**Available regions:** kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, paldea',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Check if region already has Pokemon in DB
  const existingCount = await Pokemon.count({
    where: { id: { [Op.between]: [region.min, region.max] } },
  });

  if (existingCount > 0) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Region Already Seeded')
      .setDescription(
        `**${region.name}** already has **${existingCount} Pokémon** in the database.\n\n` +
          'To update existing stats use `!pg reseed --confirm`.\n' +
          'To replace the region entirely: `!pg downloadseed` → edit → `!pg uploadseed` → `!pg reseed --confirm`.',
      )
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
    return;
  }

  const pokemonCount = region.max - region.min + 1;
  const estimatedSeconds = Math.ceil(
    (pokemonCount * 2 * 150 + Math.ceil(pokemonCount / 10) * 400) / 1000,
  );

  // ── Preview mode (no --confirm) ──────────────────────────────────────────
  if (!confirmFlag) {
    const embed = new EmbedBuilder()
      .setTitle(`🌍 Preview: Add Region — ${region.name}`)
      .addFields([
        {
          name: 'ID Range',
          value: `#${region.min} – #${region.max}`,
          inline: true,
        },
        {
          name: 'Pokémon to Fetch',
          value: `~${pokemonCount}`,
          inline: true,
        },
        {
          name: 'Estimated Time',
          value: `~${estimatedSeconds}s`,
          inline: true,
        },
        { name: 'Currently in DB', value: '0 (empty)', inline: true },
        {
          name: 'API Calls',
          value: `~${pokemonCount * 2} (pokemon + species per entry)`,
          inline: true,
        },
      ])
      .setDescription(
        '**Auto-Rarity Assignment Rules:**\n' +
          '• `is_mythical: true` → **7★ Mythic**\n' +
          '• `is_legendary: true` → **6★ Legendary**\n' +
          '• BST ≥ 540 → **5★**\n' +
          '• BST ≥ 420 → **4★**\n' +
          '• BST < 420 → **3★**\n\n' +
          '⚠️ These thresholds are a best-effort approximation. Manual review is recommended after adding.\n\n' +
          `**To proceed:** \`!pg addregion ${regionName} --confirm\``,
      )
      .setColor(ADMIN_COLOR);
    await message.reply({ embeds: [embed] });
    return;
  }

  // ── Fetch mode (--confirm) ────────────────────────────────────────────────
  const statusMessage = await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`🌍 Adding Region: ${region.name}`)
        .setDescription(
          `Fetching ${pokemonCount} Pokémon from PokéAPI in batches...\n\n🔄 Starting...`,
        )
        .setColor(ADMIN_COLOR),
    ],
  });

  interface FetchedPokemon {
    id: number;
    name: string;
    rarity: number;
    bst: number;
  }
  interface FetchError {
    id: number;
    error: string;
  }

  const fetched: FetchedPokemon[] = [];
  const fetchErrors: FetchError[] = [];
  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 400;

  /** Auto-assign rarity: mythical > legendary > BST tiers */
  const assignRarity = (
    bst: number,
    isLegendary: boolean,
    isMythical: boolean,
  ): number => {
    if (isMythical) return 7;
    if (isLegendary) return 6;
    if (bst >= 540) return 5;
    if (bst >= 420) return 4;
    return 3;
  };

  /** Title-case a name that may be hyphenated (e.g. "mr-mime" → "Mr-Mime") */
  const formatName = (raw: string): string =>
    raw
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');

  // Build full ID list for this region
  const ids = Array.from({ length: pokemonCount }, (_, i) => region.min + i);
  const totalBatches = Math.ceil(ids.length / BATCH_SIZE);

  for (let batchStart = 0; batchStart < ids.length; batchStart += BATCH_SIZE) {
    const batch = ids.slice(batchStart, batchStart + BATCH_SIZE);
    const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;

    // Update progress every 3 batches or on the last one
    if (batchNum === 1 || batchNum % 3 === 0 || batchNum === totalBatches) {
      await statusMessage
        .edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🌍 Adding Region: ${region.name}`)
              .setDescription(
                `Fetching from PokéAPI...\n\n` +
                  `🔄 Batch ${batchNum}/${totalBatches} ` +
                  `(${Math.min(batchStart + BATCH_SIZE, ids.length)}/${ids.length} processed)\n` +
                  `✅ Success: ${fetched.length} | ❌ Skipped: ${fetchErrors.length}`,
              )
              .setColor(ADMIN_COLOR),
          ],
        })
        .catch(() => {}); // Don't fail if edit rate-limited
    }

    // Fetch both endpoints in parallel for each Pokemon in the batch
    await Promise.all(
      batch.map(async (id) => {
        try {
          const [pokemonResp, speciesResp] = await Promise.all([
            axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`, {
              timeout: 12000,
            }),
            axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`, {
              timeout: 12000,
            }),
          ]);

          const pokemonData = pokemonResp.data;
          const speciesData = speciesResp.data;

          // Sum all base stats for BST
          const bst: number = pokemonData.stats.reduce(
            (sum: number, s: { base_stat: number }) => sum + s.base_stat,
            0,
          );

          if (!bst || bst <= 0) {
            fetchErrors.push({ id, error: 'Invalid BST (0 or missing)' });
            return;
          }

          // Prefer the official English name from species endpoint
          const englishEntry = (
            speciesData.names as { language: { name: string }; name: string }[]
          ).find((n) => n.language.name === 'en');
          const name: string = englishEntry
            ? englishEntry.name
            : formatName(pokemonData.name as string);

          if (!name || name.trim() === '') {
            fetchErrors.push({ id, error: 'Could not determine name' });
            return;
          }

          const rarity = assignRarity(
            bst,
            speciesData.is_legendary as boolean,
            speciesData.is_mythical as boolean,
          );

          fetched.push({ id, name, rarity, bst });
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            // Not a standard Pokemon at this ID (alternate form slot, gap, etc.)
            fetchErrors.push({
              id,
              error: '404 – not a base-form Pokémon (skipped)',
            });
          } else {
            const msg =
              err instanceof Error ? err.message : 'Unknown fetch error';
            fetchErrors.push({ id, error: msg });
          }
        }
      }),
    );

    // Polite delay between batches (skip after last batch)
    if (batchStart + BATCH_SIZE < ids.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // ── Validate results ──────────────────────────────────────────────────────

  if (fetched.length === 0) {
    await statusMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ No Pokémon Fetched')
          .setDescription(
            'No Pokémon data could be retrieved from PokéAPI. No changes were made.\n\n' +
              'Check your network connection and try again.',
          )
          .setColor(0xff0000),
      ],
    });
    return;
  }

  // Abort if failure rate is too high (>10%), unless every error is a 404 skip
  const hardErrors = fetchErrors.filter(
    (e) => !e.error.startsWith('404'),
  ).length;
  const errorRate = hardErrors / pokemonCount;
  if (errorRate > 0.1) {
    const errorLines = fetchErrors
      .slice(0, 25)
      .map((e) => `• #${e.id}: ${e.error}`)
      .join('\n');
    await statusMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Fetch Failed — Too Many Errors')
          .setDescription(
            `Aborted: **${hardErrors}** hard errors out of **${pokemonCount}** Pokémon ` +
              `(${Math.round(errorRate * 100)}% failure rate, threshold is 10%).\n\n` +
              `**Errors:**\n${errorLines}` +
              (fetchErrors.length > 25
                ? `\n• ...and ${fetchErrors.length - 25} more`
                : '') +
              '\n\nNo changes have been saved. Please try again or check your connection.',
          )
          .setColor(0xff0000),
      ],
    });
    return;
  }

  // ── Build and save the updated CSV ───────────────────────────────────────

  // Sort by ID ascending to keep CSV clean
  fetched.sort((a, b) => a.id - b.id);

  // Rarity breakdown for the summary
  const rarityBreakdown: Record<number, number> = {};
  for (const p of fetched) {
    rarityBreakdown[p.rarity] = (rarityBreakdown[p.rarity] || 0) + 1;
  }
  const rarityNames: Record<number, string> = {
    3: '3★',
    4: '4★',
    5: '5★',
    6: 'Legendary',
    7: 'Mythic',
  };
  const rarityStr = Object.entries(rarityBreakdown)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([r, count]) => `${rarityNames[parseInt(r)] ?? r + '★'}: ${count}`)
    .join(' | ');

  try {
    // Load existing CSV content
    const currentCsvPath = getLatestSeedFile();
    const existingContent = fs.readFileSync(currentCsvPath, 'utf-8').trim();

    // Build new CSV rows: id,name,rarity,focus,bst
    const newRows = fetched
      .map((p) => `${p.id},${p.name},${p.rarity},0,${p.bst}`)
      .join('\n');
    const updatedContent = `${existingContent}\n${newRows}\n`;

    // Save as a new timestamped seed file
    const buffer = Buffer.from(updatedContent, 'utf-8');
    const savedPath = await saveUploadedSeedFile(
      buffer,
      `pokedata_add_${regionName}.csv`,
    );
    const savedFilename = path.basename(savedPath);

    // Reseed only the new entries directly (avoids re-processing the full CSV)
    let inserted = 0;
    let alreadyExisted = 0;

    for (const data of fetched) {
      const regionId = getRegionId(data.id);
      const isSpecial = isSpecialPokemon(data.id);

      const [, created] = await Pokemon.findOrCreate({
        where: { id: data.id },
        defaults: {
          id: data.id,
          name: data.name,
          rarity: data.rarity,
          focus: false,
          bst: data.bst,
          regionId,
          isSpecial,
          active: false,
        },
      });

      if (created) {
        inserted++;
      } else {
        alreadyExisted++;
      }
    }

    // ── Success embed ─────────────────────────────────────────────────────
    const skippedLines =
      fetchErrors.length > 0
        ? '\n\n**Skipped IDs:**\n' +
          fetchErrors
            .slice(0, 15)
            .map((e) => `• #${e.id}: ${e.error}`)
            .join('\n') +
          (fetchErrors.length > 15
            ? `\n• ...and ${fetchErrors.length - 15} more`
            : '')
        : '';

    await statusMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle(`✅ Region Added: ${region.name}`)
          .addFields([
            {
              name: 'Added to DB',
              value: `**${inserted}**`,
              inline: true,
            },
            {
              name: 'Skipped (not found)',
              value: `**${fetchErrors.length}**`,
              inline: true,
            },
            {
              name: 'Rarity Breakdown',
              value: rarityStr || 'N/A',
              inline: false,
            },
            { name: 'Seed File', value: savedFilename, inline: false },
          ])
          .setDescription(
            `**${inserted}** Pokémon from **${region.name}** have been added to the database.` +
              skippedLines +
              '\n\n' +
              '⚠️ **Rarities are auto-assigned** — review and adjust if needed:\n' +
              '`!pg downloadseed` → edit CSV → `!pg uploadseed` → `!pg reseed --confirm`',
          )
          .setColor(ADMIN_COLOR),
      ],
    });

    Logger.info(
      `Admin ${message.author.tag} added region ${region.name}: ` +
        `${inserted} inserted, ${alreadyExisted} already existed, ${fetchErrors.length} skipped`,
    );
  } catch (error) {
    Logger.error('Error saving addregion data', error);
    await statusMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error Saving Data')
          .setDescription(
            `Pokémon data was fetched successfully (${fetched.length} entries), ` +
              'but an error occurred while saving to CSV or the database.\n\n' +
              'No partial data was committed. Please try again.',
          )
          .setColor(0xff0000),
      ],
    });
  }
}
