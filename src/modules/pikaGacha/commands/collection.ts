import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import pokemonService from '../services/PokemonService';
import inventoryService from '../services/InventoryService';
import Logger from '../../../utils/logger';
import { getRegionByPokemonId, SPECIAL_POKEMON } from '../types';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;
const ITEMS_PER_PAGE = 20; // Pokemon per page
const INTERACTION_TIMEOUT = 120000; // 2 minutes

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
      // Use PokeAPI sprites for all Pokemon (supports all generations)
      embed.setImage(
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
      );
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

    // Group by rarity and sort
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

    // Sort each rarity group by ID
    for (const rarity in byRarity) {
      byRarity[rarity].sort((a, b) => a.id - b.id);
    }

    // Flatten into a single list with rarity headers
    const flatList: Array<{ type: 'header' | 'pokemon'; text: string }> = [];
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

        flatList.push({ type: 'header', text: `**${rarityLabel}**` });
        for (const poke of byRarity[rarity]) {
          flatList.push({
            type: 'pokemon',
            text: `${poke.name} x${poke.count}`,
          });
        }
      }
    }

    // Calculate totals
    const totalPokemon = inventory.reduce((sum, item) => sum + item.count, 0);
    const uniquePokemon = inventory.length;

    // Paginate the flat list
    const totalPages = Math.ceil(flatList.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const generatePageDescription = (page: number): string => {
      const start = page * ITEMS_PER_PAGE;
      const end = Math.min(start + ITEMS_PER_PAGE, flatList.length);
      const pageItems = flatList.slice(start, end);

      return pageItems.map((item) => item.text).join('\n');
    };

    const generateEmbed = (page: number): EmbedBuilder => {
      const description = generatePageDescription(page);
      return new EmbedBuilder()
        .setTitle(`${username}'s Collection`)
        .setDescription(description)
        .setFooter({
          text: `Page ${page + 1}/${totalPages} | Total: ${totalPokemon} | Unique: ${uniquePokemon}`,
        })
        .setColor(0x9370db);
    };

    // Create navigation buttons if more than one page
    if (totalPages > 1) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('inv_prev')
          .setLabel('◀ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('inv_next')
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1),
      );

      const reply = await message.reply({
        embeds: [generateEmbed(currentPage)],
        components: [row],
      });

      // Create button collector
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: INTERACTION_TIMEOUT,
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          await interaction.reply({
            content: 'Only the command user can navigate this inventory!',
            ephemeral: true,
          });
          return;
        }

        // Defer the update to prevent timeout
        await interaction.deferUpdate();

        // Update page based on button
        if (interaction.customId === 'inv_prev') {
          currentPage = Math.max(0, currentPage - 1);
        } else if (interaction.customId === 'inv_next') {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        }

        // Update buttons
        const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('inv_prev')
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId('inv_next')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1),
        );

        await interaction.editReply({
          embeds: [generateEmbed(currentPage)],
          components: [updatedRow],
        });
      });

      collector.on('end', async () => {
        // Disable buttons when collector expires
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('inv_prev')
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('inv_next')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        );

        await reply.edit({ components: [disabledRow] }).catch(() => {});
      });
    } else {
      // Single page, no buttons needed
      await message.reply({ embeds: [generateEmbed(0)] });
    }

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
