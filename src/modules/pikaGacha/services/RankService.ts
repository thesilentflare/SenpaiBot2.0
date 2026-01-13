import { Rank } from '../models/Rank';
import { Trainer } from '../models/Trainer';
import Logger from '../../../utils/logger';
import itemService from './ItemService';
import { RANK_DATA, RANK_REWARDS } from '../config/ranks';

const logger = Logger.forModule('RankService');

export class RankService {
  /**
   * Initialize ranks table with seed data
   */
  async initializeRanks(): Promise<void> {
    for (let i = 0; i < RANK_DATA.length; i++) {
      const rankData = RANK_DATA[i];
      await Rank.findOrCreate({
        where: { rank: rankData.rank },
        defaults: {
          id: i + 1,
          rank: rankData.rank,
          expRequired: rankData.expRequired,
        },
      });
    }
    logger.info(`Initialized ${RANK_DATA.length} ranks`);
  }

  /**
   * Get the next rank after the current one
   */
  async getNextRank(currentRank: string): Promise<Rank | null> {
    const current = await Rank.findOne({ where: { rank: currentRank } });
    if (!current) return null;

    return await Rank.findOne({
      where: {
        id: current.id + 1,
      },
    });
  }

  /**
   * Add experience to a trainer
   * Returns true if the trainer leveled up and should be prompted to promote
   */
  async addExp(
    userId: string,
    exp: number,
  ): Promise<{ levelUp: boolean; currentRank: string; nextRank: string | null }> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Update exp
    trainer.totalExp += exp;
    trainer.rankExp += exp;
    await trainer.save();

    // Check if can level up
    const nextRank = await this.getNextRank(trainer.rank);
    if (!nextRank) {
      // Already at max rank
      return { levelUp: false, currentRank: trainer.rank, nextRank: null };
    }

    const canLevelUp = trainer.rankExp >= nextRank.expRequired;

    logger.info(
      `${trainer.name} gained ${exp} EXP (Total: ${trainer.totalExp}, Rank: ${trainer.rankExp}/${nextRank.expRequired})`,
    );

    return {
      levelUp: canLevelUp,
      currentRank: trainer.rank,
      nextRank: canLevelUp ? nextRank.rank : null,
    };
  }

  /**
   * Promote a trainer to the next rank
   * Returns promotion details
   */
  async promote(userId: string): Promise<{
    promoted: boolean;
    message?: string;
    newRank?: string;
    reward?: string;
  }> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) {
      return { promoted: false, message: 'Trainer not found' };
    }

    const currentRank = trainer.rank;

    // Can't promote from max rank
    if (currentRank === 'Boss') {
      return { promoted: false, message: 'Already at max rank. Use !prestige to reset and earn a Master Ball!' };
    }

    const nextRank = await this.getNextRank(currentRank);
    if (!nextRank) {
      return { promoted: false, message: 'No next rank available' };
    }

    // Check if has enough EXP
    if (trainer.rankExp < nextRank.expRequired) {
      return {
        promoted: false,
        message: `Not enough EXP. Need ${nextRank.expRequired - trainer.rankExp} more EXP to reach ${nextRank.rank}.`,
      };
    }

    // Update rank and subtract required EXP
    const oldRank = trainer.rank;
    trainer.rank = nextRank.rank;
    trainer.rankExp -= nextRank.expRequired;
    await trainer.save();

    // Give ball reward if applicable
    const ballReward = RANK_REWARDS[nextRank.rank];
    let rewardText = '';
    if (ballReward) {
      await itemService.addItem(userId, ballReward, 1);
      const ballNames = ['Poké Ball', 'Great Ball', 'Ultra Ball'];
      const ballName = ballNames[ballReward - 1] || 'ball';
      rewardText = `1× ${ballName}`;

      logger.info(`${trainer.name} promoted to ${nextRank.rank} and received a ${ballName}`);
    } else {
      logger.info(`${trainer.name} promoted to ${nextRank.rank}`);
    }

    return {
      promoted: true,
      newRank: nextRank.rank,
      reward: rewardText,
    };
  }

  /**
   * Prestige - Reset rank to Recruit and increase prestige level
   * Gives a Master Ball as reward
   */
  async prestige(userId: string): Promise<{
    prestiged: boolean;
    prestigeLevel: number;
    message?: string;
  }> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) {
      return { prestiged: false, prestigeLevel: 0, message: 'Trainer not found' };
    }

    // Must be at Boss rank to prestige
    if (trainer.rank !== 'Boss') {
      return { prestiged: false, prestigeLevel: trainer.prestige, message: 'Must be Boss rank to prestige' };
    }

    // Increase prestige, reset rank and EXP
    trainer.prestige += 1;
    trainer.rank = 'Recruit';
    trainer.rankExp = 0;
    await trainer.save();

    // Give Master Ball (ID 4)
    await itemService.addItem(userId, 4, 1);

    logger.info(`${trainer.name} reached Prestige Level ${trainer.prestige}`);
    return {
      prestiged: true,
      prestigeLevel: trainer.prestige,
    };
  }

  /**
   * Reset a trainer's EXP (used when switching teams)
   */
  async resetExp(userId: string): Promise<void> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) {
      return;
    }

    trainer.totalExp = 0;
    trainer.rankExp = 0;
    trainer.rank = 'Recruit';
    await trainer.save();

    logger.info(`Reset EXP for ${trainer.name}`);
  }

  /**
   * Get EXP needed for next promotion
   */
  async getExpToNextRank(userId: string): Promise<number | null> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) {
      return null;
    }

    const nextRank = await this.getNextRank(trainer.rank);
    if (!nextRank) {
      return null; // At max rank
    }

    return Math.max(0, nextRank.expRequired - trainer.rankExp);
  }

  /**
   * Check if trainer is eligible for prestige
   */
  async canPrestige(userId: string): Promise<boolean> {
    const trainer = await Trainer.findByPk(userId);
    return trainer?.rank === 'Boss';
  }
}

export default new RankService();
