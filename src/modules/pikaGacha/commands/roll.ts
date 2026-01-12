import { Message, EmbedBuilder } from 'discord.js';
import gachaService from '../services/GachaService';
import userService from '../services/UserService';
import Logger from '../../../utils/logger';
import { REGIONS, SPECIAL_POKEMON, getRegionByName } from '../types';

const ROLL_COST = 30;
const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

export async function handleRoll(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  // Parse region argument
  let regionId: number | null = null;
  if (args.length > 0) {
    const regionName = args[0];
    const region = getRegionByName(regionName);

    if (region) {
      regionId = region.id;
    } else {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Region')
        .setDescription(
          "Region must be one of: 'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', or omit for all regions",
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }
  }

  try {
    // Check if user has enough points
    const balance = await userService.getPikapoints(userId);
    if (balance < ROLL_COST) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Insufficient Points')
        .setDescription(
          `You need ${ROLL_COST} pikapoints to roll! You only have ${balance}. Join voice and start earning!`,
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Perform the roll
    const result = await gachaService.roll(userId, regionId);

    // Build embed
    const title = `${username} Summoned:`;
    let rarityText: string;
    if (result.pokemon.rarity <= 5) {
      rarityText = `${result.pokemon.rarity}⭐`;
    } else if (result.pokemon.rarity === 6) {
      rarityText = 'Legendary';
    } else if (result.pokemon.rarity === 7) {
      rarityText = 'Mythic';
    } else {
      rarityText = 'Special';
    }

    const description = `${result.pokemon.name}\nRarity: ${rarityText}`;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x9370db);

    // Set thumbnail
    if (result.pokemon.id >= 10000) {
      const url = SPECIAL_POKEMON[result.pokemon.id];
      if (url) {
        embed.setThumbnail(url);
      }
    } else {
      const strId = result.pokemon.id.toString().padStart(3, '0');
      embed.setThumbnail(
        `https://www.serebii.net/sunmoon/pokemon/${strId}.png`,
      );
    }

    // Get new balance
    const newBalance = await userService.getPikapoints(userId);

    // Send result
    await message.reply({
      content: `You now have ${newBalance} pikapoints.`,
      embeds: [embed],
    });

    // TODO: Handle promotion and jackpot notifications

    Logger.info(
      `${username} (${userId}) rolled ${result.pokemon.name} (${rarityText})`,
    );
  } catch (error) {
    Logger.error('Error handling roll command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while processing your roll. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleFullRoll(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  // Parse region and count
  let regionId: number | null = null;
  let count = 10; // Default to 10

  if (args.length > 0) {
    // First arg could be region or count
    const firstArg = args[0];
    const region = getRegionByName(firstArg);

    if (region) {
      regionId = region.id;
      // Second arg could be count
      if (args.length > 1) {
        const parsedCount = parseInt(args[1]);
        if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 100) {
          count = parsedCount;
        }
      }
    } else {
      // First arg is count
      const parsedCount = parseInt(firstArg);
      if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 100) {
        count = parsedCount;
      }
    }
  }

  try {
    // Check if user has enough points
    const balance = await userService.getPikapoints(userId);
    const totalCost = ROLL_COST * count;

    if (balance < totalCost) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Insufficient Points')
        .setDescription(
          `You need ${totalCost} pikapoints to roll ${count} times! You only have ${balance}.`,
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Perform multi-roll
    const results = await gachaService.multiRoll(userId, count, regionId);

    // Build summary
    const rarityGroups: { [key: string]: string[] } = {
      '1⭐': [],
      '2⭐': [],
      '3⭐': [],
      '4⭐': [],
      '5⭐': [],
      Legendary: [],
      Mythic: [],
      Special: [],
    };

    for (const result of results.results) {
      let rarityKey: string;
      if (result.pokemon.rarity <= 5) {
        rarityKey = `${result.pokemon.rarity}⭐`;
      } else if (result.pokemon.rarity === 6) {
        rarityKey = 'Legendary';
      } else if (result.pokemon.rarity === 7) {
        rarityKey = 'Mythic';
      } else {
        rarityKey = 'Special';
      }
      rarityGroups[rarityKey].push(result.pokemon.name);
    }

    // Build description
    let description = '';
    for (const [rarity, pokemon] of Object.entries(rarityGroups)) {
      if (pokemon.length > 0) {
        description += `**${rarity}**: ${pokemon.join(', ')}\n`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`${username} rolled ${count} times!`)
      .setDescription(description || 'No pokemon rolled')
      .setColor(0x9370db);

    await message.reply({
      content: `You now have ${results.newBalance} pikapoints.`,
      embeds: [embed],
    });

    // TODO: Handle promotion and jackpot notifications

    Logger.info(`${username} (${userId}) rolled ${count} times`);
  } catch (error) {
    Logger.error('Error handling fullroll command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while processing your rolls. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
