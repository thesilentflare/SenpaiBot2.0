import { Trainer } from '../models';
import { RANKS } from '../types';
import Logger from '../../../utils/logger';

export class TrainerService {
  /**
   * Register a new trainer or update name
   */
  async register(
    userId: string,
    name: string,
  ): Promise<{
    status: 'created' | 'updated' | 'unchanged' | 'taken';
    trainer: Trainer | null;
  }> {
    // Check if name is taken by someone else
    const existing = await Trainer.findOne({ where: { name } });
    if (existing && existing.userId !== userId) {
      return { status: 'taken', trainer: null };
    }

    // Get or create trainer
    const [trainer, created] = await Trainer.findOrCreate({
      where: { userId },
      defaults: { userId, name },
    });

    if (created) {
      Logger.info(`New trainer registered: ${name} (${userId})`);
      return { status: 'created', trainer };
    }

    // Check if name is same
    if (trainer.name === name) {
      return { status: 'unchanged', trainer };
    }

    // Update name
    trainer.name = name;
    await trainer.save();
    Logger.info(`Trainer ${userId} changed name to ${name}`);
    return { status: 'updated', trainer };
  }

  /**
   * Get trainer by userId
   */
  async getTrainer(userId: string): Promise<Trainer | null> {
    return await Trainer.findByPk(userId);
  }

  /**
   * Get trainer by name
   */
  async getTrainerByName(name: string): Promise<Trainer | null> {
    return await Trainer.findOne({ where: { name } });
  }

  /**
   * Get all trainers
   */
  async getAllTrainers(): Promise<Trainer[]> {
    return await Trainer.findAll({
      order: [['totalExp', 'DESC']],
    });
  }

  /**
   * Increment a stat
   */
  async incrementStat(
    userId: string,
    stat: keyof Omit<
      Trainer,
      'userId' | 'name' | 'rank' | 'team' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<void> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) return; // Trainer not registered yet

    (trainer[stat] as number)++;
    await trainer.save();
  }

  /**
   * Update experience and check for promotion
   */
  async updateExp(userId: string, exp: number): Promise<string | null> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) return null;

    trainer.totalExp += exp;
    trainer.rankExp += exp;
    await trainer.save();

    // Check for promotion
    return await this.checkPromotion(userId);
  }

  /**
   * Check if trainer should be promoted
   */
  async checkPromotion(userId: string): Promise<string | null> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer || !trainer.rank) return null;

    const nextRank = this.getNextRank(trainer.rank);
    if (!nextRank) return null; // Already at max rank

    if (trainer.rankExp >= nextRank.expRequired) {
      const oldRank = trainer.rank;
      trainer.rank = nextRank.name;
      trainer.rankExp = 0; // Reset rank exp
      await trainer.save();

      Logger.info(
        `Trainer ${userId} promoted from ${oldRank} to ${nextRank.name}`,
      );
      return `Congratulations! You've been promoted to ${nextRank.name}!`;
    }

    return null;
  }

  /**
   * Get next rank
   */
  getNextRank(
    currentRank: string,
  ): { name: string; expRequired: number } | null {
    const currentIndex = RANKS.findIndex((r) => r.name === currentRank);
    if (currentIndex === -1 || currentIndex === RANKS.length - 1) {
      return null;
    }
    return RANKS[currentIndex + 1];
  }

  /**
   * Get exp required for next rank
   */
  async getExpUntilPromotion(userId: string): Promise<number | null> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer || !trainer.rank) return null;

    const nextRank = this.getNextRank(trainer.rank);
    if (!nextRank) return null;

    return Math.max(0, nextRank.expRequired - trainer.rankExp);
  }

  /**
   * Set trainer team
   */
  async setTeam(userId: string, team: string): Promise<void> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) return;

    const oldTeam = trainer.team;
    trainer.team = team;

    // Reset rank and exp when switching teams
    if (oldTeam !== '' && oldTeam !== team) {
      trainer.rank = RANKS[0].name;
      trainer.rankExp = 0;
      Logger.info(
        `Trainer ${userId} switched from ${oldTeam} to ${team}, rank reset`,
      );
    }

    await trainer.save();
  }

  /**
   * Get trainers by team
   */
  async getTeamMembers(team: string): Promise<Trainer[]> {
    return await Trainer.findAll({
      where: { team },
      order: [['totalExp', 'DESC']],
    });
  }

  /**
   * Prestige (reset rank but increment prestige)
   */
  async prestige(userId: string): Promise<void> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) return;

    trainer.prestige++;
    trainer.rank = RANKS[0].name;
    trainer.rankExp = 0;
    await trainer.save();

    Logger.info(`Trainer ${userId} prestiged to level ${trainer.prestige}`);
  }
  /**
   * Get top trainers by a specific stat
   */
  async getTopTrainers(field: string, limit: number = 10): Promise<Trainer[]> {
    return await Trainer.findAll({
      order: [[field, 'DESC']],
      limit,
    });
  }

  /**
   * Get trainer by userId (alias for backwards compatibility)
   */
  async getTrainerByUserId(userId: string): Promise<Trainer | null> {
    return await this.getTrainer(userId);
  }

  /**
   * Update trainer with partial data
   */
  async updateTrainer(
    userId: string,
    data: Partial<{
      name: string;
      rank: string;
      team: string;
      totalExp: number;
      rankExp: number;
      prestige: number;
      rolls: number;
      bricks: number;
      jackpots: number;
      opens: number;
      releases: number;
      trades: number;
      quizAnswered: number;
      hotStreaks: number;
      shutdowns: number;
      highestStreak: number;
      currentStreak: number;
      battles: number;
      wins: number;
      losses: number;
      underdogWins: number;
      highStakeWins: number;
      neverLuckyLosses: number;
      highStakeLosses: number;
    }>,
  ): Promise<Trainer | null> {
    const trainer = await Trainer.findByPk(userId);
    if (!trainer) {
      return null;
    }

    await trainer.update(data);
    return trainer;
  }

  /**
   * Singleton instance
   */
  private static instance: TrainerService;

  static getInstance(): TrainerService {
    if (!TrainerService.instance) {
      TrainerService.instance = new TrainerService();
    }
    return TrainerService.instance;
  }
}

export default new TrainerService();
