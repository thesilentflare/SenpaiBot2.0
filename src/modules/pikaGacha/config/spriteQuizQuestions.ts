/**
 * Sprite Quiz Configuration
 * Uses Pokemon sprite URLs for visual identification quizzes
 * Pokemon data is loaded from the database
 */

import { Pokemon } from '../models/Pokemon';
import { Op } from 'sequelize';

export interface SpriteQuizQuestion {
  pokemonId: number;
  pokemonName: string;
  spriteUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  generation: number;
}

/**
 * Get sprite URL for a Pokemon by ID
 * Using PokeAPI sprite URLs
 */
export function getSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
}

/**
 * Alternative sprite sources (if primary fails)
 */
export function getAlternativeSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

/**
 * Determine difficulty based on rarity and generation
 * - Easy: Gen 1-2, lower rarity (1-3)
 * - Medium: Gen 3-5, mid rarity (4-5)
 * - Hard: Gen 6+, higher rarity (6+)
 */
function determineDifficulty(
  rarity: number,
  regionId: number,
): 'easy' | 'medium' | 'hard' {
  // Rarity 1-2 or Gen 1 = Easy
  if (rarity <= 2 || regionId === 1) return 'easy';
  // Rarity 3-4 or Gen 2-4 = Medium
  if (rarity <= 4 || regionId <= 4) return 'medium';
  // Everything else = Hard
  return 'hard';
}

/**
 * Get a random sprite quiz question from the database
 */
export async function getRandomSpriteQuestion(): Promise<SpriteQuizQuestion> {
  // Try to query a random Pokemon from the database (exclude special Pokemon)
  let pokemon = await Pokemon.findOne({
    where: {
      isSpecial: false,
      active: true,
    },
    order: Pokemon.sequelize!.random(),
  });

  // If no Pokemon found with filters, try without filters
  if (!pokemon) {
    pokemon = await Pokemon.findOne({
      order: Pokemon.sequelize!.random(),
    });
  }

  if (!pokemon) {
    throw new Error(
      'No Pokemon found in database for sprite quiz. Please run: npm run seed:pikagacha',
    );
  }

  return {
    pokemonId: pokemon.id,
    pokemonName: pokemon.name.toLowerCase(),
    spriteUrl: getSpriteUrl(pokemon.id),
    difficulty: determineDifficulty(pokemon.rarity, pokemon.regionId),
    generation: pokemon.regionId,
  };
}

/**
 * Get a sprite quiz question by difficulty from the database
 */
export async function getSpriteQuestionByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard',
): Promise<SpriteQuizQuestion> {
  // Define rarity and region ranges based on difficulty
  let whereClause: any = {
    isSpecial: false,
    active: true,
  };

  if (difficulty === 'easy') {
    // Easy: Gen 1 or low rarity (1-2)
    whereClause = {
      ...whereClause,
      [Op.or]: [{ regionId: 1 }, { rarity: { [Op.lte]: 2 } }],
    };
  } else if (difficulty === 'medium') {
    // Medium: Gen 2-4 or mid rarity (3-4)
    whereClause = {
      ...whereClause,
      [Op.or]: [
        { regionId: { [Op.between]: [2, 4] } },
        { rarity: { [Op.between]: [3, 4] } },
      ],
    };
  } else {
    // Hard: Gen 5+ or high rarity (5+)
    whereClause = {
      ...whereClause,
      [Op.or]: [{ regionId: { [Op.gte]: 5 } }, { rarity: { [Op.gte]: 5 } }],
    };
  }

  const pokemon = await Pokemon.findOne({
    where: whereClause,
    order: Pokemon.sequelize!.random(),
  });

  if (!pokemon) {
    // Fallback to any random Pokemon if no match found
    return getRandomSpriteQuestion();
  }

  return {
    pokemonId: pokemon.id,
    pokemonName: pokemon.name.toLowerCase(),
    spriteUrl: getSpriteUrl(pokemon.id),
    difficulty: determineDifficulty(pokemon.rarity, pokemon.regionId),
    generation: pokemon.regionId,
  };
}

/**
 * Check if an answer matches the Pokemon name (handles variations)
 */
export function checkSpriteAnswer(
  userAnswer: string,
  correctName: string,
): boolean {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[.\-_\s]/g, '');
  return normalize(userAnswer) === normalize(correctName);
}
