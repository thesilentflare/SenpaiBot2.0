import { Item } from '../models';
import pokemonService from './PokemonService';
import inventoryService from './InventoryService';
import userService from './UserService';
import rankService from './RankService';
import { BALL_TYPES, BallType } from '../types';
import Logger from '../../../utils/logger';

export class ItemService {
  /**
   * Add item(s) to user's inventory
   */
  async addItem(
    userId: string,
    itemType: number,
    quantity: number = 1,
  ): Promise<void> {
    const [item] = await Item.findOrCreate({
      where: { userId, itemType },
      defaults: { userId, itemType, quantity: 0 },
    });

    item.quantity += quantity;
    await item.save();

    Logger.debug(
      `Added ${quantity}× ${this.getItemName(itemType)} to user ${userId}`,
    );
  }

  /**
   * Remove item(s) from user's inventory
   */
  async removeItem(
    userId: string,
    itemType: number,
    quantity: number = 1,
  ): Promise<boolean> {
    const item = await Item.findOne({
      where: { userId, itemType },
    });

    if (!item || item.quantity < quantity) {
      return false;
    }

    item.quantity -= quantity;

    if (item.quantity === 0) {
      await item.destroy();
    } else {
      await item.save();
    }

    Logger.debug(
      `Removed ${quantity}× ${this.getItemName(itemType)} from user ${userId}`,
    );
    return true;
  }

  /**
   * Get user's bag (all items)
   */
  async getBag(
    userId: string,
  ): Promise<Array<{ itemType: number; quantity: number; name: string }>> {
    const items = await Item.findAll({
      where: { userId },
      order: [['itemType', 'ASC']],
    });

    return items.map((item) => ({
      itemType: item.itemType,
      quantity: item.quantity,
      name: this.getItemName(item.itemType),
    }));
  }

  /**
   * Check if user has item
   */
  async hasItem(
    userId: string,
    itemType: number,
    quantity: number = 1,
  ): Promise<boolean> {
    const item = await Item.findOne({
      where: { userId, itemType },
    });

    return item ? item.quantity >= quantity : false;
  }

  /**
   * Get item quantity
   */
  async getItemQuantity(userId: string, itemType: number): Promise<number> {
    const item = await Item.findOne({
      where: { userId, itemType },
    });

    return item?.quantity || 0;
  }

  /**
   * Open a ball (50% points, 50% pokemon)
   */
  async openBall(
    userId: string,
    ballType: number,
  ): Promise<{
    type: 'points' | 'pokemon';
    value: number | { id: number; name: string; rarity: number };
  }> {
    // Check if user has the ball
    const hasIt = await this.hasItem(userId, ballType);
    if (!hasIt) {
      throw new Error('You do not have that item');
    }

    // Remove the ball
    await this.removeItem(userId, ballType);

    const ball = BALL_TYPES[ballType];
    if (!ball) {
      throw new Error('Invalid ball type');
    }

    // 50/50 chance for points or pokemon
    const option = Math.random() < 0.5 ? 'points' : 'pokemon';

    if (option === 'points') {
      // Award random points in range
      const points = Math.floor(
        Math.random() * (ball.pointsRange[1] - ball.pointsRange[0] + 1) +
          ball.pointsRange[0],
      );

      await userService.adjustPoints(userId, points);

      Logger.info(
        `User ${userId} opened ${ball.displayName} and got ${points} points`,
      );

      return {
        type: 'points',
        value: points,
      };
    } else {
      // Award pokemon based on ball rates
      const rarity = this.determineBallRarity(ball.rollRates);
      const options = await pokemonService.getRollOptions(rarity);

      // For ultra/master balls opening legendary+, add special pokemon
      if (rarity >= 6) {
        const specials = await pokemonService.getActiveSpecialPokemon();
        options.push(...specials);
      }

      const pokemon = pokemonService.getRandomPokemon(options);
      await inventoryService.addPokemon(userId, pokemon.id);

      // Award EXP for opening ball
      await rankService.addExp(userId, 1);

      Logger.info(
        `User ${userId} opened ${ball.displayName} and got ${pokemon.name} (${pokemon.rarity}★)`,
      );

      return {
        type: 'pokemon',
        value: {
          id: pokemon.id,
          name: pokemon.name,
          rarity: pokemon.rarity,
        },
      };
    }
  }

  /**
   * Open all balls of a type
   */
  async openAllBalls(
    userId: string,
    ballType: number,
  ): Promise<
    Array<{
      type: 'points' | 'pokemon';
      value: number | { id: number; name: string; rarity: number };
    }>
  > {
    const quantity = await this.getItemQuantity(userId, ballType);

    if (quantity === 0) {
      throw new Error('You do not have any of that item');
    }

    const results = [];
    for (let i = 0; i < quantity; i++) {
      const result = await this.openBall(userId, ballType);
      results.push(result);
    }

    return results;
  }

  /**
   * Determine rarity from ball roll rates
   */
  private determineBallRarity(rates: { [rarity: number]: number }): number {
    const roll = Math.floor(Math.random() * 100) + 1;
    let cumulative = 0;

    // Sort by rarity ascending to check lower rarities first
    const sortedRarities = Object.keys(rates)
      .map(Number)
      .sort((a, b) => a - b);

    for (const rarity of sortedRarities) {
      cumulative += rates[rarity];
      if (roll <= cumulative) {
        return rarity;
      }
    }

    // Fallback to highest rarity
    return Math.max(...sortedRarities);
  }

  /**
   * Get item name
   */
  private getItemName(itemType: number): string {
    const ball = BALL_TYPES[itemType];
    return ball?.displayName || 'Unknown Item';
  }

  /**
   * Get total items count
   */
  async getTotalItemsCount(userId: string): Promise<number> {
    const items = await Item.findAll({ where: { userId } });
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export default new ItemService();
