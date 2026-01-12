export interface QuizQuestion {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
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
      .replace(/[.\-_]/g, ' ');
  return normalize(userAnswer) === normalize(correctAnswer);
}
