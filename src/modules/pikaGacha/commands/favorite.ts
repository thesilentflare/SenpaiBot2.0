import { Message, EmbedBuilder } from 'discord.js';
import inventoryService from '../services/InventoryService';
import pokemonService from '../services/PokemonService';
import Logger from '../../../utils/logger';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

export async function handleFavorite(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg favorite <pokemon_name>`\n\n' +
          'Toggle a Pokémon as a favorite. Favorites cannot be accidentally released.',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  const pokemonName = args.join(' ');

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

    // Toggle favorite
    const isFavorite = await inventoryService.toggleFavorite(
      userId,
      pokemon.id,
    );

    // Check if max favorites reached
    if (isFavorite === null) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Max Favorites Reached')
        .setDescription(
          'You have reached the maximum number of favorites! Remove a favorite first.',
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    const action = isFavorite ? 'added to' : 'removed from';
    const emoji = isFavorite ? '⭐' : '🚫';
    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Favorite ${isFavorite ? 'Added' : 'Removed'}`)
      .setDescription(`${pokemon.name} has been ${action} your favorites!`)
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });

    Logger.info(
      `${message.author.username} (${userId}) ${action} favorites: ${pokemon.name}`,
    );
  } catch (error) {
    Logger.error('Error handling favorite command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while updating favorites. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}

export async function handleFavorites(
  message: Message,
  args: string[],
): Promise<void> {
  // Check if viewing another user's favorites
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
    const favorites = await inventoryService.getFavorites(userId);

    if (favorites.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('⭐ No Favorites')
        .setDescription(`${username} has no favorite Pokémon!`)
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Build description
    let description = '';
    for (const fav of favorites) {
      description += `${fav.name} (ID: ${fav.pokemonId})\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s Favorite Pokémon`)
      .setDescription(description.trim())
      .setColor(0xffd700) // Gold color for favorites
      .setFooter({ text: `Total Favorites: ${favorites.length}` });

    await message.reply({ embeds: [embed] });

    Logger.info(`Displayed favorites for ${username} (${userId})`);
  } catch (error) {
    Logger.error('Error handling favorites command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while fetching favorites. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
