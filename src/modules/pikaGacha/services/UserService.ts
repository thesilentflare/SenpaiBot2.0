import { User } from '../models';
import Logger from '../../../utils/logger';

export class UserService {
  /**
   * Get user's pikapoints balance
   */
  async getPikapoints(userId: string): Promise<number> {
    const user = await User.findByPk(userId);
    return user?.points ?? 0;
  }

  /**
   * Get user's savings balance
   */
  async getSavings(userId: string): Promise<number> {
    const user = await User.findByPk(userId);
    return user?.savings ?? 0;
  }

  /**
   * Get or create user
   */
  async getOrCreateUser(userId: string): Promise<User> {
    const [user] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        id: userId,
        points: 0,
        savings: 0,
        three: 540,
        four: 420,
        five: 30,
        focus: 10,
      },
    });
    return user;
  }

  /**
   * Adjust user's pikapoints
   */
  async adjustPoints(userId: string, amount: number): Promise<number> {
    const user = await this.getOrCreateUser(userId);
    user.points += amount;
    await user.save();

    Logger.debug(
      `Adjusted ${amount} pikapoints for user ${userId}, new balance: ${user.points}`,
    );
    return user.points;
  }

  /**
   * Adjust user's savings
   */
  async adjustSavings(userId: string, amount: number): Promise<number> {
    const user = await this.getOrCreateUser(userId);
    user.savings += amount;
    await user.save();

    Logger.debug(
      `Adjusted ${amount} savings for user ${userId}, new balance: ${user.savings}`,
    );
    return user.savings;
  }

  /**
   * Get user's pity rates
   */
  async getPityRates(userId: string): Promise<{
    three: number;
    four: number;
    five: number;
    focus: number;
  }> {
    const user = await this.getOrCreateUser(userId);
    return {
      three: user.three,
      four: user.four,
      five: user.five,
      focus: user.focus,
    };
  }

  /**
   * Get all user details (points + pity)
   */
  async getUserDetails(userId: string): Promise<{
    points: number;
    three: number;
    four: number;
    five: number;
    focus: number;
  }> {
    const user = await this.getOrCreateUser(userId);
    return {
      points: user.points,
      three: user.three,
      four: user.four,
      five: user.five,
      focus: user.focus,
    };
  }

  /**
   * Adjust pity rates based on roll results
   * @param userId - User ID
   * @param gotFive - null = initialize, true = reset (got 5★+), false = increase (didn't get 5★+)
   */
  async adjustPity(
    userId: string,
    gotFive: boolean | null = null,
  ): Promise<User> {
    const user = await this.getOrCreateUser(userId);

    if (gotFive === null) {
      // Initialize/ensure defaults
      user.three = 540;
      user.four = 420;
      user.five = 30;
      user.focus = 10;
    } else if (gotFive === true) {
      // Reset pity (got 5★ or higher)
      user.three = 540;
      user.four = 420;
      user.five = 30;
      user.focus = 10;
      Logger.debug(`Reset pity for user ${userId}`);
    } else {
      // Increase pity (didn't get 5★)
      user.focus += 5;
      user.five += 5;
      user.four -= 5;
      user.three -= 5;
      Logger.debug(
        `Increased pity for user ${userId}: 3★=${user.three} 4★=${user.four} 5★=${user.five} Focus=${user.focus}`,
      );
    }

    await user.save();
    return user;
  }

  /**
   * Deposit pikapoints to savings
   */
  async deposit(
    userId: string,
    amount: number,
  ): Promise<{
    points: number;
    savings: number;
  }> {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    const user = await this.getOrCreateUser(userId);

    if (user.points < amount) {
      throw new Error('Insufficient pikapoints');
    }

    user.points -= amount;
    user.savings += amount;
    await user.save();

    Logger.info(`User ${userId} deposited ${amount} pikapoints`);
    return {
      points: user.points,
      savings: user.savings,
    };
  }

  /**
   * Withdraw pikapoints from savings
   */
  async withdraw(
    userId: string,
    amount: number,
  ): Promise<{
    points: number;
    savings: number;
  }> {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    const user = await this.getOrCreateUser(userId);

    if (user.savings < amount) {
      throw new Error('Insufficient savings');
    }

    user.savings -= amount;
    user.points += amount;
    await user.save();

    Logger.info(`User ${userId} withdrew ${amount} pikapoints`);
    return {
      points: user.points,
      savings: user.savings,
    };
  }

  /**
   * Add pikapoints (for earning from activities)
   */
  async addPikapoints(userId: string, amount: number): Promise<number> {
    return await this.adjustPoints(userId, amount);
  }

  /**
   * Check if user has enough points
   */
  async hasEnoughPoints(
    userId: string,
    amount: number,
    minBalance: number = -100,
  ): Promise<boolean> {
    const user = await this.getOrCreateUser(userId);
    return user.points - amount >= minBalance;
  }

  /**
   * Get user's total wealth (points + savings)
   */
  async getTotalWealth(userId: string): Promise<number> {
    const user = await this.getOrCreateUser(userId);
    return user.points + user.savings;
  }
}

export default new UserService();
