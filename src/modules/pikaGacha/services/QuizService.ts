import { Client, TextChannel, Message, EmbedBuilder } from 'discord.js';
import { UserService } from './UserService';
import { TrainerService } from './TrainerService';
import { ItemService } from './ItemService';
import {
  getRandomQuestion,
  checkAnswer,
  getRandomTextQuizQuestion,
} from '../config/quizQuestions';
import {
  getRandomSpriteQuestion,
  checkSpriteAnswer,
} from '../config/spriteQuizQuestions';
import Logger from '../../../utils/logger';
import {
  QUIZ_MIN_SPAWN_MS,
  QUIZ_MAX_SPAWN_MS,
  QUIZ_TIMEOUT_MS,
  BASE_REWARD,
  STREAK_BONUS,
  MAX_REWARD,
  SHUTDOWN_MULTIPLIER,
  STREAK_REWARDS,
} from '../config/config';

const logger = Logger.forModule('QuizService');

export class QuizService {
  private static instance: QuizService;
  private userService: UserService;
  private trainerService: TrainerService;
  private itemService: ItemService;
  private client: Client | null = null;
  private quizChannelId: string | null = null;
  private activeQuiz: {
    question: string;
    answer: string;
    messageId: string;
    timeout: NodeJS.Timeout;
    type: 'text' | 'sprite';
  } | null = null;
  private quizInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private isPostingQuiz: boolean = false; // Prevent concurrent quiz posts
  private static instanceCount = 0;
  private instanceId: number;

  private constructor() {
    this.instanceId = ++QuizService.instanceCount;
    this.userService = UserService.getInstance();
    this.trainerService = TrainerService.getInstance();
    this.itemService = new ItemService();
    logger.debug(
      `QuizService constructor called (instance #${this.instanceId})`,
    );
  }

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService();
      logger.debug(
        `QuizService singleton instance created (#${QuizService.instance.instanceId})`,
      );
    }
    return QuizService.instance;
  }

  /**
   * Initialize the quiz system with a Discord client and channel
   */
  public initializeQuiz(client: Client, channelId: string): void {
    if (this.isInitialized) {
      logger.warn(
        `[Instance #${this.instanceId}] initializeQuiz called but already initialized - ignoring`,
      );
      return;
    }

    logger.info(
      `[Instance #${this.instanceId}] initializeQuiz called (channel: ${channelId})`,
    );
    // Clear any existing timers first to prevent duplicate schedules
    this.stopQuiz();

    this.client = client;
    this.quizChannelId = channelId;

    // Schedule first quiz with random delay
    this.scheduleNextQuiz();

    this.isInitialized = true;

    logger.info(`Quiz system initialized (channel: ${channelId})`);
  }

  /**
   * Get random delay between min and max spawn times
   */
  private getRandomDelay(): number {
    return (
      QUIZ_MIN_SPAWN_MS +
      Math.random() * (QUIZ_MAX_SPAWN_MS - QUIZ_MIN_SPAWN_MS)
    );
  }

  /**
   * Schedule next quiz with random delay and type
   */
  private scheduleNextQuiz(): void {
    // Safety check: Clear any existing interval first
    if (this.quizInterval) {
      logger.warn(
        'scheduleNextQuiz called but interval already exists! Clearing it first.',
      );
      clearTimeout(this.quizInterval);
      this.quizInterval = null;
    }

    const delay = this.getRandomDelay();
    const quizType: 'text' | 'sprite' = Math.random() < 0.5 ? 'text' : 'sprite';

    logger.debug(`scheduleNextQuiz called, scheduling ${quizType} quiz`);

    const timerId = setTimeout(async () => {
      logger.info(
        `Quiz timeout triggered for ${quizType} quiz at ${new Date().toLocaleTimeString()}`,
      );

      // Prevent concurrent quiz posts
      if (this.isPostingQuiz) {
        logger.warn('Already posting a quiz, skipping this trigger');
        return;
      }

      this.isPostingQuiz = true;

      try {
        if (quizType === 'text') {
          await this.postQuiz();
        } else {
          await this.postSpriteQuiz();
        }
      } finally {
        this.isPostingQuiz = false;
        this.scheduleNextQuiz(); // Schedule the next one after posting completes
      }
    }, delay);

    this.quizInterval = timerId;
    logger.debug(`Timer ID ${timerId} created`);

    logger.info(
      `Next ${quizType} quiz scheduled in ${Math.round(delay / 60000)} minutes`,
    );
  }

  /**
   * Stop the quiz system
   */
  public stopQuiz(): void {
    if (this.quizInterval) {
      clearTimeout(this.quizInterval);
      this.quizInterval = null;
      logger.debug('Cleared quiz interval');
    }
    if (this.activeQuiz) {
      clearTimeout(this.activeQuiz.timeout);
      this.activeQuiz = null;
      logger.debug('Cleared active quiz');
    }
    this.isInitialized = false;
    logger.info('Quiz system stopped');
  }

  /**
   * Post a new text quiz question to the channel
   */
  private async postQuiz(): Promise<void> {
    try {
      if (!this.client || !this.quizChannelId) {
        logger.warn('Quiz system not properly initialized');
        return;
      }

      if (this.activeQuiz) {
        logger.info('Skipping quiz post - active quiz in progress');
        return;
      }

      const channel = await this.client.channels.fetch(this.quizChannelId);
      if (!channel || !channel.isTextBased()) {
        logger.error('Quiz channel not found or not text-based');
        return;
      }

      // Get dynamic question from PokeAPI
      const question = await getRandomTextQuizQuestion();

      if (!question) {
        logger.error(
          'Failed to generate text quiz question, falling back to hardcoded questions',
        );
        const fallbackQuestion = getRandomQuestion();
        const embed = new EmbedBuilder()
          .setColor(0x9370db)
          .setTitle('🧠 PikaGacha Quiz!')
          .setDescription(
            `**${fallbackQuestion.question}**\n\n` +
              `Difficulty: ${fallbackQuestion.difficulty.toUpperCase()}\n` +
              `Category: ${fallbackQuestion.category}\n\n` +
              `Reply with your answer within ${QUIZ_TIMEOUT_MS / 1000} seconds!\n` +
              `Correct answers earn **${BASE_REWARD}-${MAX_REWARD}** pikapoints based on your streak!`,
          )
          .setFooter({ text: 'PikaGacha Quiz' })
          .setTimestamp();

        const message = await (channel as TextChannel).send({
          embeds: [embed],
        });

        const timeout = setTimeout(() => {
          this.handleQuizTimeout(message);
        }, QUIZ_TIMEOUT_MS);

        this.activeQuiz = {
          question: fallbackQuestion.question,
          answer: fallbackQuestion.answer,
          messageId: message.id,
          timeout,
          type: 'text',
        };

        logger.info(`Posted fallback text quiz: ${fallbackQuestion.question}`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x9370db)
        .setTitle('🧠 PikaGacha Quiz!')
        .setDescription(
          `**${question.question}**\n\n` +
            `Difficulty: ${question.difficulty.toUpperCase()}\n` +
            `Category: ${question.category}\n\n` +
            `Reply with your answer within ${QUIZ_TIMEOUT_MS / 1000} seconds!\n` +
            `Correct answers earn **${BASE_REWARD}-${MAX_REWARD}** pikapoints based on your streak!`,
        )
        .setFooter({ text: 'PikaGacha Quiz' })
        .setTimestamp();

      const message = await (channel as TextChannel).send({ embeds: [embed] });

      // Set up active quiz with timeout
      const timeout = setTimeout(() => {
        this.handleQuizTimeout(message);
      }, QUIZ_TIMEOUT_MS);

      this.activeQuiz = {
        question: question.question,
        answer: question.answer,
        messageId: message.id,
        timeout,
        type: 'text',
      };

      logger.info(
        `Posted text quiz: ${question.question} (Pokemon: ${question.pokemonName || 'N/A'})`,
      );
    } catch (error) {
      logger.error('Error posting quiz:', error);
    }
  }

  /**
   * Post a new sprite quiz question to the channel
   */
  private async postSpriteQuiz(): Promise<void> {
    try {
      if (!this.client || !this.quizChannelId) {
        logger.warn('Quiz system not properly initialized');
        return;
      }

      if (this.activeQuiz) {
        logger.info('Skipping sprite quiz post - active quiz in progress');
        return;
      }

      const channel = await this.client.channels.fetch(this.quizChannelId);
      if (!channel || !channel.isTextBased()) {
        logger.error('Quiz channel not found or not text-based');
        return;
      }

      // Get random sprite question from database
      const spriteQuestion = await getRandomSpriteQuestion();

      const embed = new EmbedBuilder()
        .setColor(0x9370db)
        .setTitle("👁️ Who's That Pokemon?!")
        .setImage(spriteQuestion.spriteUrl)
        .setFooter({
          text: `Reply with the name within ${QUIZ_TIMEOUT_MS / 1000} seconds! • Earn ${BASE_REWARD}-${MAX_REWARD} pikapoints`,
        })
        .setTimestamp();

      const message = await (channel as TextChannel).send({ embeds: [embed] });

      // Set up active quiz with timeout
      const timeout = setTimeout(() => {
        this.handleQuizTimeout(message);
      }, QUIZ_TIMEOUT_MS);

      this.activeQuiz = {
        question: `Who's that Pokemon?`,
        answer: spriteQuestion.pokemonName,
        messageId: message.id,
        timeout,
        type: 'sprite',
      };

      logger.info(`Posted sprite quiz: ${spriteQuestion.pokemonName}`);
    } catch (error) {
      logger.error('Error posting sprite quiz:', error);
    }
  }

  /**
   * Handle quiz timeout (no correct answer)
   */
  private async handleQuizTimeout(message: Message): Promise<void> {
    // Check if quiz is still active (someone may have answered right before timeout)
    if (!this.activeQuiz) {
      logger.debug('Quiz timeout triggered but quiz already cleared');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle("⏰ Time's Up!")
      .setDescription(`The correct answer was: **${this.activeQuiz.answer}**`)
      .setFooter({ text: 'PikaGacha Quiz' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    this.activeQuiz = null;

    logger.info('Quiz timed out');

    // Schedule the next quiz
    this.scheduleNextQuiz();
  }

  /**
   * Check if a message is an answer to the active quiz
   */
  public async checkQuizAnswer(message: Message): Promise<boolean> {
    if (!this.activeQuiz) return false;
    if (!this.quizChannelId || message.channelId !== this.quizChannelId)
      return false;

    const userAnswer = message.content.trim();
    let isCorrect = false;

    // Check answer based on quiz type
    if (this.activeQuiz.type === 'text') {
      isCorrect = checkAnswer(userAnswer, this.activeQuiz.answer);
    } else if (this.activeQuiz.type === 'sprite') {
      isCorrect = checkSpriteAnswer(userAnswer, this.activeQuiz.answer);
    }

    if (isCorrect) {
      await this.handleCorrectAnswer(message);
      return true;
    }

    return false;
  }

  /**
   * Handle a correct quiz answer
   */
  private async handleCorrectAnswer(message: Message): Promise<void> {
    if (!this.activeQuiz) return;

    try {
      const userId = message.author.id;

      // Get or create user and trainer
      let user = await this.userService.getUser(userId);
      if (!user) {
        await message.reply(
          '❌ You need to register first with `!pg register <name>`',
        );
        return;
      }

      let trainer = await this.trainerService.getTrainerByUserId(userId);
      if (!trainer) {
        await message.reply(
          '❌ You need to register first with `!pg register <name>`',
        );
        return;
      }

      const currentStreak = trainer.currentStreak;
      const previousStreak = currentStreak;
      const newStreak = currentStreak + 1;

      // Calculate rewards
      const pointsReward = Math.min(
        BASE_REWARD + STREAK_BONUS * currentStreak,
        MAX_REWARD,
      );

      // Update user points
      await this.userService.adjustPoints(userId, pointsReward);

      // Update trainer stats
      await this.trainerService.updateTrainer(userId, {
        quizAnswered: trainer.quizAnswered + 1,
        currentStreak: newStreak,
        highestStreak: Math.max(trainer.highestStreak, newStreak),
      });

      // Check for hot streak (5+ consecutive)
      if (newStreak >= 5 && previousStreak < 5) {
        await this.trainerService.updateTrainer(userId, {
          hotStreaks: trainer.hotStreaks + 1,
        });
      }

      // Check if someone else had a streak that was broken (shutdown) BEFORE building response
      const shutdowns = await this.checkForShutdowns(userId, newStreak);

      // Build response
      let description = `✅ **Correct!** ${message.author.toString()}\n\n`;
      description += `💰 You earned **${pointsReward}** pikapoints!\n`;
      description += `🔥 Streak: **${newStreak}** (Best: ${Math.max(trainer.highestStreak, newStreak)})\n`;

      // Check for streak ball rewards
      const ballReward =
        STREAK_REWARDS[newStreak as keyof typeof STREAK_REWARDS];
      if (ballReward) {
        await this.itemService.addItem(userId, ballReward, 1);
        const ballNames = [
          '',
          'Pokeball',
          'Greatball',
          'Ultraball',
          'Masterball',
        ];
        description += `\n🎁 **Streak Bonus!** You received a ${ballNames[ballReward]}!\n`;
      }

      if (newStreak >= 5) {
        description += `\n🔥 **HOT STREAK!** You're on fire!\n`;
      }

      // Add shutdown information to the embed
      if (shutdowns.length > 0) {
        description += `\n💀 **Shutdowns:**\n`;
        for (const shutdown of shutdowns) {
          description += `   • ${shutdown.name} lost ${shutdown.streakLost} streak (additional +${shutdown.points} pts)\n`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Quiz Answer Correct!')
        .setDescription(description)
        .setFooter({ text: 'PikaGacha Quiz' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      // Clear active quiz
      if (this.activeQuiz.timeout) {
        clearTimeout(this.activeQuiz.timeout);
      }
      this.activeQuiz = null;

      logger.info(
        `${message.author.tag} answered correctly (streak: ${newStreak}, points: ${pointsReward})`,
      );

      // Schedule the next quiz
      this.scheduleNextQuiz();
    } catch (error) {
      logger.error('Error handling correct answer:', error);
    }
  }

  /**
   * Check if other users had their streaks broken and award shutdown bonuses
   * Only one trainer can have a streak at a time - when someone new wins,
   * all others with streaks get shutdown bonuses and have their streaks reset
   * Returns information about shutdowns for display
   */
  private async checkForShutdowns(
    winnerId: string,
    _winnerStreak: number,
  ): Promise<Array<{ name: string; streakLost: number; points: number }>> {
    const shutdownInfo: Array<{
      name: string;
      streakLost: number;
      points: number;
    }> = [];

    try {
      // Import Trainer model to query for active streaks
      const { Trainer } = await import('../models/Trainer');

      // Find all trainers with currentStreak > 0 except the winner
      const trainersWithStreaks = await Trainer.findAll({
        where: {
          userId: { [require('sequelize').Op.ne]: winnerId },
          currentStreak: { [require('sequelize').Op.gt]: 0 },
        },
      });

      // Award shutdown bonuses and reset streaks
      for (const trainer of trainersWithStreaks) {
        const streakLost = trainer.currentStreak;
        const shutdownPoints = SHUTDOWN_MULTIPLIER * (streakLost - 1);

        // Award shutdown points (if any)
        if (shutdownPoints > 0) {
          await this.userService.adjustPoints(trainer.userId, shutdownPoints);
          logger.info(
            `Shutdown: ${trainer.name} lost ${streakLost} streak, earned ${shutdownPoints} points`,
          );
        }

        // Update trainer stats
        await this.trainerService.updateTrainer(trainer.userId, {
          shutdowns: trainer.shutdowns + 1,
          currentStreak: 0,
        });

        // Add to shutdown info for display
        shutdownInfo.push({
          name: trainer.name,
          streakLost: streakLost,
          points: shutdownPoints,
        });
      }
    } catch (error) {
      logger.error('Error checking shutdowns:', error);
    }

    return shutdownInfo;
  }

  /**
   * Manually trigger a quiz (for testing or admin commands)
   * @param type - Optional quiz type ('text' or 'sprite'). If not specified, randomly chooses.
   */
  public async triggerQuiz(type?: 'text' | 'sprite'): Promise<void> {
    if (this.activeQuiz) {
      logger.warn(
        '[QuizService] Cannot trigger quiz - active quiz in progress',
      );
      return;
    }

    // If no type specified, randomly choose
    const quizType = type || (Math.random() < 0.5 ? 'text' : 'sprite');

    if (quizType === 'text') {
      await this.postQuiz();
    } else {
      await this.postSpriteQuiz();
    }
    // Don't reschedule here since this is manual
  }

  /**
   * Get quiz statistics
   */
  public getQuizStats(): {
    isActive: boolean;
    channelId: string | null;
    activeQuiz: boolean;
  } {
    return {
      isActive: this.quizInterval !== null,
      channelId: this.quizChannelId,
      activeQuiz: this.activeQuiz !== null,
    };
  }
}
