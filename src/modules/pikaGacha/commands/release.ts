import { Message, EmbedBuilder } from 'discord.js';
import inventoryService from '../services/InventoryService';
import userService from '../services/UserService';
import trainerService from '../services/TrainerService';
import pokemonService from '../services/PokemonService';
import Logger from '../../../utils/logger';
import {
  RELEASE_VALUES,
  getRegionByName,
  getRegionById,
  Region,
} from '../types';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

export async function handleRelease(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg release <pokemon_name> [option]`\n\n' +
          'Options: `all` (release all copies), `dupes` (release duplicates)',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  const option = args[args.length - 1];
  let pokemonName: string;
  let releaseOption: 'one' | 'all' | 'dupes' = 'one';

  if (option === 'all' || option === 'dupes') {
    releaseOption = option;
    pokemonName = args.slice(0, -1).join(' ');
  } else {
    pokemonName = args.join(' ');
  }

  try {
    // Get pokemon
    const pokemon = await pokemonService.getPokemon(pokemonName);
    if (!pokemon) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Pokémon Not Found')
        .setDescription('Pokémon not found!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check if user has it
    const hasPokemon = await inventoryService.hasPokemon(userId, pokemon.id);
    if (!hasPokemon) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Not in Collection')
        .setDescription('You do not have that Pokémon!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    let count: number;
    if (releaseOption === 'one') {
      const removed = await inventoryService.removePokemon(userId, pokemon.id);
      count = removed ? 1 : 0;
    } else if (releaseOption === 'all') {
      count = await inventoryService.releaseAllOfPokemon(userId, pokemon.id);
    } else {
      count = await inventoryService.releaseDupesOfPokemon(userId, pokemon.id);
    }

    // Calculate gain
    const gain = (RELEASE_VALUES[pokemon.rarity] || 0) * count;
    await userService.adjustPoints(userId, gain);

    // Update stats
    for (let i = 0; i < count; i++) {
      await trainerService.incrementStat(userId, 'releases');
    }

    const balance = await userService.getPikapoints(userId);
    const quantityText =
      count === 1 ? pokemon.name : `${count} ${pokemon.name}`;

    const embed = new EmbedBuilder()
      .setTitle('✅ Release Successful')
      .setDescription(
        `Successfully released ${quantityText}. You got ${gain} pikapoints!\n` +
          `You now have ${balance} pikapoints.`,
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });

    Logger.info(
      `${message.author.username} (${userId}) released ${count}× ${pokemon.name}`,
    );
  } catch (error) {
    Logger.error('Error handling release command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while releasing Pokémon. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleReleaseDupes(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:**\n```!releasedupes <rarity> [region]```\n' +
          'Rarity: `3`, `4`, `five`, or `all`\n' +
          'Region: `kanto`, `johto`, `hoenn`, `sinnoh`, `unova`, `kalos`, `alola`\n\n' +
          'Use !gachahelp to view the help menu for more information on all PikaGacha commands',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  let rarityArg = args[0];
  const regionArg = args.length > 1 ? args[1] : null;

  // Handle special "all" case
  if (rarityArg === 'all') {
    const rarities = ['3', '4', 'five'];
    for (const r of rarities) {
      // Recursively call with each rarity
      const newArgs = regionArg ? [r, regionArg] : [r];
      await handleReleaseDupes(message, newArgs);
    }
    return;
  }

  // Convert "five" to "5"
  if (rarityArg === 'five') {
    rarityArg = '5';
  } else if (rarityArg === '5') {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription('**Usage:** `!pg releasedupes five [region]`')
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Validate rarity
  const rarity = parseInt(rarityArg);
  if (![3, 4, 5].includes(rarity)) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Rarity')
      .setDescription(
        'You can only release duplicates of 3⭐, 4⭐, and 5⭐ rarity Pokémon!',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
    return;
  }

  // Parse region
  let regionId: number | null = null;
  let regionName = 'all regions';
  if (regionArg) {
    const region = getRegionByName(regionArg);
    if (region) {
      regionId = region.id;
      regionName = `the ${region.name} region`;
    } else {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Region')
        .setDescription(
          "Region must be one of: 'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola'",
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }
  }

  try {
    const balance = await userService.getPikapoints(userId);

    // Parse region to Region object
    let region: Region | null = null;
    if (regionId) {
      region = getRegionById(regionId) || null;
    }

    // Release duplicates
    const count = await inventoryService.releaseDuplicates(
      userId,
      rarity,
      region,
    );

    if (count === 0) {
      const embed = new EmbedBuilder()
        .setTitle('🚫 No Pokémon to Release')
        .setDescription(`There are no ${rarity}⭐ pokémon to release...`)
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Calculate gain
    const gain = (RELEASE_VALUES[rarity] || 0) * count;
    await userService.adjustPoints(userId, gain);

    // Update stats
    for (let i = 0; i < count; i++) {
      await trainerService.incrementStat(userId, 'releases');
    }

    const newBalance = await userService.getPikapoints(userId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Release Successful')
      .setDescription(
        `You currently have ${balance} pikapoints.\n` +
          `Releasing ${count} ${rarity}⭐ Pokémon from ${regionName}...\n` +
          `You got ${gain} pikapoints!\n` +
          `You now have ${newBalance} pikapoints.`,
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });

    Logger.info(
      `${message.author.username} (${userId}) released ${count}× ${rarity}⭐ duplicates from ${regionName}`,
    );
  } catch (error) {
    Logger.error('Error handling releasedupes command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while releasing duplicates. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
