import { Message, EmbedBuilder } from 'discord.js';
import tradeService from '../services/TradeService';
import pokemonService from '../services/PokemonService';
import userService from '../services/UserService';
import Logger from '../../../utils/logger';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;
const COLOR_SUCCESS = 0x00ff00;

export async function handleTrade(
  message: Message,
  args: string[],
): Promise<void> {
  if (args.length < 3) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg trade <your_pokemon> <their_pokemon> <their_id>`\n\nTrade Pokémon with another user.',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  const user1Id = message.author.id;
  const user1 = message.author;

  // Last arg is user ID
  const user2Arg = args[args.length - 1];
  const pokemon2Name = args[args.length - 2];
  const pokemon1Name = args.slice(0, -2).join(' ');

  // Parse user 2 ID
  let user2Id: string;
  const mention = user2Arg.match(/^<@!?(\d+)>$/);
  if (mention) {
    user2Id = mention[1];
  } else if (/^\d+$/.test(user2Arg)) {
    user2Id = user2Arg;
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid User ID')
      .setDescription('Invalid user ID! Use a mention or numeric ID.')
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    const user2 = await message.client.users.fetch(user2Id);

    // Get pokemon
    const pokemon1 = await pokemonService.getPokemon(pokemon1Name);
    const pokemon2 = await pokemonService.getPokemon(pokemon2Name);

    if (!pokemon1) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Pokémon Not Found')
        .setDescription('Your Pokémon name is invalid!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (!pokemon2) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Pokémon Not Found')
        .setDescription('Their Pokémon name is invalid!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (pokemon1.id === pokemon2.id) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Trade')
        .setDescription('Pokémon must be different!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Validate trade
    const validation = await tradeService.validateTrade(
      user1Id,
      user2Id,
      pokemon1.id,
      pokemon2.id,
    );

    if (!validation.valid) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Trade Validation Failed')
        .setDescription(validation.error || 'Trade validation failed!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    const cost = validation.cost || 0;
    const balance1 = await userService.getPikapoints(user1Id);
    const balance2 = await userService.getPikapoints(user2Id);

    // Create trade request embed
    const title = 'Trade Request';
    const description =
      `${user1.username} wants to trade: **${pokemon1.name}**\n` +
      `For ${user2.username}'s: **${pokemon2.name}**\n\n` +
      `Cost: ${cost} pikapoints each\n` +
      `${user1.username}: ${balance1} pikapoints\n` +
      `${user2.username}: ${balance2} pikapoints`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff0000);

    const msg = await message.reply({ embeds: [embed] });
    await msg.react('✅');
    await msg.react('❌');

    // Wait for reaction
    const filter = (reaction: any, user: any) => {
      return (
        (user.id === user2Id && reaction.emoji.name === '✅') ||
        ((user.id === user1Id || user.id === user2Id) &&
          reaction.emoji.name === '❌')
      );
    };

    try {
      const collected = await msg.awaitReactions({
        filter,
        max: 1,
        time: 30000,
        errors: ['time'],
      });

      const reaction = collected.first();
      if (reaction?.emoji.name === '❌') {
        if (message.channel.isSendable()) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Trade Declined')
            .setDescription('Trade declined...')
            .setColor(COLOR_ERROR);
          await message.channel.send({ embeds: [embed] });
        }
        return;
      }

      // Execute trade
      const result = await tradeService.trade(
        user1Id,
        user2Id,
        pokemon1.id,
        pokemon2.id,
      );

      if (message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('✅ Trade Successful')
          .setDescription(
            `${user1.username} had ${balance1} pikapoints. ${user2.username} had ${balance2} pikapoints.\n` +
              `Performing trade...\n\n` +
              `Trade successful! ${user1.username} now has ${result.user1NewBalance} pikapoints. ` +
              `${user2.username} now has ${result.user2NewBalance} pikapoints.`,
          )
          .setColor(COLOR_SUCCESS);
        await message.channel.send({ embeds: [embed] });
      }

      Logger.info(
        `Trade completed: ${user1.username} (${user1Id}) traded ${pokemon1.name} for ` +
          `${user2.username} (${user2Id})'s ${pokemon2.name}`,
      );
    } catch (error) {
      if (message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('⏰ Trade Timeout')
          .setDescription('Trade timed out...')
          .setColor(COLOR_ERROR);
        await message.channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    Logger.error('Error handling trade command', error);
    const embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'An error occurred while processing the trade. Please try again.',
      )
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
  }
}
