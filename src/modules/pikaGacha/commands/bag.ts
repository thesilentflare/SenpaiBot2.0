import { Message, EmbedBuilder } from 'discord.js';
import itemService from '../services/ItemService';
import Logger from '../../../utils/logger';
import { BALL_TYPES, SPECIAL_POKEMON } from '../types';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

export async function handleBag(
  message: Message,
  args: string[],
): Promise<void> {
  // Check if viewing another user's bag
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
    const bag = await itemService.getBag(userId);

    if (bag.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📦 Empty Bag')
        .setDescription(`${username} has no items in their bag!`)
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Build bag display
    let description = '';
    let totalItems = 0;

    for (const item of bag) {
      const ballType = BALL_TYPES[item.itemType];
      const ballName = ballType
        ? ballType.displayName
        : `Ball ${item.itemType}`;
      description += `${ballName}: ${item.quantity}\n`;
      totalItems += item.quantity;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s Bag`)
      .setDescription(description)
      .setFooter({ text: `Total Items: ${totalItems}` })
      .setColor(0x9370db);

    if (message.channel.isSendable()) {
      await message.channel.send({ embeds: [embed] });
    }

    Logger.info(`Displayed bag for ${username} (${userId})`);
  } catch (error) {
    Logger.error('Error handling bag command', error);
    await message.reply(
      'An error occurred while fetching the bag. Please try again.',
    );
  }
}

export async function handleOpenBall(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  // Check for ball type argument
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg open <ball_type>`\n\n' +
          'Ball types: pokeball, greatball, ultraball, masterball',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  const ballArg = args[0].toLowerCase();
  let ballType: number;

  // Map ball names to types
  if (ballArg === 'pokeball' || ballArg === 'poke') {
    ballType = 1;
  } else if (ballArg === 'greatball' || ballArg === 'great') {
    ballType = 2;
  } else if (ballArg === 'ultraball' || ballArg === 'ultra') {
    ballType = 3;
  } else if (ballArg === 'masterball' || ballArg === 'master') {
    ballType = 4;
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Ball Type')
      .setDescription(
        'Invalid ball type! Use: pokeball, greatball, ultraball, or masterball',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const result = await itemService.openBall(userId, ballType);

    const ballTypeData = BALL_TYPES[ballType];
    const ballName = ballTypeData
      ? ballTypeData.displayName
      : `Ball ${ballType}`;

    if (result.type === 'points') {
      const embed = new EmbedBuilder()
        .setTitle(`✨ ${username} opened a ${ballName}!`)
        .setDescription(`Received **${result.value} pikapoints**!`)
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
    } else {
      // Pokemon result
      const pokemon = result.value as {
        id: number;
        name: string;
        rarity: number;
      };
      let rarityText: string;
      if (pokemon.rarity <= 5) {
        rarityText = `${pokemon.rarity}⭐`;
      } else if (pokemon.rarity === 6) {
        rarityText = 'Legendary';
      } else if (pokemon.rarity === 7) {
        rarityText = 'Mythic';
      } else {
        rarityText = 'Special';
      }

      const embed = new EmbedBuilder()
        .setTitle(`${username} opened a ${ballName}!`)
        .setDescription(`${pokemon.name}\nRarity: ${rarityText}`)
        .setColor(0x9370db);

      // Set thumbnail
      if (pokemon.id >= 10000) {
        const url = SPECIAL_POKEMON[pokemon.id];
        if (url) {
          embed.setThumbnail(url);
        }
      } else {
        const strId = pokemon.id.toString().padStart(3, '0');
        embed.setThumbnail(
          `https://www.serebii.net/sunmoon/pokemon/${strId}.png`,
        );
      }

      await message.reply({ embeds: [embed] });
    }

    Logger.info(
      `${username} (${userId}) opened ${ballName}: ${result.type === 'points' ? `${result.value} points` : (result.value as { name: string }).name}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(error.message)
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
    } else {
      Logger.error('Error handling open command', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(
          'An error occurred while opening the ball. Please try again.',
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
    }
  }
}
