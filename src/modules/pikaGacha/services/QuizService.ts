import {
  Client,
  TextChannel,
  Message,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { UserService } from './UserService';
import { TrainerService } from './TrainerService';
import { ItemService } from './ItemService';
import { getRandomQuestion, checkAnswer } from '../config/quizQuestions';
import {
  getRandomSpriteQuestion,
  checkSpriteAnswer,
  SpriteQuizQuestion,
} from '../config/spriteQuizQuestions';
import Logger from '../../../utils/logger';
import {
  QUIZ_INTERVAL_MS,
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

  private constructor() {
    this.userService = UserService.getInstance();
    this.trainerService = TrainerService.getInstance();
    this.itemService = new ItemService();
  }

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService();
    }
    return QuizService.instance;
  }

  /**
   * Initialize the quiz system with a Discord client and channel
   */
  public initializeQuiz(client: Client, channelId: string): void {
    this.client = client;
    this.quizChannelId = channelId;

    // Schedule quizzes at exact hour and half-hour marks
    this.scheduleNextQuiz();

    logger.info(
      `[QuizService] Quiz system initialized (channel: ${channelId})`,
    );
  }

  /**
   * Calculate next quiz time (15-minute intervals) and determine quiz type
   * :00 and :30 = text quiz
   * :15 and :45 = sprite quiz
   */
  private getNextQuizTime(now: Date): { time: Date; type: 'text' | 'sprite' } {
    const next = new Date(now);
    const currentMinute = now.getMinutes();

    // Find next 15-minute mark
    const nextMinute = Math.ceil((currentMinute + 1) / 15) * 15;

    if (nextMinute === 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
    } else {
      next.setMinutes(nextMinute);
    }

    next.setSeconds(0);
    next.setMilliseconds(0);

    // Determine quiz type based on minute
    const minute = next.getMinutes();
    const type = minute === 0 || minute === 30 ? 'text' : 'sprite';

    return { time: next, type };
  }

  /**
   * Calculate next hour or half-hour mark and schedule quiz
   */
  private scheduleNextQuiz(): void {
    const now = new Date();
    const { time: nextQuizTime, type: quizType } = this.getNextQuizTime(now);
    const delay = nextQuizTime.getTime() - now.getTime();

    this.quizInterval = setTimeout(() => {
      if (quizType === 'text') {
        this.postQuiz();
      } else {
        this.postSpriteQuiz();
      }
      this.scheduleNextQuiz(); // Schedule the next one after posting
    }, delay);

    logger.info(
      `[QuizService] Next ${quizType} quiz scheduled for ${nextQuizTime.toLocaleTimeString()} (in ${Math.round(delay / 60000)} minutes)`,
    );
  }

  /**
   * Get the next exact hour or half-hour mark
   */
  private getNextHourOrHalfHour(from: Date): Date {
    const next = new Date(from);
    const minutes = next.getMinutes();
    const seconds = next.getSeconds();
    const milliseconds = next.getMilliseconds();

    // Reset seconds and milliseconds
    next.setSeconds(0, 0);

    if (minutes < 30) {
      // Next half hour
      next.setMinutes(30);
    } else {
      // Next full hour
      next.setMinutes(0);
      next.setHours(next.getHours() + 1);
    }

    return next;
  }

  /**
   * Stop the quiz system
   */
  public stopQuiz(): void {
    if (this.quizInterval) {
      clearTimeout(this.quizInterval);
      this.quizInterval = null;
    }
    if (this.activeQuiz) {
      clearTimeout(this.activeQuiz.timeout);
      this.activeQuiz = null;
    }
    logger.info('[QuizService] Quiz system stopped');
  }

  /**
   * Post a new text quiz question to the channel
   */
  private async postQuiz(): Promise<void> {
    try {
      if (!this.client || !this.quizChannelId) {
        logger.warn('[QuizService] Quiz system not properly initialized');
        return;
      }

      if (this.activeQuiz) {
        logger.info(
          '[QuizService] Skipping quiz post - active quiz in progress',
        );
        return;
      }

      const channel = await this.client.channels.fetch(this.quizChannelId);
      if (!channel || !channel.isTextBased()) {
        logger.error('[QuizService] Quiz channel not found or not text-based');
        return;
      }

      const question = getRandomQuestion();
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

      logger.info(`[QuizService] Posted text quiz: ${question.question}`);
    } catch (error) {
      logger.error('[QuizService] Error posting quiz:', error);
    }
  }

  /**
   * Post a new sprite quiz question to the channel
   */
  private async postSpriteQuiz(): Promise<void> {
    try {
      if (!this.client || !this.quizChannelId) {
        logger.warn('[QuizService] Quiz system not properly initialized');
        return;
      }

      if (this.activeQuiz) {
        logger.info(
          '[QuizService] Skipping sprite quiz post - active quiz in progress',
        );
        return;
      }

      const channel = await this.client.channels.fetch(this.quizChannelId);
      if (!channel || !channel.isTextBased()) {
        logger.error('[QuizService] Quiz channel not found or not text-based');
        return;
      }

      const spriteQuestion = getRandomSpriteQuestion();

      const embed = new EmbedBuilder()
        .setColor(0x9370db)
        .setTitle("👁️ Who's That PikaGacha?!")
        .setDescription(
          `**Identify this PikaGacha!**\n\n` +
            `Difficulty: ${spriteQuestion.difficulty.toUpperCase()}\n` +
            `Generation: ${spriteQuestion.generation}\n\n` +
            `Reply with the name within ${QUIZ_TIMEOUT_MS / 1000} seconds!\n` +
            `Correct answers earn **${BASE_REWARD}-${MAX_REWARD}** pikapoints based on your streak!`,
        )
        .setImage(spriteQuestion.spriteUrl)
        .setFooter({ text: 'PikaGacha Sprite Quiz' })
        .setTimestamp();

      const message = await (channel as TextChannel).send({ embeds: [embed] });

      // Set up active quiz with timeout
      const timeout = setTimeout(() => {
        this.handleQuizTimeout(message);
      }, QUIZ_TIMEOUT_MS);

      this.activeQuiz = {
        question: `Who's that PikaGacha?`,
        answer: spriteQuestion.pokemonName,
        messageId: message.id,
        timeout,
        type: 'sprite',
      };

      logger.info(
        `[QuizService] Posted sprite quiz: ${spriteQuestion.pokemonName}`,
      );
    } catch (error) {
      logger.error('[QuizService] Error posting sprite quiz:', error);
    }
  }

  /**
   * Handle quiz timeout (no correct answer)
   */
  private async handleQuizTimeout(message: Message): Promise<void> {
    if (!this.activeQuiz) return;

    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle("⏰ Time's Up!")
      .setDescription(`The correct answer was: **${this.activeQuiz.answer}**`)
      .setFooter({ text: 'PikaGacha Quiz' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    this.activeQuiz = null;

    logger.info('[QuizService] Quiz timed out');
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
        `[QuizService] ${message.author.tag} answered correctly (streak: ${newStreak}, points: ${pointsReward})`,
      );

      // Check if someone else had a streak that was broken (shutdown)
      await this.checkForShutdowns(userId, newStreak);
    } catch (error) {
      logger.error('[QuizService] Error handling correct answer:', error);
    }
  }

  /**
   * Check if other users had their streaks broken and award shutdown bonuses
   */
  private async checkForShutdowns(
    winnerId: string,
    winnerStreak: number,
  ): Promise<void> {
    try {
      // This would require tracking all active streaks
      // For now, we'll implement a simple version that resets streaks when someone else wins
      // In a full implementation, you'd query all trainers with currentStreak > 0

      // TODO: Implement full shutdown logic
      // This would involve:
      // 1. Finding all trainers with currentStreak > 0
      // 2. For each, award shutdown bonus: 10 * (streak - 1) points
      // 3. Update shutdowns stat
      // 4. Reset their currentStreak to 0

      logger.info(
        `[QuizService] Shutdown check for winner ${winnerId} with streak ${winnerStreak}`,
      );
    } catch (error) {
      logger.error('[QuizService] Error checking shutdowns:', error);
    }
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
