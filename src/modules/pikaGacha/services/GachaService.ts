import { Pokemon } from '../models';
import userService from './UserService';
import pokemonService from './PokemonService';
import inventoryService from './InventoryService';
import jackpotService from './JackpotService';
import trainerService from './TrainerService';
import {
  Region,
  GACHA_COST,
  JACKPOT_CONTRIBUTION,
  RollResult,
  getRegionById,
} from '../types';
import Logger from '../../../utils/logger';

export class GachaService {
  /**
   * Perform a single roll
   */
  async roll(
    userId: string,
    regionId: number | null = null,
  ): Promise<RollResult> {
    const region = regionId ? getRegionById(regionId) : null;
    // Ensure user exists and get pity
    const details = await userService.getUserDetails(userId);

    // Check if user has enough points
    if (details.points < GACHA_COST) {
      throw new Error('Insufficient pikapoints');
    }

    // Deduct cost
    await userService.adjustPoints(userId, -GACHA_COST);

    // Add to jackpot
    await jackpotService.contribute(userId, JACKPOT_CONTRIBUTION);

    // Determine rarity using pity system
    const rarity = this.determineRarity(details);

    // Get pokemon options for this rarity
    const options = await pokemonService.getRollOptions(rarity, region);

    // For legendary/mythic/special, add special pokemon if available
    if (rarity >= 6) {
      const specials = await pokemonService.getActiveSpecialPokemon();
      options.push(...specials);
    }

    if (options.length === 0) {
      throw new Error(
        `No pokemon available for rarity ${rarity} in selected region`,
      );
    }

    // Pick random pokemon
    const pokemon = pokemonService.getRandomPokemon(options);

    // Add to inventory
    await inventoryService.addPokemon(userId, pokemon.id);

    // Adjust pity
    const gotFive = pokemon.rarity >= 5;
    await userService.adjustPity(userId, gotFive);

    // Update trainer stats
    await trainerService.incrementStat(userId, 'rolls');
    await trainerService.updateExp(userId, 1);

    Logger.info(
      `User ${userId} rolled ${pokemon.name} (${pokemon.rarity}★) in ${region?.name || 'all regions'}`,
    );

    return {
      pokemon: {
        id: pokemon.id,
        name: pokemon.name,
        rarity: pokemon.rarity,
        bst: pokemon.bst,
      },
      rarity: pokemon.rarity,
      isJackpot: pokemon.rarity > 5,
    };
  }

  /**
   * Perform multiple rolls
   */
  async multiRoll(
    userId: string,
    count: number,
    regionId: number | null = null,
  ): Promise<{
    results: RollResult[];
    newBalance: number;
    bricked: boolean;
  }> {
    const totalCost = GACHA_COST * count;
    const details = await userService.getUserDetails(userId);

    if (details.points < totalCost) {
      throw new Error('Insufficient pikapoints');
    }

    const results: RollResult[] = [];
    let bricked = true; // Assume bricked unless we get 6★+

    for (let i = 0; i < count; i++) {
      const result = await this.roll(userId, regionId);
      results.push(result);

      if (result.rarity >= 6) {
        bricked = false;
      }
    }

    // Track brick stat if 50+ rolls
    if (count >= 50 && bricked) {
      await trainerService.incrementStat(userId, 'bricks');
    }

    const newBalance = await userService.getPikapoints(userId);

    Logger.info(`User ${userId} completed ${count} rolls, bricked: ${bricked}`);

    return {
      results,
      newBalance,
      bricked,
    };
  }

  /**
   * Determine rarity based on pity rates
   * Roll range: 0-1003
   * 0 = Mythic (7★)
   * 1001-1003 = Legendary (6★)
   * 1-1000 = Based on pity rates
   */
  private determineRarity(details: {
    three: number;
    four: number;
    five: number;
    focus: number;
  }): number {
    const roll = Math.floor(Math.random() * 1004);

    // Mythic (0.1% - 1/1004)
    if (roll === 0) {
      return 7;
    }

    // Legendary (0.3% - 3/1004)
    if (roll >= 1001 && roll <= 1003) {
      return 6;
    }

    // Normal rolls (1-1000, scaled by 10)
    // Pity rates are stored as integers (540 = 54.0%)
    const normalRoll = Math.floor(Math.random() * 1001);

    if (normalRoll <= details.three) {
      return 3;
    }

    if (normalRoll <= details.three + details.four) {
      return 4;
    }

    if (normalRoll <= details.three + details.four + details.five) {
      return 5;
    }

    // Focus (remaining probability)
    return 5; // Focus pulls are 5★
  }

  /**
   * Calculate cost for multiple rolls
   */
  calculateCost(count: number): number {
    return GACHA_COST * count;
  }

  /**
   * Get max rolls user can afford
   */
  async getMaxRolls(userId: string): Promise<number> {
    const balance = await userService.getPikapoints(userId);
    return Math.floor(balance / GACHA_COST);
  }

  /**
   * Roll all affordable rolls (for fullroll)
   */
  async rollAll(
    userId: string,
    region: Region | null = null,
    reservePoints: number = 0,
  ): Promise<{
    results: RollResult[];
    newBalance: number;
    bricked: boolean;
  }> {
    const balance = await userService.getPikapoints(userId);
    const availablePoints = balance - reservePoints;
    const count = Math.floor(availablePoints / GACHA_COST);

    if (count <= 0) {
      throw new Error('Not enough points to roll');
    }

    return await this.multiRoll(userId, count, region?.id || null);
  }
}

export default new GachaService();
