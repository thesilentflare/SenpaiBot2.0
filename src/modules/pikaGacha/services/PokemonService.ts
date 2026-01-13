import { Pokemon } from '../models';
import { Op } from 'sequelize';
import {
  Region,
  getRegionByName,
  getRegionByPokemonId,
  REGIONS,
} from '../types';
import Logger from '../../../utils/logger';

export class PokemonService {
  /**
   * Get pokemon by ID
   */
  async getPokemonById(pokemonId: number): Promise<Pokemon | null> {
    return await Pokemon.findByPk(pokemonId);
  }

  /**
   * Get pokemon by name (case-insensitive)
   */
  async getPokemonByName(name: string): Promise<Pokemon | null> {
    return await Pokemon.findOne({
      where: {
        name: {
          [Op.like]: name,
        },
      },
    });
  }

  /**
   * Get pokemon by name or ID
   */
  async getPokemon(nameOrId: string | number): Promise<Pokemon | null> {
    if (typeof nameOrId === 'number') {
      return await this.getPokemonById(nameOrId);
    }

    // Try as ID first
    const numId = parseInt(nameOrId, 10);
    if (!isNaN(numId)) {
      const byId = await this.getPokemonById(numId);
      if (byId) return byId;
    }

    // Try as name
    return await this.getPokemonByName(nameOrId);
  }

  /**
   * Get all pokemon in a specific region with a specific rarity
   */
  async getRollOptions(
    rarity: number,
    region: Region | null = null,
  ): Promise<Pokemon[]> {
    const where: any = { rarity };

    if (region) {
      where.id = {
        [Op.between]: [region.min, region.max],
      };
    }

    // Don't include inactive special pokemon
    if (rarity >= 6) {
      where[Op.or] = [{ isSpecial: false }, { isSpecial: true, active: true }];
    }

    return await Pokemon.findAll({ where });
  }

  /**
   * Get focus pokemon for a region
   */
  async getFocusPokemon(region: Region): Promise<Pokemon[]> {
    return await Pokemon.findAll({
      where: {
        focus: true,
        id: {
          [Op.between]: [region.min, region.max],
        },
      },
    });
  }

  /**
   * Get all focus pokemon across all regions
   */
  async getAllFocusPokemon(): Promise<{ [regionName: string]: Pokemon[] }> {
    const result: { [regionName: string]: Pokemon[] } = {};

    for (const region of Object.values(REGIONS)) {
      if (region.id === 0) continue; // Skip special region
      const focus = await this.getFocusPokemon(region);
      result[region.name] = focus;
    }

    return result;
  }

  /**
   * Get all pokemon in a region
   */
  async getRegionPokemon(region: Region): Promise<Pokemon[]> {
    const where: any = {
      id: {
        [Op.between]: [region.min, region.max],
      },
    };

    // For special region, only get active ones
    if (region.id === 0) {
      where.active = true;
    }

    return await Pokemon.findAll({
      where,
      order: [
        ['rarity', 'DESC'],
        ['id', 'ASC'],
      ],
    });
  }

  /**
   * Get all pokemon by rarity in a region
   */
  async getPokemonByRarity(region: Region, rarity: number): Promise<Pokemon[]> {
    return await Pokemon.findAll({
      where: {
        rarity,
        id: {
          [Op.between]: [region.min, region.max],
        },
      },
      order: [['id', 'ASC']],
    });
  }

  /**
   * Set focus pokemon for a region
   */
  async setFocus(pokemonIds: number[], region: Region): Promise<void> {
    // Clear all focus in region
    await Pokemon.update(
      { focus: false },
      {
        where: {
          id: {
            [Op.between]: [region.min, region.max],
          },
        },
      },
    );

    // Set new focus
    await Pokemon.update(
      { focus: true },
      {
        where: {
          id: {
            [Op.in]: pokemonIds,
          },
        },
      },
    );

    Logger.info(
      `Set focus pokemon for ${region.name}: ${pokemonIds.join(', ')}`,
    );
  }

  /**
   * Get active special pokemon
   */
  async getActiveSpecialPokemon(): Promise<Pokemon[]> {
    return await Pokemon.findAll({
      where: {
        isSpecial: true,
        active: true,
      },
    });
  }

  /**
   * Set special pokemon as active/inactive
   */
  async setSpecialActive(pokemonIds: number[], active: boolean): Promise<void> {
    await Pokemon.update(
      { active },
      {
        where: {
          id: {
            [Op.in]: pokemonIds,
          },
          isSpecial: true,
        },
      },
    );

    Logger.info(
      `Set special pokemon ${active ? 'active' : 'inactive'}: ${pokemonIds.join(', ')}`,
    );
  }

  /**
   * Get pokemon region
   */
  getRegion(pokemonId: number): Region | null {
    return getRegionByPokemonId(pokemonId);
  }

  /**
   * Get random pokemon from options
   */
  getRandomPokemon(options: Pokemon[]): Pokemon {
    if (options.length === 0) {
      throw new Error('No pokemon options available');
    }
    const index = Math.floor(Math.random() * options.length);
    return options[index];
  }

  /**
   * Get pokemon sprite URL
   */
  getPokemonSpriteUrl(pokemonId: number): string {
    if (pokemonId >= 10000) {
      // Special pokemon have custom URLs
      const specialUrls: { [id: number]: string } = {
        10000:
          'https://cdn.bulbagarden.net/upload/a/aa/Flying_Pikachu_Dash.png',
        10001: 'https://www.serebii.net/sunmoon/pokemon/384-m.png',
        10002: 'https://www.serebii.net/sunmoon/pokemon/382-p.png',
        10003: 'https://www.serebii.net/sunmoon/pokemon/383-p.png',
        10004: 'https://www.serebii.net/sunmoon/pokemon/428-m.png',
        10005: 'https://www.serebii.net/sunmoon/pokemon/648-s.png',
        10006: 'https://www.serebii.net/sunmoon/pokemon/658-a.png',
        10007: 'https://www.serebii.net/sunmoon/pokemon/800-u.png',
        10008:
          'https://cdn.bulbagarden.net/upload/f/f5/Detective_Pikachu_artwork_2.png',
      };
      return specialUrls[pokemonId] || '';
    }

    // Regular pokemon use serebii format
    const paddedId = pokemonId.toString().padStart(3, '0');
    return `https://www.serebii.net/sunmoon/pokemon/${paddedId}.png`;
  }

  /**
   * Get rarity display name
   */
  getRarityName(rarity: number): string {
    const names: { [r: number]: string } = {
      1: '1⭐',
      2: '2⭐',
      3: '3⭐',
      4: '4⭐',
      5: '5⭐',
      6: 'Legendary',
      7: 'Mythic',
      8: 'Special',
    };
    return names[rarity] || `${rarity}⭐`;
  }
}

export default new PokemonService();
