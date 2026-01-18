import { Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import battleService from '../services/BattleService';
import pokemonService from '../services/PokemonService';
import userService from '../services/UserService';
import inventoryService from '../services/InventoryService';
import { generateBattleImage } from '../utils/imageGenerator';
import Logger from '../../../utils/logger';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

export async function handleBattle(
  message: Message,
  args: string[],
): Promise<void> {
  if (args.length < 2) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg battle <their_id> <wager>`\n\n' +
          'Wager must be between 1 and 100 pikapoints',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  const user1Id = message.author.id;
  const user1 = message.author;

  const user2Arg = args[0];
  const wagerArg = args[1];

  // Parse wager
  const wager = parseInt(wagerArg);
  if (isNaN(wager) || wager < 1 || wager > 100) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Wager')
      .setDescription('Wager must be between 1 and 100 pikapoints!')
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
    return;
  }

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

    // Check if same user
    if (user1Id === user2Id) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Battle')
        .setDescription('You cannot battle yourself!')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check balances
    const balance1 = await userService.getPikapoints(user1Id);
    const balance2 = await userService.getPikapoints(user2Id);

    const MIN_POINTS = -100;
    if (balance1 < MIN_POINTS) {
      await message.reply(
        `You don't have enough pikapoints to battle!\nYou have ${balance1} pikapoints`,
      );
      return;
    }

    if (balance2 < MIN_POINTS) {
      await message.reply(
        `${user2.username} doesn't have enough pikapoints to battle!\n` +
          `${user2.username} has ${balance2} pikapoints`,
      );
      return;
    }

    // Send battle challenge
    const challengeEmbed = new EmbedBuilder()
      .setTitle('Battle Challenge')
      .setDescription(`${user2.username} is challenged by ${user1.username}!`)
      .setColor(0x000080);

    const challengeMsg = await message.reply({ embeds: [challengeEmbed] });
    await challengeMsg.react('✅');
    await challengeMsg.react('❌');

    // Wait for acceptance
    const challengeFilter = (reaction: any, user: any) => {
      return (
        (user.id === user2Id && reaction.emoji.name === '✅') ||
        ((user.id === user1Id || user.id === user2Id) &&
          reaction.emoji.name === '❌')
      );
    };

    try {
      const challengeCollected = await challengeMsg.awaitReactions({
        filter: challengeFilter,
        max: 1,
        time: 30000,
        errors: ['time'],
      });

      const challengeReaction = challengeCollected.first();
      if (challengeReaction?.emoji.name === '❌') {
        if (message.channel.isSendable()) {
          const embed = new EmbedBuilder()
            .setTitle('🚨 Battle Declined')
            .setDescription(`${user2.username} got away safely!`)
            .setColor(COLOR_ERROR);
          await message.channel.send({ embeds: [embed] });
        }
        return;
      }
    } catch (error) {
      if (message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('⏰ Challenge Timeout')
          .setDescription(`${user2.username} got away safely!`)
          .setColor(COLOR_ERROR);
        await message.channel.send({ embeds: [embed] });
      }
      return;
    }

    // User 1 chooses pokemon
    if (message.channel.isSendable()) {
      const embed = new EmbedBuilder()
        .setTitle('🎨 Pokémon Selection')
        .setDescription(`${user1.username}, Choose a Pokémon!`)
        .setColor(COLOR_GOLD);
      await message.channel.send({ embeds: [embed] });
    }
    const pokemon1Filter = (m: Message) => {
      return m.author.id === user1Id && m.channel.id === message.channel.id;
    };

    let pokemon1Name: string;
    let pokemon1Id: number;
    try {
      if (!message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Channel Error')
          .setDescription('This command can only be used in a text channel.')
          .setColor(COLOR_ERROR);
        await message.reply({ embeds: [embed] });
        return;
      }

      const collected1 = await message.channel.awaitMessages({
        filter: pokemon1Filter,
        max: 1,
        time: 30000,
        errors: ['time'],
      });

      const msg1 = collected1.first();
      if (!msg1) throw new Error('No message');

      const pokemon1 = await pokemonService.getPokemon(msg1.content);
      if (!pokemon1) {
        if (message.channel.isSendable()) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Pokémon')
            .setDescription('Invalid Pokémon name!')
            .setColor(COLOR_ERROR);
          await message.channel.send({ embeds: [embed] });
        }
        return;
      }

      // Validate user 1 has this pokemon
      const user1HasPokemon = await inventoryService.hasPokemon(
        user1Id,
        pokemon1.id,
      );
      if (!user1HasPokemon) {
        if (message.channel.isSendable()) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Validation Failed')
            .setDescription('You do not have that Pokémon!')
            .setColor(COLOR_ERROR);
          await message.channel.send({ embeds: [embed] });
        }
        return;
      }

      pokemon1Name = pokemon1.name;
      pokemon1Id = pokemon1.id;
    } catch (error) {
      if (message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('⏰ Selection Timeout')
          .setDescription(
            `${user1.username} didn't choose their pokémon in time...`,
          )
          .setColor(COLOR_ERROR);
        await message.channel.send({ embeds: [embed] });
      }
      return;
    }

    // User 2 chooses pokemon
    if (message.channel.isSendable()) {
      const embed = new EmbedBuilder()
        .setTitle('🎨 Pokémon Selection')
        .setDescription(`${user2.username}, Choose a Pokémon!`)
        .setColor(COLOR_GOLD);
      await message.channel.send({ embeds: [embed] });
    }
    const pokemon2Filter = (m: Message) => {
      return m.author.id === user2Id && m.channel.id === message.channel.id;
    };

    let pokemon2Name: string;
    let pokemon2Id: number;
    try {
      if (!message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Channel Error')
          .setDescription('This command can only be used in a text channel.')
          .setColor(COLOR_ERROR);
        await message.reply({ embeds: [embed] });
        return;
      }

      const collected2 = await message.channel.awaitMessages({
        filter: pokemon2Filter,
        max: 1,
        time: 30000,
        errors: ['time'],
      });

      const msg2 = collected2.first();
      if (!msg2) throw new Error('No message');

      const pokemon2 = await pokemonService.getPokemon(msg2.content);
      if (!pokemon2) {
        if (message.channel.isSendable()) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Pokémon')
            .setDescription('Invalid Pokémon name!')
            .setColor(COLOR_ERROR);
          await message.channel.send({ embeds: [embed] });
        }
        return;
      }

      // Validate user 2 has this pokemon
      const user2HasPokemon = await inventoryService.hasPokemon(
        user2Id,
        pokemon2.id,
      );
      if (!user2HasPokemon) {
        if (message.channel.isSendable()) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Validation Failed')
            .setDescription('You do not have that Pokémon!')
            .setColor(COLOR_ERROR);
          await message.channel.send({ embeds: [embed] });
        }
        return;
      }

      pokemon2Name = pokemon2.name;
      pokemon2Id = pokemon2.id;
    } catch (error) {
      if (message.channel.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle('⏰ Selection Timeout')
          .setDescription(
            `${user2.username} didn't choose their pokémon in time...`,
          )
          .setColor(COLOR_ERROR);
        await message.channel.send({ embeds: [embed] });
      }
      return;
    }

    // Get battle preview to calculate odds and payouts
    const preview = await battleService.getBattlePreview(
      user1Id,
      user2Id,
      pokemon1Id,
      pokemon2Id,
    );

    // Calculate odds and payouts
    const bstTotal =
      preview.user1.pokemon.finalBst + preview.user2.pokemon.finalBst;
    const player1Odds =
      Math.round((preview.user1.pokemon.finalBst / bstTotal) * 10000) / 100;
    const player2Odds =
      Math.round((preview.user2.pokemon.finalBst / bstTotal) * 10000) / 100;

    const player1Payout = Math.floor((100 / player1Odds) * wager);
    const player2Payout = Math.floor((100 / player2Odds) * wager);

    // Format stat bonuses for display
    const pokemon1Plus =
      preview.user1.pokemon.duplicates > 0
        ? ` +${preview.user1.pokemon.duplicates}`
        : '';
    const pokemon2Plus =
      preview.user2.pokemon.duplicates > 0
        ? ` +${preview.user2.pokemon.duplicates}`
        : '';
    const pokemon1BstBonus =
      preview.user1.pokemon.finalBst > preview.user1.pokemon.bst
        ? ` +${preview.user1.pokemon.finalBst - preview.user1.pokemon.bst}`
        : '';
    const pokemon2BstBonus =
      preview.user2.pokemon.finalBst > preview.user2.pokemon.bst
        ? ` +${preview.user2.pokemon.finalBst - preview.user2.pokemon.bst}`
        : '';

    // Generate battle preview image
    try {
      const imageBuffer = await generateBattleImage({
        username1: user1.username,
        pokemon1: pokemon1Name,
        pokemon1Plus,
        pokemon1Bst: preview.user1.pokemon.bst,
        pokemon1BstBonus,
        pokemon1Odds: player1Odds,
        pokemon1Id,
        balance1: balance1,
        payout1: player1Payout,

        username2: user2.username,
        pokemon2: pokemon2Name,
        pokemon2Plus,
        pokemon2Bst: preview.user2.pokemon.bst,
        pokemon2BstBonus,
        pokemon2Odds: player2Odds,
        pokemon2Id,
        balance2: balance2,
        payout2: player2Payout,

        wager,
      });

      const attachment = new AttachmentBuilder(imageBuffer, {
        name: 'battle.png',
      });

      if (message.channel.isSendable()) {
        const battlePreviewMsg = await message.channel.send({
          files: [attachment],
        });
        await battlePreviewMsg.react('✅');
        await battlePreviewMsg.react('❌');

        // Wait for both players to confirm
        const confirmFilter = (reaction: any, user: any) => {
          return (
            ((user.id === user1Id || user.id === user2Id) &&
              reaction.emoji.name === '✅') ||
            ((user.id === user1Id || user.id === user2Id) &&
              reaction.emoji.name === '❌')
          );
        };

        let timedOut = false;
        const accepted: string[] = [];
        let battling = false;

        while (!timedOut) {
          try {
            const collected = await battlePreviewMsg.awaitReactions({
              filter: confirmFilter,
              max: 1,
              time: 60000,
              errors: ['time'],
            });

            const reaction = collected.first();
            const reactUser = Array.from(
              collected.values(),
            )[0].users.cache.last();

            if (reaction?.emoji.name === '❌') {
              const embed = new EmbedBuilder()
                .setTitle('🚨 Battle Declined')
                .setDescription(`${reactUser?.username} declined the battle.`)
                .setColor(COLOR_ERROR);
              await message.channel.send({ embeds: [embed] });
              return;
            } else if (reaction?.emoji.name === '✅' && reactUser) {
              if (!accepted.includes(reactUser.id)) {
                accepted.push(reactUser.id);
              }
              if (accepted.includes(user1Id) && accepted.includes(user2Id)) {
                timedOut = true;
                battling = true;
              }
            }
          } catch (error) {
            const embed = new EmbedBuilder()
              .setTitle('⏰ Battle Timeout')
              .setDescription('Battle confirmation timed out...')
              .setColor(COLOR_ERROR);
            await message.channel.send({ embeds: [embed] });
            return;
          }
        }

        if (!battling) {
          return;
        }
      }
    } catch (imageError) {
      Logger.error(
        'Failed to generate battle image, continuing without it',
        imageError,
      );
    }

    // Perform battle
    const result = await battleService.battle(
      user1Id,
      user2Id,
      pokemon1Id,
      pokemon2Id,
    );

    // Build result message
    let battleDescription = '';
    battleDescription += `**${user1.username}'s ${pokemon1Name}**\n`;
    battleDescription += `BST: ${result.winner.pokemon.bst} + ${result.winner.pokemon.duplicates}×5 = ${result.winner.pokemon.finalBst}\n\n`;
    battleDescription += `**VS**\n\n`;
    battleDescription += `**${user2.username}'s ${pokemon2Name}**\n`;
    battleDescription += `BST: ${result.loser.pokemon.bst} + ${result.loser.pokemon.duplicates}×5 = ${result.loser.pokemon.finalBst}\n\n`;

    if (result.tied) {
      battleDescription += `**It's a tie!**\n\n`;
      battleDescription += `Both trainers gained ${result.winner.expGained} EXP!`;
    } else {
      const winnerUser = result.winner.userId === user1Id ? user1 : user2;
      const loserUser = result.loser.userId === user1Id ? user1 : user2;

      // Adjust points
      await userService.adjustPoints(result.winner.userId, wager);
      await userService.adjustPoints(result.loser.userId, -wager);

      const winnerBalance = await userService.getPikapoints(
        result.winner.userId,
      );
      const loserBalance = await userService.getPikapoints(result.loser.userId);

      battleDescription += `**${winnerUser.username}'s ${result.winner.pokemon.name} wins!**\n\n`;
      battleDescription += `${winnerUser.username} gained ${wager} pikapoints (${winnerBalance} total) and ${result.winner.expGained} EXP!\n`;
      battleDescription += `${loserUser.username} lost ${wager} pikapoints (${loserBalance} total) but gained ${result.loser.expGained} EXP!`;
    }

    const battleEmbed = new EmbedBuilder()
      .setTitle('Battle Result')
      .setDescription(battleDescription)
      .setColor(result.tied ? 0xffff00 : 0x00ff00);

    if (message.channel.isSendable()) {
      await message.channel.send({ embeds: [battleEmbed] });
    }

    Logger.info(
      `Battle: ${user1.username} (${pokemon1Name}) vs ${user2.username} (${pokemon2Name}) - ` +
        `${result.tied ? 'Tie' : `${result.winner.pokemon.name} wins`}`,
    );
  } catch (error) {
    Logger.error('Error handling battle command', error);
    await message.reply(
      'An error occurred while processing the battle. Please try again.',
    );
  }
}
