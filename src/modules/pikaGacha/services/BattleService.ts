import { sequelize } from '../config/database';
import pokemonService from './PokemonService';
import inventoryService from './InventoryService';
import trainerService from './TrainerService';
import rankService from './RankService';
import Logger from '../../../utils/logger';

export interface BattleResult {
  winner: {
    userId: string;
    pokemon: {
      id: number;
      name: string;
      bst: number;
      duplicates: number;
      finalBst: number;
    };
    expGained: number;
  };
  loser: {
    userId: string;
    pokemon: {
      id: number;
      name: string;
      bst: number;
      duplicates: number;
      finalBst: number;
    };
    expGained: number;
  };
  tied: boolean;
}

export class BattleService {
  /**
   * Calculate battle BST with duplicate bonus
   * Each duplicate adds +5 BST
   */
  private async calculateBattleBst(
    userId: string,
    pokemonId: number,
  ): Promise<{
    baseBst: number;
    duplicates: number;
    finalBst: number;
  }> {
    const pokemon = await pokemonService.getPokemonById(pokemonId);
    if (!pokemon) {
      throw new Error('Pokemon not found');
    }

    // Get number of duplicates (total count - 1)
    const count = await inventoryService.getPokemonCount(userId, pokemonId);
    const duplicates = Math.max(0, count - 1);

    // Calculate final BST with duplicate bonus
    const finalBst = pokemon.bst + duplicates * 5;

    return {
      baseBst: pokemon.bst,
      duplicates,
      finalBst,
    };
  }

  /**
   * Generate random experience in range
   */
  private getRandomExp(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Perform a battle between two users
   */
  async battle(
    user1Id: string,
    user2Id: string,
    pokemon1Id: number,
    pokemon2Id: number,
  ): Promise<BattleResult> {
    // Validate users are different
    if (user1Id === user2Id) {
      throw new Error('Cannot battle yourself');
    }

    // Validate both users have the pokemon
    const user1Has = await inventoryService.hasPokemon(user1Id, pokemon1Id);
    const user2Has = await inventoryService.hasPokemon(user2Id, pokemon2Id);

    if (!user1Has) {
      throw new Error('User 1 does not have that pokemon');
    }

    if (!user2Has) {
      throw new Error('User 2 does not have that pokemon');
    }

    // Get pokemon data
    const pokemon1 = await pokemonService.getPokemonById(pokemon1Id);
    const pokemon2 = await pokemonService.getPokemonById(pokemon2Id);

    if (!pokemon1 || !pokemon2) {
      throw new Error('Invalid pokemon');
    }

    // Calculate battle BST for both pokemon
    const user1Stats = await this.calculateBattleBst(user1Id, pokemon1Id);
    const user2Stats = await this.calculateBattleBst(user2Id, pokemon2Id);

    // Determine winner
    let winnerId: string;
    let loserId: string;
    let winnerPokemonId: number;
    let loserPokemonId: number;
    let winnerStats: typeof user1Stats;
    let loserStats: typeof user2Stats;
    let tied = false;

    if (user1Stats.finalBst > user2Stats.finalBst) {
      winnerId = user1Id;
      loserId = user2Id;
      winnerPokemonId = pokemon1Id;
      loserPokemonId = pokemon2Id;
      winnerStats = user1Stats;
      loserStats = user2Stats;
    } else if (user2Stats.finalBst > user1Stats.finalBst) {
      winnerId = user2Id;
      loserId = user1Id;
      winnerPokemonId = pokemon2Id;
      loserPokemonId = pokemon1Id;
      winnerStats = user2Stats;
      loserStats = user1Stats;
    } else {
      // Tie - both get loser exp
      tied = true;
      winnerId = user1Id; // Arbitrary for tied battle
      loserId = user2Id;
      winnerPokemonId = pokemon1Id;
      loserPokemonId = pokemon2Id;
      winnerStats = user1Stats;
      loserStats = user2Stats;
    }

    // Generate experience
    const winnerExp = tied
      ? this.getRandomExp(5, 15)
      : this.getRandomExp(10, 30);
    const loserExp = this.getRandomExp(5, 15);

    // Update stats and exp in transaction
    await sequelize.transaction(async (_t) => {
      // Update experience
      await rankService.addExp(winnerId, winnerExp);
      await rankService.addExp(loserId, loserExp);

      // Update battle stats
      if (!tied) {
        await trainerService.incrementStat(winnerId, 'wins');
        await trainerService.incrementStat(loserId, 'losses');
      } else {
        // For ties, don't increment win/loss
        // But we could track total battles if needed
      }
    });

    const winnerPokemon = winnerId === user1Id ? pokemon1 : pokemon2;
    const loserPokemon = loserId === user1Id ? pokemon1 : pokemon2;

    const result: BattleResult = {
      winner: {
        userId: winnerId,
        pokemon: {
          id: winnerPokemonId,
          name: winnerPokemon.name,
          bst: winnerStats.baseBst,
          duplicates: winnerStats.duplicates,
          finalBst: winnerStats.finalBst,
        },
        expGained: winnerExp,
      },
      loser: {
        userId: loserId,
        pokemon: {
          id: loserPokemonId,
          name: loserPokemon.name,
          bst: loserStats.baseBst,
          duplicates: loserStats.duplicates,
          finalBst: loserStats.finalBst,
        },
        expGained: loserExp,
      },
      tied,
    };

    Logger.info(
      `Battle completed: ${winnerPokemon.name} (${winnerStats.finalBst}) vs ${loserPokemon.name} (${loserStats.finalBst}) - ${
        tied ? 'Tie' : `${winnerPokemon.name} wins`
      }`,
    );

    return result;
  }

  /**
   * Validate battle is possible
   */
  async validateBattle(
    user1Id: string,
    user2Id: string,
    pokemon1Id: number,
    pokemon2Id: number,
  ): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      // Validate users are different
      if (user1Id === user2Id) {
        return { valid: false, error: 'Cannot battle yourself' };
      }

      // Validate both users have the pokemon
      const user1Has = await inventoryService.hasPokemon(user1Id, pokemon1Id);
      const user2Has = await inventoryService.hasPokemon(user2Id, pokemon2Id);

      if (!user1Has) {
        return { valid: false, error: 'User 1 does not have that pokemon' };
      }

      if (!user2Has) {
        return { valid: false, error: 'User 2 does not have that pokemon' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Battle validation failed' };
    }
  }

  /**
   * Get battle preview with BST calculations
   */
  async getBattlePreview(
    user1Id: string,
    user2Id: string,
    pokemon1Id: number,
    pokemon2Id: number,
  ): Promise<{
    user1: {
      pokemon: {
        id: number;
        name: string;
        bst: number;
        duplicates: number;
        finalBst: number;
      };
    };
    user2: {
      pokemon: {
        id: number;
        name: string;
        bst: number;
        duplicates: number;
        finalBst: number;
      };
    };
    prediction: 'user1' | 'user2' | 'tie';
  }> {
    // Validate both users have the pokemon
    const user1Has = await inventoryService.hasPokemon(user1Id, pokemon1Id);
    const user2Has = await inventoryService.hasPokemon(user2Id, pokemon2Id);

    if (!user1Has || !user2Has) {
      throw new Error('One or both users do not have their pokemon');
    }

    // Get pokemon data
    const pokemon1 = await pokemonService.getPokemonById(pokemon1Id);
    const pokemon2 = await pokemonService.getPokemonById(pokemon2Id);

    if (!pokemon1 || !pokemon2) {
      throw new Error('Invalid pokemon');
    }

    // Calculate battle BST
    const user1Stats = await this.calculateBattleBst(user1Id, pokemon1Id);
    const user2Stats = await this.calculateBattleBst(user2Id, pokemon2Id);

    // Determine prediction
    let prediction: 'user1' | 'user2' | 'tie';
    if (user1Stats.finalBst > user2Stats.finalBst) {
      prediction = 'user1';
    } else if (user2Stats.finalBst > user1Stats.finalBst) {
      prediction = 'user2';
    } else {
      prediction = 'tie';
    }

    return {
      user1: {
        pokemon: {
          id: pokemon1Id,
          name: pokemon1.name,
          bst: user1Stats.baseBst,
          duplicates: user1Stats.duplicates,
          finalBst: user1Stats.finalBst,
        },
      },
      user2: {
        pokemon: {
          id: pokemon2Id,
          name: pokemon2.name,
          bst: user2Stats.baseBst,
          duplicates: user2Stats.duplicates,
          finalBst: user2Stats.finalBst,
        },
      },
      prediction,
    };
  }
}

export default new BattleService();
