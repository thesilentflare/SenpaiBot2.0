import { Jackpot } from '../models';
import userService from './UserService';
import itemService from './ItemService';
import trainerService from './TrainerService';
import Logger from '../../../utils/logger';

export interface JackpotPayout {
  userId: string;
  points: number;
  ballId: number;
  ballName: string;
}

export class JackpotService {
  /**
   * Add points to user's jackpot contribution
   */
  async contribute(userId: string, amount: number): Promise<void> {
    const [jackpot] = await Jackpot.findOrCreate({
      where: { userId },
      defaults: { userId, contribution: 0 },
    });

    jackpot.contribution += amount;
    await jackpot.save();

    Logger.debug(
      `User ${userId} contributed ${amount} to jackpot, total: ${jackpot.contribution}`,
    );
  }

  /**
   * Get total jackpot pool
   */
  async getTotalJackpot(): Promise<number> {
    const contributions = await Jackpot.findAll();
    return contributions.reduce((sum, j) => sum + j.contribution, 0);
  }

  /**
   * Get all contributors
   */
  async getContributors(): Promise<
    Array<{ userId: string; contribution: number }>
  > {
    const contributions = await Jackpot.findAll({
      order: [['contribution', 'DESC']],
    });

    return contributions.map((j) => ({
      userId: j.userId,
      contribution: j.contribution,
    }));
  }

  /**
   * Get users eligible for rewards (contributed at least 3 points)
   */
  async getEligibleUsers(): Promise<
    Array<{ userId: string; contribution: number }>
  > {
    const contributors = await this.getContributors();
    return contributors.filter((c) => c.contribution >= 3);
  }

  /**
   * Process jackpot payout
   * @param rarity - The rarity that triggered the jackpot (6=Legendary, 7=Mythic, 8=Special)
   */
  async processPayout(rarity: number): Promise<{
    eligible: JackpotPayout[];
    total: number;
    multiplier: number;
  }> {
    const totalJackpot = await this.getTotalJackpot();
    const eligible = await this.getEligibleUsers();

    if (eligible.length === 0) {
      Logger.info(
        `Jackpot triggered but no eligible contributors (total: ${totalJackpot})`,
      );
      return {
        eligible: [],
        total: totalJackpot,
        multiplier: 1,
      };
    }

    // Determine multiplier
    let multiplier = 1;
    if (rarity === 7) {
      multiplier = 2; // Mythic doubles jackpot
    }

    const adjustedJackpot = totalJackpot * multiplier;
    const payoutPerUser = Math.floor(adjustedJackpot / eligible.length);

    const payouts: JackpotPayout[] = [];

    for (const contributor of eligible) {
      // Determine ball reward based on jackpot size
      const ballResult = this.determineBall(totalJackpot, rarity);

      // Give points
      await userService.adjustPoints(contributor.userId, payoutPerUser);

      // Give ball
      await itemService.addItem(contributor.userId, ballResult.id, 1);

      // Update stats
      await trainerService.incrementStat(contributor.userId, 'jackpots');

      payouts.push({
        userId: contributor.userId,
        points: payoutPerUser,
        ballId: ballResult.id,
        ballName: ballResult.name,
      });

      Logger.debug(
        `Jackpot payout to ${contributor.userId}: ${payoutPerUser} points + ${ballResult.name}`,
      );
    }

    // Reset jackpot
    await this.reset();

    Logger.info(
      `Processed ${rarity}★ jackpot: ${totalJackpot} × ${multiplier} = ${adjustedJackpot} split among ${eligible.length} users`,
    );

    return {
      eligible: payouts,
      total: adjustedJackpot,
      multiplier,
    };
  }

  /**
   * Determine which ball to award based on jackpot size
   */
  private determineBall(
    jackpot: number,
    rarity: number,
  ): { id: number; name: string } {
    const roll = Math.floor(Math.random() * 10000) + 1;

    const masterChance = Math.min(jackpot, 1000);
    const ultraChance = masterChance * 3;
    const greatChance = masterChance * 6;

    let ballId: number;
    let ballName: string;

    if (roll <= masterChance) {
      ballId = 4;
      ballName = 'Master Ball';
    } else if (roll <= masterChance + ultraChance) {
      ballId = 3;
      ballName = 'Ultra Ball';
    } else if (roll <= masterChance + ultraChance + greatChance) {
      ballId = 2;
      ballName = 'Great Ball';
    } else {
      ballId = 1;
      ballName = 'Poké Ball';
    }

    // Special pokemon guarantee at least Ultra Ball
    if (rarity === 8 && ballId < 3) {
      ballId = 3;
      ballName = 'Ultra Ball';
    }

    return { id: ballId, name: ballName };
  }

  /**
   * Reset jackpot (clear all contributions)
   */
  async reset(): Promise<void> {
    await Jackpot.destroy({ where: {} });
    Logger.info('Jackpot reset');
  }

  /**
   * Get user's contribution
   */
  async getUserContribution(userId: string): Promise<number> {
    const jackpot = await Jackpot.findOne({ where: { userId } });
    return jackpot?.contribution || 0;
  }

  /**
   * Check if user is eligible for rewards
   */
  async isEligible(userId: string): Promise<boolean> {
    const contribution = await this.getUserContribution(userId);
    return contribution >= 3;
  }
}

export default new JackpotService();
