/**
 * Sprite Quiz Configuration
 * Uses Pokemon sprite URLs for visual identification quizzes
 */

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
 * Pokemon sprite quiz pool
 * Organized by difficulty based on popularity and recognizability
 */
export const spriteQuizPool: SpriteQuizQuestion[] = [
  // Easy - Gen 1 starters and very popular Pokemon
  {
    pokemonId: 1,
    pokemonName: 'bulbasaur',
    spriteUrl: getSpriteUrl(1),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 4,
    pokemonName: 'charmander',
    spriteUrl: getSpriteUrl(4),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 7,
    pokemonName: 'squirtle',
    spriteUrl: getSpriteUrl(7),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 25,
    pokemonName: 'pikachu',
    spriteUrl: getSpriteUrl(25),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 6,
    pokemonName: 'charizard',
    spriteUrl: getSpriteUrl(6),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 9,
    pokemonName: 'blastoise',
    spriteUrl: getSpriteUrl(9),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 3,
    pokemonName: 'venusaur',
    spriteUrl: getSpriteUrl(3),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 150,
    pokemonName: 'mewtwo',
    spriteUrl: getSpriteUrl(150),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 151,
    pokemonName: 'mew',
    spriteUrl: getSpriteUrl(151),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 94,
    pokemonName: 'gengar',
    spriteUrl: getSpriteUrl(94),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 143,
    pokemonName: 'snorlax',
    spriteUrl: getSpriteUrl(143),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 144,
    pokemonName: 'articuno',
    spriteUrl: getSpriteUrl(144),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 145,
    pokemonName: 'zapdos',
    spriteUrl: getSpriteUrl(145),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 146,
    pokemonName: 'moltres',
    spriteUrl: getSpriteUrl(146),
    difficulty: 'easy',
    generation: 1,
  },
  {
    pokemonId: 133,
    pokemonName: 'eevee',
    spriteUrl: getSpriteUrl(133),
    difficulty: 'easy',
    generation: 1,
  },

  // Medium - Popular but less iconic Pokemon
  {
    pokemonId: 39,
    pokemonName: 'jigglypuff',
    spriteUrl: getSpriteUrl(39),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 54,
    pokemonName: 'psyduck',
    spriteUrl: getSpriteUrl(54),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 104,
    pokemonName: 'cubone',
    spriteUrl: getSpriteUrl(104),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 130,
    pokemonName: 'gyarados',
    spriteUrl: getSpriteUrl(130),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 131,
    pokemonName: 'lapras',
    spriteUrl: getSpriteUrl(131),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 149,
    pokemonName: 'dragonite',
    spriteUrl: getSpriteUrl(149),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 135,
    pokemonName: 'jolteon',
    spriteUrl: getSpriteUrl(135),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 136,
    pokemonName: 'flareon',
    spriteUrl: getSpriteUrl(136),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 134,
    pokemonName: 'vaporeon',
    spriteUrl: getSpriteUrl(134),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 59,
    pokemonName: 'arcanine',
    spriteUrl: getSpriteUrl(59),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 65,
    pokemonName: 'alakazam',
    spriteUrl: getSpriteUrl(65),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 68,
    pokemonName: 'machamp',
    spriteUrl: getSpriteUrl(68),
    difficulty: 'medium',
    generation: 1,
  },
  {
    pokemonId: 149,
    pokemonName: 'dragonite',
    spriteUrl: getSpriteUrl(149),
    difficulty: 'medium',
    generation: 1,
  },

  // Gen 2 Pokemon
  {
    pokemonId: 152,
    pokemonName: 'chikorita',
    spriteUrl: getSpriteUrl(152),
    difficulty: 'medium',
    generation: 2,
  },
  {
    pokemonId: 155,
    pokemonName: 'cyndaquil',
    spriteUrl: getSpriteUrl(155),
    difficulty: 'medium',
    generation: 2,
  },
  {
    pokemonId: 158,
    pokemonName: 'totodile',
    spriteUrl: getSpriteUrl(158),
    difficulty: 'medium',
    generation: 2,
  },
  {
    pokemonId: 249,
    pokemonName: 'lugia',
    spriteUrl: getSpriteUrl(249),
    difficulty: 'easy',
    generation: 2,
  },
  {
    pokemonId: 250,
    pokemonName: 'ho-oh',
    spriteUrl: getSpriteUrl(250),
    difficulty: 'easy',
    generation: 2,
  },
  {
    pokemonId: 197,
    pokemonName: 'umbreon',
    spriteUrl: getSpriteUrl(197),
    difficulty: 'medium',
    generation: 2,
  },
  {
    pokemonId: 196,
    pokemonName: 'espeon',
    spriteUrl: getSpriteUrl(196),
    difficulty: 'medium',
    generation: 2,
  },

  // Hard - Less common or easily confused Pokemon
  {
    pokemonId: 13,
    pokemonName: 'weedle',
    spriteUrl: getSpriteUrl(13),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 16,
    pokemonName: 'pidgey',
    spriteUrl: getSpriteUrl(16),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 19,
    pokemonName: 'rattata',
    spriteUrl: getSpriteUrl(19),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 27,
    pokemonName: 'sandshrew',
    spriteUrl: getSpriteUrl(27),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 43,
    pokemonName: 'oddish',
    spriteUrl: getSpriteUrl(43),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 72,
    pokemonName: 'tentacool',
    spriteUrl: getSpriteUrl(72),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 84,
    pokemonName: 'doduo',
    spriteUrl: getSpriteUrl(84),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 96,
    pokemonName: 'drowzee',
    spriteUrl: getSpriteUrl(96),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 109,
    pokemonName: 'koffing',
    spriteUrl: getSpriteUrl(109),
    difficulty: 'hard',
    generation: 1,
  },
  {
    pokemonId: 118,
    pokemonName: 'goldeen',
    spriteUrl: getSpriteUrl(118),
    difficulty: 'hard',
    generation: 1,
  },
];

/**
 * Get a random sprite quiz question
 */
export function getRandomSpriteQuestion(): SpriteQuizQuestion {
  return spriteQuizPool[Math.floor(Math.random() * spriteQuizPool.length)];
}

/**
 * Get a sprite quiz question by difficulty
 */
export function getSpriteQuestionByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard',
): SpriteQuizQuestion {
  const filtered = spriteQuizPool.filter((q) => q.difficulty === difficulty);
  return filtered[Math.floor(Math.random() * filtered.length)];
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
