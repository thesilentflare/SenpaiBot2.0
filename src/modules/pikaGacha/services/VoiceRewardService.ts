import { Client, VoiceState } from 'discord.js';
import { UserService } from './UserService';
import Logger from '../../../utils/logger';
import {
  MIN_VOICE_MEMBERS,
  VOICE_REWARD_INTERVAL_MS,
  VOICE_REWARD_POINTS,
} from '../config/config';

const logger = Logger.forModule('VoiceRewardService');

// Use imported configuration constants
const REWARD_INTERVAL_MS = VOICE_REWARD_INTERVAL_MS;
const REWARD_POINTS = VOICE_REWARD_POINTS;

export class VoiceRewardService {
  private static instance: VoiceRewardService;
  private userService: UserService;
  private rewardInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.userService = UserService.getInstance();
  }

  public static getInstance(): VoiceRewardService {
    if (!VoiceRewardService.instance) {
      VoiceRewardService.instance = new VoiceRewardService();
    }
    return VoiceRewardService.instance;
  }

  /**
   * Initialize voice channel reward tracking
   */
  public initializeVoiceTracking(client: Client): void {
    logger.info(
      `Initializing voice tracking: MIN_MEMBERS=${MIN_VOICE_MEMBERS}, INTERVAL=${REWARD_INTERVAL_MS}ms, POINTS=${REWARD_POINTS}`,
    );

    // Listen for voice state updates
    client.on('voiceStateUpdate', async (oldState, newState) => {
      await this.handleVoiceStateUpdate(oldState, newState);
    });

    // Start periodic reward check (every minute to be responsive)
    this.rewardInterval = setInterval(() => {
      this.checkAndRewardActiveUsers(client);
    }, 60 * 1000); // Check every minute

    logger.info('Voice channel tracking initialized');
  }

  /**
   * Stop voice reward tracking
   */
  public stopVoiceTracking(): void {
    if (this.rewardInterval) {
      clearInterval(this.rewardInterval);
      this.rewardInterval = null;
    }
    logger.info('Voice channel tracking stopped');
  }

  /**
   * Handle voice state changes (join/leave/move)
   */
  private async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    try {
      const userId = newState.id;
      const joinedChannel = !oldState.channel && newState.channel;
      const leftChannel = oldState.channel && !newState.channel;
      const movedChannel =
        oldState.channel &&
        newState.channel &&
        oldState.channel.id !== newState.channel.id;

      const username = newState.member?.user.tag || userId;

      // User joined a voice channel
      if (joinedChannel || movedChannel) {
        const memberCount = newState.channel?.members.size || 0;
        logger.info(
          `User ${username} ${joinedChannel ? 'joined' : 'moved to'} voice channel (${memberCount} members, need ${MIN_VOICE_MEMBERS})`,
        );

        if (memberCount >= MIN_VOICE_MEMBERS) {
          // Valid voice session - record join time
          await this.userService.updateUser(userId, {
            voiceChannelJoinTime: Date.now(),
          });
          logger.info(`Voice tracking started for ${username}`);
        } else {
          // Not enough members - clear join time
          await this.userService.updateUser(userId, {
            voiceChannelJoinTime: null,
          });
          logger.info(
            `Not enough members for ${username} - tracking not started`,
          );
        }
      }

      // User left a voice channel
      if (leftChannel) {
        logger.info(`User ${username} left voice channel`);

        // Award any pending rewards before clearing
        await this.checkAndRewardUser(userId);

        // Clear join time
        await this.userService.updateUser(userId, {
          voiceChannelJoinTime: null,
        });
      }

      // Check if other users in the old/new channel need their timers reset
      if (oldState.channel) {
        await this.updateChannelMembersTimers(
          oldState.channel.id,
          oldState.client,
        );
      }
      if (newState.channel && newState.channel.id !== oldState.channel?.id) {
        await this.updateChannelMembersTimers(
          newState.channel.id,
          newState.client,
        );
      }
    } catch (error) {
      logger.error('Error handling voice state update:', error);
    }
  }

  /**
   * Update timers for all members in a voice channel based on current member count
   */
  private async updateChannelMembersTimers(
    channelId: string,
    client: Client,
  ): Promise<void> {
    try {
      const channel = client.channels.cache.get(channelId);
      if (!channel || !channel.isVoiceBased()) return;

      const memberCount = channel.members.size;
      const now = Date.now();

      logger.debug(
        `Updating timers for ${memberCount} members in channel ${channelId}`,
      );

      for (const [memberId, member] of channel.members) {
        if (member.user.bot) continue; // Skip bots

        const user = await this.userService.getUser(memberId);
        if (!user) {
          logger.debug(`User ${memberId} not registered, skipping`);
          continue;
        }

        if (memberCount >= MIN_VOICE_MEMBERS) {
          // Enough members - set join time if not already set
          if (!user.voiceChannelJoinTime) {
            await this.userService.updateUser(memberId, {
              voiceChannelJoinTime: now,
            });
            logger.info(
              `Voice tracking started for ${member.user.tag} (via channel update)`,
            );
          }
        } else {
          // Not enough members - award pending rewards and clear timer
          await this.checkAndRewardUser(memberId);
          await this.userService.updateUser(memberId, {
            voiceChannelJoinTime: null,
          });
          logger.info(
            `Voice tracking stopped for ${member.user.tag} (not enough members)`,
          );
        }
      }
    } catch (error) {
      logger.error('Error updating channel member timers:', error);
    }
  }

  /**
   * Check and reward all active voice users
   */
  private async checkAndRewardActiveUsers(client: Client): Promise<void> {
    try {
      // Get all voice channels
      for (const [, guild] of client.guilds.cache) {
        for (const [, channel] of guild.channels.cache) {
          if (!channel.isVoiceBased()) continue;

          const memberCount = channel.members.size;
          if (memberCount < MIN_VOICE_MEMBERS) continue;

          // Check each member in the channel
          for (const [memberId, member] of channel.members) {
            if (member.user.bot) continue; // Skip bots
            await this.checkAndRewardUser(memberId);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking active users:', error);
    }
  }

  /**
   * Check if a user is eligible for rewards and award them
   */
  private async checkAndRewardUser(userId: string): Promise<void> {
    try {
      const user = await this.userService.getUser(userId);
      if (!user || !user.voiceChannelJoinTime) return;

      const now = Date.now();
      const timeInVoice = now - user.voiceChannelJoinTime;

      // Check if user has been in voice for at least the reward interval
      if (timeInVoice >= REWARD_INTERVAL_MS) {
        // Calculate how many reward periods have passed
        const periodsEarned = Math.floor(timeInVoice / REWARD_INTERVAL_MS);
        const pointsToAward = periodsEarned * REWARD_POINTS;

        if (pointsToAward > 0) {
          // Award points
          await this.userService.adjustPoints(userId, pointsToAward);

          // Update join time to reflect the awarded periods
          const newJoinTime =
            user.voiceChannelJoinTime + periodsEarned * REWARD_INTERVAL_MS;
          await this.userService.updateUser(userId, {
            voiceChannelJoinTime: newJoinTime,
          });

          logger.info(
            `Awarded ${pointsToAward} points to ${userId} for ${Math.floor(timeInVoice / 60000)} minutes in voice`,
          );
        }
      }
    } catch (error) {
      logger.error('Error checking/rewarding user:', error);
    }
  }

  /**
   * Get voice stats for a user (for admin commands)
   */
  public async getVoiceStats(userId: string): Promise<{
    inVoice: boolean;
    timeInVoice: number;
    nextRewardIn: number;
  } | null> {
    try {
      const user = await this.userService.getUser(userId);
      if (!user) return null;

      if (!user.voiceChannelJoinTime) {
        return {
          inVoice: false,
          timeInVoice: 0,
          nextRewardIn: 0,
        };
      }

      const timeInVoice = Date.now() - user.voiceChannelJoinTime;
      const nextRewardIn =
        REWARD_INTERVAL_MS - (timeInVoice % REWARD_INTERVAL_MS);

      return {
        inVoice: true,
        timeInVoice,
        nextRewardIn,
      };
    } catch (error) {
      logger.error('Error getting voice stats:', error);
      return null;
    }
  }
}
