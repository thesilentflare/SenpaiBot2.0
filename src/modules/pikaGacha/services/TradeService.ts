import { sequelize } from '../config/database';
import pokemonService from './PokemonService';
import inventoryService from './InventoryService';
import userService from './UserService';
import trainerService from './TrainerService';
import Logger from '../../../utils/logger';

export class TradeService {
  /**
   * Perform a pokemon trade between two users
   */
  async trade(
    user1Id: string,
    user2Id: string,
    pokemon1Id: number,
    pokemon2Id: number,
  ): Promise<{
    user1NewBalance: number;
    user2NewBalance: number;
    cost: number;
  }> {
    // Validate users are different
    if (user1Id === user2Id) {
      throw new Error('Cannot trade with yourself');
    }

    // Get both pokemon
    const pokemon1 = await pokemonService.getPokemonById(pokemon1Id);
    const pokemon2 = await pokemonService.getPokemonById(pokemon2Id);

    if (!pokemon1 || !pokemon2) {
      throw new Error('Invalid pokemon');
    }

    // Check rarities match
    if (pokemon1.rarity !== pokemon2.rarity) {
      throw new Error('Pokemon rarities must match');
    }

    // Check both users have the pokemon
    const user1Has = await inventoryService.hasPokemon(user1Id, pokemon1Id);
    const user2Has = await inventoryService.hasPokemon(user2Id, pokemon2Id);

    if (!user1Has) {
      throw new Error('User 1 does not have that pokemon');
    }

    if (!user2Has) {
      throw new Error('User 2 does not have that pokemon');
    }

    // Calculate cost (60 × rarity)
    const cost = 60 * pokemon1.rarity;

    // Check both users have enough points (allow negative up to -100)
    const user1Balance = await userService.getPikapoints(user1Id);
    const user2Balance = await userService.getPikapoints(user2Id);

    if (user1Balance - cost < -100) {
      throw new Error('User 1 does not have enough pikapoints');
    }

    if (user2Balance - cost < -100) {
      throw new Error('User 2 does not have enough pikapoints');
    }

    // Perform trade in transaction
    const result = await sequelize.transaction(async (_t) => {
      // Deduct points from both users
      await userService.adjustPoints(user1Id, -cost);
      await userService.adjustPoints(user2Id, -cost);

      // Remove pokemon from inventories
      await inventoryService.removePokemon(user1Id, pokemon1Id);
      await inventoryService.removePokemon(user2Id, pokemon2Id);

      // Add pokemon to opposite inventories
      await inventoryService.addPokemon(user1Id, pokemon2Id);
      await inventoryService.addPokemon(user2Id, pokemon1Id);

      // Update stats
      await trainerService.incrementStat(user1Id, 'trades');
      await trainerService.incrementStat(user2Id, 'trades');

      const user1NewBalance = await userService.getPikapoints(user1Id);
      const user2NewBalance = await userService.getPikapoints(user2Id);

      return {
        user1NewBalance,
        user2NewBalance,
        cost,
      };
    });

    Logger.info(
      `Trade completed: User ${user1Id} traded ${pokemon1.name} for User ${user2Id}'s ${pokemon2.name} (cost: ${cost} each)`,
    );

    return result;
  }

  /**
   * Validate trade is possible
   */
  async validateTrade(
    user1Id: string,
    user2Id: string,
    pokemon1Id: number,
    pokemon2Id: number,
  ): Promise<{
    valid: boolean;
    error?: string;
    cost?: number;
  }> {
    try {
      // Validate users are different
      if (user1Id === user2Id) {
        return { valid: false, error: 'Cannot trade with yourself' };
      }

      // Get both pokemon
      const pokemon1 = await pokemonService.getPokemonById(pokemon1Id);
      const pokemon2 = await pokemonService.getPokemonById(pokemon2Id);

      if (!pokemon1 || !pokemon2) {
        return { valid: false, error: 'Invalid pokemon' };
      }

      // Check rarities match
      if (pokemon1.rarity !== pokemon2.rarity) {
        return { valid: false, error: 'Pokemon rarities must match' };
      }

      // Check both users have the pokemon
      const user1Has = await inventoryService.hasPokemon(user1Id, pokemon1Id);
      const user2Has = await inventoryService.hasPokemon(user2Id, pokemon2Id);

      if (!user1Has) {
        return { valid: false, error: 'User 1 does not have that pokemon' };
      }

      if (!user2Has) {
        return { valid: false, error: 'User 2 does not have that pokemon' };
      }

      // Calculate cost
      const cost = 60 * pokemon1.rarity;

      // Check both users have enough points
      const user1Balance = await userService.getPikapoints(user1Id);
      const user2Balance = await userService.getPikapoints(user2Id);

      if (user1Balance - cost < -100) {
        return {
          valid: false,
          error: `User 1 needs ${cost} pikapoints but only has ${user1Balance}`,
          cost,
        };
      }

      if (user2Balance - cost < -100) {
        return {
          valid: false,
          error: `User 2 needs ${cost} pikapoints but only has ${user2Balance}`,
          cost,
        };
      }

      return { valid: true, cost };
    } catch (error) {
      return { valid: false, error: 'Trade validation failed' };
    }
  }

  /**
   * Get trade cost for a rarity
   */
  getTradeCost(rarity: number): number {
    return 60 * rarity;
  }
}

export default new TradeService();
