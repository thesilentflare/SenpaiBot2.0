import { Message, EmbedBuilder } from 'discord.js';
import pokemonService from '../services/PokemonService';
import inventoryService from '../services/InventoryService';
import Logger from '../../../utils/logger';
import { getRegionByPokemonId, SPECIAL_POKEMON } from '../types';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

export async function handlePokedex(
  message: Message,
  args: string[],
): Promise<void> {
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg pokedex <pokemon_name_or_id>`\n\nLook up information about a Pokémon.',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  const nameOrId = args.join(' ');

  try {
    // Try to get pokemon by name or ID
    const pokemon = await pokemonService.getPokemon(nameOrId);

    if (!pokemon) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Pokémon Not Found')
        .setDescription("Pokémon name or ID doesn't exist!")
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Get region
    const region = getRegionByPokemonId(pokemon.id);
    const regionName = region ? region.name : 'Unknown';

    // Build embed
    const title = `ID: ${pokemon.id}\nName: ${pokemon.name}\nBST: ${pokemon.bst}\nRegion: ${regionName}`;
    const embed = new EmbedBuilder().setTitle(title).setColor(0xffb6c1);

    // Set image
    if (pokemon.id >= 10000) {
      const url = SPECIAL_POKEMON[pokemon.id];
      if (url) {
        embed.setImage(url);
      }
    } else {
      const strId = pokemon.id.toString().padStart(3, '0');
      embed.setImage(`https://www.serebii.net/sunmoon/pokemon/${strId}.png`);
    }

    await message.reply({ embeds: [embed] });

    Logger.info(`Pokedex lookup for ${pokemon.name} (${pokemon.id})`);
  } catch (error) {
    Logger.error('Error handling pokedex command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while looking up the Pokémon. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleInventory(
  message: Message,
  args: string[],
): Promise<void> {
  // Check if viewing another user's inventory
  let userId = message.author.id;
  let username = message.author.username;

  if (args.length > 0) {
    // Try to extract user ID from mention or direct ID
    const mention = args[0].match(/^<@!?(\d+)>$/);
    if (mention) {
      userId = mention[1];
    } else if (/^\d+$/.test(args[0])) {
      userId = args[0];
    }

    try {
      const user = await message.client.users.fetch(userId);
      username = user.username;
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('❌ User Not Found')
        .setDescription('Could not find that user.')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }
  }

  try {
    const inventory = await inventoryService.getInventoryWithCounts(userId);

    if (inventory.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📦 Empty Collection')
        .setDescription(`${username} has no Pokémon in their collection!`)
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Group by rarity
    const byRarity: {
      [rarity: number]: Array<{ name: string; count: number; id: number }>;
    } = {};

    for (const item of inventory) {
      const rarity = item.pokemon.rarity;
      if (!byRarity[rarity]) {
        byRarity[rarity] = [];
      }
      byRarity[rarity].push({
        name: item.pokemon.name,
        count: item.count,
        id: item.pokemon.id,
      });
    }

    // Build description
    let description = '';
    const rarityOrder = [8, 7, 6, 5, 4, 3, 2, 1]; // Descending order

    for (const rarity of rarityOrder) {
      if (byRarity[rarity]) {
        let rarityLabel: string;
        if (rarity <= 5) {
          rarityLabel = `${rarity}⭐`;
        } else if (rarity === 6) {
          rarityLabel = 'Legendary';
        } else if (rarity === 7) {
          rarityLabel = 'Mythic';
        } else {
          rarityLabel = 'Special';
        }

        description += `**${rarityLabel}**\n`;
        for (const poke of byRarity[rarity]) {
          description += `${poke.name} x${poke.count}\n`;
        }
        description += '\n';
      }
    }

    // Calculate totals
    const totalPokemon = inventory.reduce((sum, item) => sum + item.count, 0);
    const uniquePokemon = inventory.length;

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s Collection`)
      .setDescription(description.trim())
      .setFooter({ text: `Total: ${totalPokemon} | Unique: ${uniquePokemon}` })
      .setColor(0x9370db);

    await message.reply({ embeds: [embed] });

    Logger.info(`Displayed inventory for ${username} (${userId})`);
  } catch (error) {
    Logger.error('Error handling inventory command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while fetching the collection. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
