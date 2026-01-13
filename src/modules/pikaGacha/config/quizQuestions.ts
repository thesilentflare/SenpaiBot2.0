import axios from 'axios';
import { Pokemon } from '../models/Pokemon';
import { Op } from 'sequelize';
import Logger from '../../../utils/logger';

export interface QuizQuestion {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  pokemonName?: string; // For dynamic questions
}

interface PokeApiPokemon {
  id: number;
  name: string;
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  height: number;
  weight: number;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
}

/**
 * Generate a random text quiz question from PokeAPI
 */
export async function getRandomTextQuizQuestion(): Promise<QuizQuestion | null> {
  try {
    // Get a random Pokemon from database (exclude special Pokemon)
    const pokemon = await Pokemon.findOne({
      where: {
        isSpecial: false,
        id: { [Op.lte]: 905 }, // Up to Gen 8
      },
      order: Pokemon.sequelize!.random(),
    });

    if (!pokemon) {
      Logger.error('No Pokemon found in database for text quiz');
      return null;
    }

    // Fetch Pokemon data from PokeAPI
    const response = await axios.get<PokeApiPokemon>(
      `https://pokeapi.co/api/v2/pokemon/${pokemon.id}`,
    );
    const pokeData = response.data;

    // Generate a random question type
    const questionTypes = [
      'type',
      'dual-type',
      'stat',
      'height',
      'weight',
      'ability',
      'generation',
    ];
    const questionType =
      questionTypes[Math.floor(Math.random() * questionTypes.length)];

    return generateQuestionByType(pokemon.name, pokeData, questionType);
  } catch (error) {
    Logger.error('Error generating text quiz question from PokeAPI', error);
    return null;
  }
}

/**
 * Generate a question based on type
 */
function generateQuestionByType(
  pokemonName: string,
  pokeData: PokeApiPokemon,
  questionType: string,
): QuizQuestion {
  const types = pokeData.types.map((t) => t.type.name);
  const formattedName =
    pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);

  switch (questionType) {
    case 'type': {
      // Ask for primary type or one of the types
      const typeToAsk = types[Math.floor(Math.random() * types.length)];
      return {
        question:
          types.length === 1
            ? `What type is ${formattedName}?`
            : `Name one of ${formattedName}'s types.`,
        answer: typeToAsk,
        difficulty: getDifficulty(pokeData.id),
        category: 'pokemon-type',
        pokemonName,
      };
    }

    case 'dual-type': {
      if (types.length === 2) {
        return {
          question: `${formattedName} is a ${types[0].toUpperCase()} type. What is its second type?`,
          answer: types[1],
          difficulty: getDifficulty(pokeData.id),
          category: 'pokemon-type',
          pokemonName,
        };
      }
      // Fallback to regular type question
      return {
        question: `What type is ${formattedName}?`,
        answer: types[0],
        difficulty: getDifficulty(pokeData.id),
        category: 'pokemon-type',
        pokemonName,
      };
    }

    case 'stat': {
      // Pick a random stat
      const statNames = [
        'hp',
        'attack',
        'defense',
        'special-attack',
        'special-defense',
        'speed',
      ];
      const statToAsk = statNames[Math.floor(Math.random() * statNames.length)];
      const stat = pokeData.stats.find((s) => s.stat.name === statToAsk);

      if (!stat) {
        // Fallback
        return {
          question: `What type is ${formattedName}?`,
          answer: types[0],
          difficulty: getDifficulty(pokeData.id),
          category: 'pokemon-type',
          pokemonName,
        };
      }

      const statDisplayName = statToAsk
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      return {
        question: `What is ${formattedName}'s base ${statDisplayName} stat?`,
        answer: stat.base_stat.toString(),
        difficulty: 'hard',
        category: 'pokemon-stats',
        pokemonName,
      };
    }

    case 'height': {
      // Height in decimeters, convert to meters
      const heightInMeters = (pokeData.height / 10).toFixed(1);
      return {
        question: `How tall is ${formattedName} in meters? (e.g., 1.5)`,
        answer: heightInMeters,
        difficulty: 'hard',
        category: 'pokemon-stats',
        pokemonName,
      };
    }

    case 'weight': {
      // Weight in hectograms, convert to kg
      const weightInKg = (pokeData.weight / 10).toFixed(1);
      return {
        question: `How much does ${formattedName} weigh in kg? (e.g., 45.0)`,
        answer: weightInKg,
        difficulty: 'hard',
        category: 'pokemon-stats',
        pokemonName,
      };
    }

    case 'ability': {
      // Pick a non-hidden ability
      const normalAbilities = pokeData.abilities.filter((a) => !a.is_hidden);
      if (normalAbilities.length > 0) {
        const ability =
          normalAbilities[Math.floor(Math.random() * normalAbilities.length)];
        const abilityName = ability.ability.name
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        return {
          question: `Name one of ${formattedName}'s abilities.`,
          answer: ability.ability.name,
          difficulty: getDifficulty(pokeData.id),
          category: 'pokemon-ability',
          pokemonName,
        };
      }
      // Fallback
      return {
        question: `What type is ${formattedName}?`,
        answer: types[0],
        difficulty: getDifficulty(pokeData.id),
        category: 'pokemon-type',
        pokemonName,
      };
    }

    case 'generation': {
      // Ask what generation the Pokemon is from
      // Accept either "gen X" or just the number
      const genNumber = getGenerationNumber(pokeData.id);
      return {
        question: `What generation is ${formattedName} from? (Answer with Gen X or just the number)`,
        answer: genNumber.toString(),
        difficulty: getDifficulty(pokeData.id),
        category: 'pokemon-generation',
        pokemonName,
      };
    }

    default: {
      const generation = `Gen ${getGenerationNumber(pokeData.id)}`;
      return {
        question: `What type is ${formattedName}? (${generation})`,
        answer: types[0],
        difficulty: getDifficulty(pokeData.id),
        category: 'pokemon-type',
        pokemonName,
      };
    }
  }
}

/**
 * Get generation number from Pokemon ID
 */
function getGenerationNumber(pokemonId: number): number {
  if (pokemonId <= 151) return 1;
  if (pokemonId <= 251) return 2;
  if (pokemonId <= 386) return 3;
  if (pokemonId <= 493) return 4;
  if (pokemonId <= 649) return 5;
  if (pokemonId <= 721) return 6;
  if (pokemonId <= 809) return 7;
  if (pokemonId <= 905) return 8;
  return 0;
}

/**
 * Determine difficulty based on Pokemon ID (generation)
 */
function getDifficulty(pokemonId: number): 'easy' | 'medium' | 'hard' {
  if (pokemonId <= 151) return 'easy'; // Gen 1
  if (pokemonId <= 386) return 'medium'; // Gen 1-3
  return 'hard'; // Gen 4+
}

export const quizQuestions: QuizQuestion[] = [
  // Type matchups
  {
    question: 'What type is super effective against Water?',
    answer: 'grass',
    difficulty: 'easy',
    category: 'types',
  },
  {
    question: 'What type is super effective against Fire?',
    answer: 'water',
    difficulty: 'easy',
    category: 'types',
  },
  {
    question: 'What type is super effective against Grass?',
    answer: 'fire',
    difficulty: 'easy',
    category: 'types',
  },
  {
    question: 'What type is super effective against Electric?',
    answer: 'ground',
    difficulty: 'easy',
    category: 'types',
  },
  {
    question: 'What type is super effective against Psychic?',
    answer: 'dark',
    difficulty: 'medium',
    category: 'types',
  },
  {
    question: 'What type is super effective against Dragon?',
    answer: 'fairy',
    difficulty: 'medium',
    category: 'types',
  },
  {
    question: 'What type is immune to Ghost moves?',
    answer: 'normal',
    difficulty: 'medium',
    category: 'types',
  },
  {
    question: 'What type is immune to Ground moves?',
    answer: 'flying',
    difficulty: 'medium',
    category: 'types',
  },

  // Pokemon identification
  {
    question: 'What is the first Pokemon in the National Pokedex?',
    answer: 'bulbasaur',
    difficulty: 'easy',
    category: 'pokemon',
  },
  {
    question: 'What Pokemon is #025 in the National Pokedex?',
    answer: 'pikachu',
    difficulty: 'easy',
    category: 'pokemon',
  },
  {
    question: 'What is the evolved form of Pikachu?',
    answer: 'raichu',
    difficulty: 'easy',
    category: 'pokemon',
  },
  {
    question: 'What is the evolved form of Eevee using a Water Stone?',
    answer: 'vaporeon',
    difficulty: 'medium',
    category: 'pokemon',
  },
  {
    question: 'What is the evolved form of Eevee using a Thunder Stone?',
    answer: 'jolteon',
    difficulty: 'medium',
    category: 'pokemon',
  },
  {
    question: 'What is the evolved form of Eevee using a Fire Stone?',
    answer: 'flareon',
    difficulty: 'medium',
    category: 'pokemon',
  },
  {
    question: 'What Pokemon is known as the Genetic Pokemon?',
    answer: 'mew',
    difficulty: 'medium',
    category: 'pokemon',
  },
  {
    question: 'What legendary bird is associated with ice?',
    answer: 'articuno',
    difficulty: 'easy',
    category: 'pokemon',
  },
  {
    question: 'What legendary bird is associated with lightning?',
    answer: 'zapdos',
    difficulty: 'easy',
    category: 'pokemon',
  },
  {
    question: 'What legendary bird is associated with fire?',
    answer: 'moltres',
    difficulty: 'easy',
    category: 'pokemon',
  },

  // Abilities
  {
    question: 'What ability prevents status conditions in sunny weather?',
    answer: 'leaf guard',
    difficulty: 'hard',
    category: 'abilities',
  },
  {
    question: 'What ability gives immunity to Ground-type moves?',
    answer: 'levitate',
    difficulty: 'medium',
    category: 'abilities',
  },
  {
    question: 'What ability boosts Attack when hit by a Water-type move?',
    answer: 'water absorb',
    difficulty: 'medium',
    category: 'abilities',
  },
  {
    question: 'What ability increases Speed in rain?',
    answer: 'swift swim',
    difficulty: 'medium',
    category: 'abilities',
  },

  // Moves
  {
    question: 'What is the most powerful Normal-type move?',
    answer: 'explosion',
    difficulty: 'hard',
    category: 'moves',
  },
  {
    question: 'What move has the highest base power in the game?',
    answer: 'explosion',
    difficulty: 'hard',
    category: 'moves',
  },
  {
    question: 'What move allows the user to copy the last move used?',
    answer: 'mirror move',
    difficulty: 'medium',
    category: 'moves',
  },
  {
    question: 'What move transforms the user into the target Pokemon?',
    answer: 'transform',
    difficulty: 'easy',
    category: 'moves',
  },

  // Regions
  {
    question: 'What is the starting region in Pokemon Red and Blue?',
    answer: 'kanto',
    difficulty: 'easy',
    category: 'regions',
  },
  {
    question: 'What is the starting region in Pokemon Gold and Silver?',
    answer: 'johto',
    difficulty: 'easy',
    category: 'regions',
  },
  {
    question: 'What is the starting region in Pokemon Ruby and Sapphire?',
    answer: 'hoenn',
    difficulty: 'easy',
    category: 'regions',
  },
  {
    question: 'What is the starting region in Pokemon Diamond and Pearl?',
    answer: 'sinnoh',
    difficulty: 'easy',
    category: 'regions',
  },
  {
    question: 'What region is based on France?',
    answer: 'kalos',
    difficulty: 'medium',
    category: 'regions',
  },
  {
    question: 'What region is based on Hawaii?',
    answer: 'alola',
    difficulty: 'medium',
    category: 'regions',
  },

  // Gym Leaders
  {
    question: 'What type does Brock specialize in?',
    answer: 'rock',
    difficulty: 'easy',
    category: 'trainers',
  },
  {
    question: 'What type does Misty specialize in?',
    answer: 'water',
    difficulty: 'easy',
    category: 'trainers',
  },
  {
    question: 'What type does Lt. Surge specialize in?',
    answer: 'electric',
    difficulty: 'easy',
    category: 'trainers',
  },
  {
    question:
      'What is the name of the Electric-type Gym Leader in Vermilion City?',
    answer: 'lt. surge',
    difficulty: 'medium',
    category: 'trainers',
  },

  // Items
  {
    question: 'What item prevents a Pokemon from fainting with 1 HP?',
    answer: 'focus sash',
    difficulty: 'medium',
    category: 'items',
  },
  {
    question: 'What item increases the chance of catching Pokemon?',
    answer: 'ultra ball',
    difficulty: 'easy',
    category: 'items',
  },
  {
    question: 'What stone is used to evolve Pikachu?',
    answer: 'thunder stone',
    difficulty: 'easy',
    category: 'items',
  },
  {
    question: 'What item guarantees catching a Pokemon?',
    answer: 'master ball',
    difficulty: 'easy',
    category: 'items',
  },

  // Trivia
  {
    question:
      'How many Gym Badges are needed to challenge the Elite Four in Kanto?',
    answer: '8',
    difficulty: 'easy',
    category: 'trivia',
  },
  {
    question: 'What is the maximum level a Pokemon can reach?',
    answer: '100',
    difficulty: 'easy',
    category: 'trivia',
  },
  {
    question: 'How many types are there in Pokemon?',
    answer: '18',
    difficulty: 'medium',
    category: 'trivia',
  },
  {
    question: 'What generation introduced Fairy type?',
    answer: '6',
    difficulty: 'medium',
    category: 'trivia',
  },
  {
    question: 'What is the only Pokemon that can learn every TM and HM?',
    answer: 'mew',
    difficulty: 'hard',
    category: 'trivia',
  },
];

/**
 * Get a random quiz question
 */
export function getRandomQuestion(): QuizQuestion {
  return quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
}

/**
 * Check if an answer matches the correct answer (case insensitive, handles variations)
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[.\-_]/g, ' ')
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  // Check for exact match
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // For generation answers, accept "gen X", "generation X", or just "X"
  const genMatch = normalizedUser.match(/^(?:gen(?:eration)?\s*)?(\d+)$/);
  if (genMatch && genMatch[1] === correctAnswer) {
    return true;
  }

  // For numeric answers (stats, height, weight), allow some tolerance
  const userNum = parseFloat(userAnswer);
  const correctNum = parseFloat(correctAnswer);
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    // Allow exact match or within 1 unit for stats
    return Math.abs(userNum - correctNum) <= 1;
  }

  // Check if user answer contains the correct answer (for abilities with spaces/hyphens)
  if (
    normalizedUser.includes(normalizedCorrect) ||
    normalizedCorrect.includes(normalizedUser)
  ) {
    return true;
  }

  return false;
}
