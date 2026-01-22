import { Client, Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import { initializeDatabase } from './config/database';
import { handleRoll, handleFullRoll } from './commands/roll';
import { handleProfile, handleBalance } from './commands/profile';
import { handleBag, handleOpenBall } from './commands/bag';
import { handleTransfer, handleWithdraw } from './commands/bank';
import { handlePokedex, handleInventory } from './commands/collection';
import { handleBox } from './commands/box';
import { handleRelease, handleReleaseDupes } from './commands/release';
import { handleFavorite, handleFavorites } from './commands/favorite';
import { handleTrade } from './commands/trade';
import { handleBattle } from './commands/battle';
import { handleLeaderboard } from './commands/leaderboard';
import { handlePromote, handlePrestige } from './commands/rank';
import { handleTeam } from './commands/team';
import { handleHelp, handleInfo } from './commands/info';
import {
  handleReseed,
  handleSetFocus,
  handleRemoveFocus,
  handleAddPoints,
  handleRemovePoints,
  handleGiveAll,
  handleTriggerQuiz,
  handleVoiceStats,
  handleUploadSeed,
  handleListSeeds,
  handleDownloadSeed,
  handleDeleteTrainer,
  handleGiftBalls,
} from './commands/admin';
import { handleRegister } from './commands/register';
import { handleJackpot } from './commands/jackpot';
import { LeagueService } from './services/LeagueService';
import { QuizService } from './services/QuizService';
import { VoiceRewardService } from './services/VoiceRewardService';
import {
  QUIZ_CHANNEL_ID,
  ENABLE_LEAGUE_TRACKING,
  ENABLE_QUIZ,
  ENABLE_VOICE_REWARDS,
} from './config/config';
import { ensureSeedDataDirectory } from './utils/seedManager';
import { COMMAND_HELP } from './commands/commandHelp';

class PikaGachaModule implements BotModule {
  name = 'pikaGacha';
  description =
    'Pokemon gacha system with rolling, collecting, trading, and battling';
  enabled = true;
  private logger = Logger.forModule('pikaGacha');
  private initialized = false;

  async initialize(client: Client): Promise<void> {
    if (this.initialized) {
      this.logger.warn(
        'Module already initialized, skipping re-initialization',
      );
      return;
    }

    try {
      // Initialize database
      await initializeDatabase();

      // Ensure seed_data directory exists
      ensureSeedDataDirectory();

      // Initialize League of Legends game tracking
      if (ENABLE_LEAGUE_TRACKING) {
        const leagueService = LeagueService.getInstance();
        leagueService.initializeLeagueTracking(client);
        this.logger.info('League of Legends tracking enabled');
      }

      // Initialize Quiz system
      if (ENABLE_QUIZ && QUIZ_CHANNEL_ID) {
        const quizService = QuizService.getInstance();
        quizService.initializeQuiz(client, QUIZ_CHANNEL_ID);
        this.logger.info(`Quiz system enabled (channel: ${QUIZ_CHANNEL_ID})`);
      } else if (ENABLE_QUIZ && !QUIZ_CHANNEL_ID) {
        this.logger.warn('Quiz system enabled but QUIZ_CHANNEL_ID not set');
      }

      // Initialize Voice Channel Rewards
      if (ENABLE_VOICE_REWARDS) {
        const voiceRewardService = VoiceRewardService.getInstance();
        voiceRewardService.initializeVoiceTracking(client);
        this.logger.info('Voice channel rewards enabled');
      }

      this.initialized = true;
      this.logger.info('PikaGacha module initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PikaGacha module', error);
      this.enabled = false;
    }
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (!this.initialized) return false;

    // Check for quiz answers (non-command messages in quiz channel)
    if (ENABLE_QUIZ && !message.content.startsWith('!')) {
      const quizService = QuizService.getInstance();
      const wasQuizAnswer = await quizService.checkQuizAnswer(message);
      if (wasQuizAnswer) {
        return true; // Message was a quiz answer, handled by QuizService
      }
    }

    const content = message.content.trim().toLowerCase();

    // Check if message starts with !pg
    if (!content.startsWith('!pg ') && content !== '!pg') {
      return false;
    }

    // Handle !pg without subcommand
    if (content === '!pg') {
      await message.reply(
        '🎮 **PikaGacha Commands**\n\n' +
          'Use `!pg help` to see all available commands with details.\n' +
          'Use `!pg info` for a comprehensive guide on how PikaGacha works.\n' +
          'Example: `!pg register <name>` or `!pg roll`',
      );
      return true;
    }

    // Extract subcommand and arguments
    const parts = message.content.trim().split(/\s+/);
    const subcommand = parts[1]?.toLowerCase() || '';
    const args = parts.slice(2);

    // Helper function to check if user wants help for a specific command
    const wantsHelp = args.length > 0 && args[0].toLowerCase() === 'help';

    try {
      // Registration
      if (subcommand === 'register' || subcommand === 'signup') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.register()] });
          return true;
        }
        await handleRegister(message, args);
        return true;
      }

      // Roll commands
      if (subcommand === 'roll') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.roll()] });
          return true;
        }
        await handleRoll(message, args);
        return true;
      }

      if (subcommand === 'fullroll') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.fullroll()] });
          return true;
        }
        await handleFullRoll(message, args);
        return true;
      }

      // Profile commands
      if (subcommand === 'trainer' || subcommand === 'profile') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.trainer()] });
          return true;
        }
        await handleProfile(message, args);
        return true;
      }

      if (subcommand === 'balance' || subcommand === 'bal') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.balance()] });
          return true;
        }
        await handleBalance(message);
        return true;
      }

      if (subcommand === 'transfer') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.transfer()] });
          return true;
        }
        await handleTransfer(message, args);
        return true;
      }

      if (subcommand === 'withdraw') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.withdraw()] });
          return true;
        }
        await handleWithdraw(message, args);
        return true;
      }

      // Bag commands
      if (subcommand === 'bag') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.bag()] });
          return true;
        }
        await handleBag(message, args);
        return true;
      }

      if (subcommand === 'open') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.open()] });
          return true;
        }
        await handleOpenBall(message, args);
        return true;
      }

      // Collection commands
      if (subcommand === 'pokedex' || subcommand === 'dex') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.pokedex()] });
          return true;
        }
        await handlePokedex(message, args);
        return true;
      }

      if (subcommand === 'inventory' || subcommand === 'inv') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.inventory()] });
          return true;
        }
        await handleInventory(message, args);
        return true;
      }

      if (subcommand === 'box') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.box()] });
          return true;
        }
        await handleBox(message, args);
        return true;
      }

      // Release commands
      if (subcommand === 'releasedupes') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.releasedupes()] });
          return true;
        }
        await handleReleaseDupes(message, args);
        return true;
      }

      if (subcommand === 'release') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.release()] });
          return true;
        }
        await handleRelease(message, args);
        return true;
      }

      // Favorite commands
      if (subcommand === 'favorites' || subcommand === 'favs') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.favorites()] });
          return true;
        }
        await handleFavorites(message, args);
        return true;
      }

      if (subcommand === 'favorite' || subcommand === 'fav') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.favorite()] });
          return true;
        }
        await handleFavorite(message, args);
        return true;
      }

      // Social commands
      if (subcommand === 'trade') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.trade()] });
          return true;
        }
        await handleTrade(message, args);
        return true;
      }

      if (subcommand === 'battle') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.battle()] });
          return true;
        }
        await handleBattle(message, args);
        return true;
      }

      if (subcommand === 'leaderboard' || subcommand === 'lb') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.leaderboard()] });
          return true;
        }
        await handleLeaderboard(message, args);
        return true;
      }

      // Rank commands
      if (subcommand === 'promote') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.promote()] });
          return true;
        }
        await handlePromote(message);
        return true;
      }

      if (subcommand === 'prestige') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.prestige()] });
          return true;
        }
        await handlePrestige(message);
        return true;
      }

      if (subcommand === 'team') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.team()] });
          return true;
        }
        await handleTeam(message, args);
        return true;
      }

      if (subcommand === 'jackpot') {
        if (wantsHelp) {
          await message.reply({ embeds: [COMMAND_HELP.jackpot()] });
          return true;
        }
        await handleJackpot(message);
        return true;
      }

      if (subcommand === 'help') {
        await handleHelp(message);
        return true;
      }

      if (subcommand === 'info') {
        await handleInfo(message);
        return true;
      }

      // Admin commands
      if (subcommand === 'reseed') {
        await handleReseed(message, args);
        return true;
      }

      if (subcommand === 'setfocus') {
        await handleSetFocus(message, args);
        return true;
      }

      if (subcommand === 'removefocus') {
        await handleRemoveFocus(message);
        return true;
      }

      if (subcommand === 'addpoints') {
        await handleAddPoints(message, args);
        return true;
      }

      if (subcommand === 'removepoints') {
        await handleRemovePoints(message, args);
        return true;
      }

      if (subcommand === 'giveall') {
        await handleGiveAll(message, args);
        return true;
      }

      if (subcommand === 'triggerquiz') {
        await handleTriggerQuiz(message, args);
        return true;
      }

      if (subcommand === 'voicestats') {
        await handleVoiceStats(message, args);
        return true;
      }

      if (subcommand === 'uploadseed') {
        await handleUploadSeed(message, args);
        return true;
      }

      if (subcommand === 'listseeds') {
        await handleListSeeds(message, args);
        return true;
      }

      if (subcommand === 'downloadseed') {
        await handleDownloadSeed(message, args);
        return true;
      }

      if (subcommand === 'giftballs') {
        await handleGiftBalls(message, args);
        return true;
      }

      if (subcommand === 'deletetrainer') {
        await handleDeleteTrainer(message, args);
        return true;
      }

      // Unknown subcommand
      await message.reply(
        `❌ Unknown PikaGacha command: \`${subcommand}\`\n` +
          'Use `!help` to see all available commands.',
      );
    } catch (error) {
      this.logger.error('Error handling message in PikaGacha module', error);
      await message.reply(
        'An error occurred while processing your command. Please try again.',
      );
    }

    return false;
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!pg register',
        description: 'Register as a Pokémon trainer to start playing',
        usage: '!pg register <trainer_name>',
      },
      {
        command: '!pg roll',
        description: 'Roll the gacha for a random Pokémon',
        usage: '!pg roll [region]',
      },
      {
        command: '!pg fullroll',
        description: 'Roll multiple times at once',
        usage: '!pg fullroll [region] [count] [--detailed|-d]',
      },
      {
        command: '!pg trainer',
        description: 'View a trainer profile card',
        usage: '!pg trainer <name>',
      },
      {
        command: '!pg balance',
        description: 'Check your pikapoints and savings',
        usage: '!pg balance',
      },
      {
        command: '!pg bag',
        description: 'View item bag inventory',
        usage: '!pg bag [user]',
      },
      {
        command: '!pg open',
        description: 'Open a ball from your bag',
        usage: '!pg open <ball_type>',
      },
      {
        command: '!pg pokedex',
        description: 'Look up Pokémon information',
        usage: '!pg pokedex <pokemon_name_or_id>',
      },
      {
        command: '!pg inventory',
        description: 'View Pokémon collection',
        usage: '!pg inventory [user]',
      },
      {
        command: '!pg box',
        description: 'View Pokémon collection with sprites (paginated)',
        usage: '!pg box [user] [--favorites|-f]',
      },
      {
        command: '!pg release',
        description: 'Release Pokémon for pikapoints',
        usage: '!pg release <pokemon_name> [all|dupes]',
      },
      {
        command: '!pg releasedupes',
        description: 'Release duplicate Pokémon by rarity',
        usage: '!pg releasedupes <rarity> [region]',
      },
      {
        command: '!pg favorite',
        description: 'Toggle a Pokémon as favorite',
        usage: '!pg favorite <pokemon_name>',
      },
      {
        command: '!pg favorites',
        description: 'View favorite Pokémon',
        usage: '!pg favorites',
      },
      {
        command: '!pg trade',
        description: 'Trade Pokémon with another user',
        usage: '!pg trade <your_pokemon> <their_pokemon> <their_id>',
      },
      {
        command: '!pg battle',
        description: 'Challenge another user to a Pokémon battle',
        usage: '!pg battle <their_id> <wager>',
      },
      {
        command: '!pg leaderboard',
        description: 'View leaderboards for various stats',
        usage: '!pg leaderboard [stat_type]',
      },
      {
        command: '!pg jackpot',
        description: 'View current jackpot pool and your contribution',
        usage: '!pg jackpot',
      },
      {
        command: '!pg help',
        description: 'Show all commands with detailed descriptions',
        usage: '!pg help',
      },
      {
        command: '!pg info',
        description: 'Comprehensive guide on how PikaGacha works',
        usage: '!pg info',
      },
      {
        command: '!pg reseed',
        description: 'Reseed Pokémon database from CSV',
        usage: '!pg reseed --confirm',
        adminOnly: true,
      },
      {
        command: '!pg setfocus',
        description: 'Set a Pokémon as focus (rate-up)',
        usage: '!pg setfocus <pokemon_name_or_id> <true|false>',
        adminOnly: true,
      },
      {
        command: '!pg addpoints',
        description: 'Give pikapoints to any user',
        usage: '!pg addpoints <@user|user_id> <amount>',
        adminOnly: true,
      },
      {
        command: '!pg removepoints',
        description: 'Remove pikapoints from any user',
        usage: '!pg removepoints <@user|user_id> <amount>',
        adminOnly: true,
      },
      {
        command: '!pg giveall',
        description: 'Give pikapoints to all registered trainers',
        usage: '!pg giveall <amount> [--confirm]',
        adminOnly: true,
      },
      {
        command: '!pg triggerquiz',
        description: 'Trigger a quiz in 10 seconds',
        usage: '!pg triggerquiz',
        adminOnly: true,
      },
      {
        command: '!pg voicestats',
        description: 'View voice channel reward stats for a user',
        usage: '!pg voicestats [@user|user_id]',
        adminOnly: true,
      },
      {
        command: '!pg uploadseed',
        description: 'Upload a new CSV seed file for Pokemon data',
        usage: '!pg uploadseed (with CSV file attached)',
        adminOnly: true,
      },
      {
        command: '!pg listseeds',
        description: 'List all uploaded seed files',
        usage: '!pg listseeds',
        adminOnly: true,
      },
      {
        command: '!pg downloadseed',
        description: 'Download the current seed CSV file for editing',
        usage: '!pg downloadseed',
        adminOnly: true,
      },
      {
        command: '!pg deletetrainer',
        description: 'Permanently delete a trainer and all their data',
        usage: '!pg deletetrainer <@user|user_id>',
        adminOnly: true,
      },
      {
        command: '!pg giftballs',
        description: 'Gift balls to a user',
        usage: '!pg giftballs <@user|user_id> <ball_type> <amount>',
        adminOnly: true,
      },
    ];
  }
}

export default new PikaGachaModule();
