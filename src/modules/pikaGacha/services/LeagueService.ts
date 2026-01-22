import {
  Client,
  ActivityType,
  Presence,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { UserService } from './UserService';
import Logger from '../../../utils/logger';
import {
  LEAGUE_CLIENT_ID,
  MIN_GAME_DURATION_MS,
  LEAGUE_REWARD_POINTS,
  REWARD_LOG_CHANNEL_ID,
} from '../config/config';

const logger = Logger.forModule('LeagueService');

export class LeagueService {
  private static instance: LeagueService;
  private userService: UserService;
  private client: Client | null = null;

  private constructor() {
    this.userService = UserService.getInstance();
  }

  public static getInstance(): LeagueService {
    if (!LeagueService.instance) {
      LeagueService.instance = new LeagueService();
    }
    return LeagueService.instance;
  }

  /**
   * Initialize League of Legends game tracking for a Discord client
   */
  public initializeLeagueTracking(client: Client): void {
    this.client = client;
    client.on('presenceUpdate', async (oldPresence, newPresence) => {
      await this.handlePresenceUpdate(oldPresence, newPresence);
    });

    logger.info('League of Legends game tracking initialized');
  }

  /**
   * Handle presence updates to track League of Legends games
   */
  private async handlePresenceUpdate(
    oldPresence: Presence | null,
    newPresence: Presence,
  ): Promise<void> {
    try {
      const userId = newPresence.userId;

      // Check if user is playing League of Legends
      const isPlayingLeague = this.isPlayingLeague(newPresence);
      const wasPlayingLeague = oldPresence
        ? this.isPlayingLeague(oldPresence)
        : false;

      // Game started
      if (isPlayingLeague && !wasPlayingLeague) {
        await this.handleGameStart(userId);
      }
      // Game ended
      else if (!isPlayingLeague && wasPlayingLeague) {
        await this.handleGameEnd(userId);
      }
    } catch (error) {
      logger.error('Error handling presence update:', error);
    }
  }

  /**
   * Check if a presence indicates the user is playing League of Legends
   */
  private isPlayingLeague(presence: Presence): boolean {
    return presence.activities.some(
      (activity) =>
        activity.applicationId === LEAGUE_CLIENT_ID &&
        activity.type === ActivityType.Playing,
    );
  }

  /**
   * Handle the start of a League of Legends game
   */
  private async handleGameStart(userId: string): Promise<void> {
    try {
      const user = await this.userService.getUser(userId);
      if (!user) {
        return; // User not registered in PikaGacha
      }

      // Record game start time
      await this.userService.updateUser(userId, {
        leagueGameStart: Date.now(),
      });

      logger.info(`User ${userId} started a League game`);
    } catch (error) {
      logger.error('Error handling game start:', error);
    }
  }

  /**
   * Handle the end of a League of Legends game
   */
  private async handleGameEnd(userId: string): Promise<void> {
    try {
      const user = await this.userService.getUser(userId);
      if (!user || !user.leagueGameStart) {
        return; // User not registered or no game start time recorded
      }

      // Calculate game duration
      const gameEndTime = Date.now();
      const gameDuration = gameEndTime - user.leagueGameStart;
      const gameMinutes = Math.floor(gameDuration / 60000);

      // Check if game was at least 15 minutes
      if (gameDuration >= MIN_GAME_DURATION_MS) {
        // Award pikapoints
        await this.userService.adjustPoints(userId, LEAGUE_REWARD_POINTS);

        logger.info(
          `[LeagueService] User ${userId} completed a ${gameMinutes}min League game and earned ${LEAGUE_REWARD_POINTS} pikapoints`,
        );

        // Log to Discord channel
        await this.logRewardToChannel(
          userId,
          LEAGUE_REWARD_POINTS,
          gameMinutes,
        );
      } else {
        logger.info(
          `[LeagueService] User ${userId}'s League game was too short (${gameMinutes}min)`,
        );
      }

      // Clear game start time
      await this.userService.updateUser(userId, {
        leagueGameStart: null,
      });
    } catch (error) {
      logger.error('Error handling game end:', error);
    }
  }

  /**
   * Log reward to Discord channel
   */
  private async logRewardToChannel(
    userId: string,
    points: number,
    minutes: number,
  ): Promise<void> {
    if (!REWARD_LOG_CHANNEL_ID || !this.client) return;

    try {
      const channel = await this.client.channels.fetch(REWARD_LOG_CHANNEL_ID);
      if (!channel || !channel.isTextBased()) return;

      const user = await this.client.users.fetch(userId);
      const userName = user.tag;

      const embed = new EmbedBuilder()
        .setTitle('💰 Points Earned')
        .setDescription(
          `**${userName}** earned **${points} pikapoints**\n` +
            `Activity: 🎮 League of Legends\n` +
            `Duration: ${minutes} minute${minutes !== 1 ? 's' : ''}`,
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await (channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      logger.error('Error logging reward to channel:', error);
    }
  }

  /**
   * Manual method to award League points (for testing or admin commands)
   */
  public async awardLeaguePoints(userId: string): Promise<boolean> {
    try {
      const user = await this.userService.getUser(userId);
      if (!user) {
        return false;
      }

      await this.userService.adjustPoints(userId, LEAGUE_REWARD_POINTS);
      logger.info(
        `[LeagueService] Manually awarded ${LEAGUE_REWARD_POINTS} pikapoints to ${userId}`,
      );
      return true;
    } catch (error) {
      logger.error('[LeagueService] Error awarding League points:', error);
      return false;
    }
  }
}
