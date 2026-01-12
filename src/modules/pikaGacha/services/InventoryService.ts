import { Inventory, Pokemon, Favorite } from '../models';
import { Op } from 'sequelize';
import { Region } from '../types';
import Logger from '../../../utils/logger';

export interface PokemonWithCount {
  pokemon: Pokemon;
  count: number;
}

export class InventoryService {
  /**
   * Add pokemon to user's inventory
   */
  async addPokemon(userId: string, pokemonId: number): Promise<Inventory> {
    const inventory = await Inventory.create({
      userId,
      pokemonId,
    });

    Logger.debug(`Added pokemon ${pokemonId} to user ${userId}'s inventory`);
    return inventory;
  }

  /**
   * Remove one pokemon from inventory
   */
  async removePokemon(userId: string, pokemonId: number): Promise<boolean> {
    const entry = await Inventory.findOne({
      where: { userId, pokemonId },
    });

    if (!entry) {
      return false;
    }

    await entry.destroy();
    Logger.debug(
      `Removed pokemon ${pokemonId} from user ${userId}'s inventory`,
    );
    return true;
  }

  /**
   * Remove multiple pokemon from inventory
   */
  async removePokemonBulk(
    userId: string,
    pokemonId: number,
    count: number,
  ): Promise<number> {
    const entries = await Inventory.findAll({
      where: { userId, pokemonId },
      limit: count,
    });

    for (const entry of entries) {
      await entry.destroy();
    }

    Logger.debug(
      `Removed ${entries.length} of pokemon ${pokemonId} from user ${userId}'s inventory`,
    );
    return entries.length;
  }

  /**
   * Get count of specific pokemon
   */
  async getPokemonCount(userId: string, pokemonId: number): Promise<number> {
    return await Inventory.count({
      where: { userId, pokemonId },
    });
  }

  /**
   * Check if user has pokemon
   */
  async hasPokemon(userId: string, pokemonId: number): Promise<boolean> {
    const count = await this.getPokemonCount(userId, pokemonId);
    return count > 0;
  }

  /**
   * Get user's full inventory
   */
  async getInventory(
    userId: string,
    region: Region | null = null,
  ): Promise<Inventory[]> {
    const where: any = { userId };

    const include: any = [
      {
        model: Pokemon,
        as: 'pokemon',
        required: true,
      },
    ];

    if (region) {
      include[0].where = {
        id: {
          [Op.between]: [region.min, region.max],
        },
      };
    }

    return await Inventory.findAll({
      where,
      include,
      order: [['pokemonId', 'ASC']],
    });
  }

  /**
   * Get inventory grouped by pokemon with counts
   */
  async getInventoryWithCounts(
    userId: string,
    region: Region | null = null,
  ): Promise<PokemonWithCount[]> {
    const inventory = await this.getInventory(userId, region);

    // Group by pokemon ID
    const grouped = new Map<number, { pokemon: Pokemon; count: number }>();

    for (const item of inventory) {
      const pokemon = (item as any).pokemon as Pokemon;
      if (!pokemon) continue;

      if (grouped.has(pokemon.id)) {
        grouped.get(pokemon.id)!.count++;
      } else {
        grouped.set(pokemon.id, { pokemon, count: 1 });
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Get box page (for display)
   */
  async getBoxPage(
    userId: string,
    page: number = 1,
    pageSize: number = 32,
  ): Promise<{
    items: Inventory[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Inventory.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Pokemon,
          as: 'pokemon',
          required: true,
        },
      ],
      order: [['pokemonId', 'ASC']],
      limit: pageSize,
      offset,
    });

    return {
      items: rows,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    };
  }

  /**
   * Get pokemon list (unique pokemon with rarities)
   */
  async getPokemonList(
    userId: string,
    region: Region | null = null,
  ): Promise<PokemonWithCount[]> {
    return await this.getInventoryWithCounts(userId, region);
  }

  /**
   * Release all pokemon of a specific rarity in a region
   */
  async releaseByRarity(
    userId: string,
    rarity: number,
    region: Region | null = null,
  ): Promise<number> {
    const where: any = { userId };

    const include: any = [
      {
        model: Pokemon,
        as: 'pokemon',
        required: true,
        where: { rarity },
      },
    ];

    if (region) {
      include[0].where.id = {
        [Op.between]: [region.min, region.max],
      };
    }

    const entries = await Inventory.findAll({ where, include });

    for (const entry of entries) {
      await entry.destroy();
    }

    Logger.info(
      `User ${userId} released ${entries.length} pokemon of rarity ${rarity}`,
    );
    return entries.length;
  }

  /**
   * Release duplicates of a specific rarity (keep one of each)
   */
  async releaseDuplicates(
    userId: string,
    rarity: number,
    region: Region | null = null,
  ): Promise<number> {
    const grouped = await this.getInventoryWithCounts(userId, region);

    let released = 0;
    for (const { pokemon, count } of grouped) {
      if (pokemon.rarity === rarity && count > 1) {
        const toRemove = count - 1;
        await this.removePokemonBulk(userId, pokemon.id, toRemove);
        released += toRemove;
      }
    }

    Logger.info(
      `User ${userId} released ${released} duplicate pokemon of rarity ${rarity}`,
    );
    return released;
  }

  /**
   * Release all copies of a specific pokemon
   */
  async releaseAllOfPokemon(
    userId: string,
    pokemonId: number,
  ): Promise<number> {
    const count = await this.getPokemonCount(userId, pokemonId);
    await this.removePokemonBulk(userId, pokemonId, count);

    Logger.info(`User ${userId} released all ${count} of pokemon ${pokemonId}`);
    return count;
  }

  /**
   * Release duplicates of a specific pokemon (keep one)
   */
  async releaseDupesOfPokemon(
    userId: string,
    pokemonId: number,
  ): Promise<number> {
    const count = await this.getPokemonCount(userId, pokemonId);
    if (count <= 1) return 0;

    const toRemove = count - 1;
    await this.removePokemonBulk(userId, pokemonId, toRemove);

    Logger.info(
      `User ${userId} released ${toRemove} duplicates of pokemon ${pokemonId}`,
    );
    return toRemove;
  }

  /**
   * Get total pokemon count
   */
  async getTotalPokemonCount(userId: string): Promise<number> {
    return await Inventory.count({ where: { userId } });
  }

  /**
   * Get unique pokemon count
   */
  async getUniquePokemonCount(userId: string): Promise<number> {
    const inventory = await this.getInventoryWithCounts(userId);
    return inventory.length;
  }

  /**
   * Add pokemon to favorites
   */
  async addFavorite(userId: string, pokemonId: number): Promise<Favorite> {
    const [favorite, created] = await Favorite.findOrCreate({
      where: { userId, pokemonId },
    });

    if (created) {
      Logger.debug(`User ${userId} favorited pokemon ${pokemonId}`);
    }

    return favorite;
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: string, pokemonId: number): Promise<boolean> {
    const existing = await Favorite.findOne({ where: { userId, pokemonId } });

    if (existing) {
      await existing.destroy();
      Logger.debug(`User ${userId} unfavorited pokemon ${pokemonId}`);
      return false; // Removed from favorites
    } else {
      await Favorite.create({ userId, pokemonId });
      Logger.debug(`User ${userId} favorited pokemon ${pokemonId}`);
      return true; // Added to favorites
    }
  }

  /**
   * Remove pokemon from favorites
   */
  async removeFavorite(userId: string, pokemonId: number): Promise<boolean> {
    const deleted = await Favorite.destroy({
      where: { userId, pokemonId },
    });

    if (deleted > 0) {
      Logger.debug(`User ${userId} unfavorited pokemon ${pokemonId}`);
      return true;
    }

    return false;
  }

  /**
   * Remove all favorites
   */
  async removeAllFavorites(userId: string): Promise<number> {
    const deleted = await Favorite.destroy({
      where: { userId },
    });

    Logger.info(`User ${userId} removed all ${deleted} favorites`);
    return deleted;
  }

  /**
   * Get user's favorites with pokemon details
   */
  async getFavorites(
    userId: string,
  ): Promise<Array<{ pokemonId: number; name: string; rarity: number }>> {
    const favorites = await Favorite.findAll({
      where: { userId },
      include: [
        {
          model: Pokemon,
          as: 'pokemon',
          required: true,
        },
      ],
      order: [['pokemonId', 'ASC']],
    });

    return favorites.map((fav) => {
      const pokemon = (fav as any).pokemon;
      return {
        pokemonId: fav.pokemonId,
        name: pokemon.name,
        rarity: pokemon.rarity,
      };
    });
  }

  /**
   * Check if pokemon is favorited
   */
  async isFavorite(userId: string, pokemonId: number): Promise<boolean> {
    const count = await Favorite.count({
      where: { userId, pokemonId },
    });
    return count > 0;
  }
}

export default new InventoryService();
