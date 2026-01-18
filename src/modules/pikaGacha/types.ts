import {
  TEAM_ELECTROCUTION_EMOJI_ID,
  TEAM_LENSFLARE_EMOJI_ID,
  TEAM_HYPERJOY_EMOJI_ID,
} from './config/config';

export interface Region {
  name: string;
  id: number;
  min: number;
  max: number;
}

export const KANTO: Region = { name: 'Kanto', id: 1, min: 1, max: 151 };
export const JOHTO: Region = { name: 'Johto', id: 2, min: 152, max: 251 };
export const HOENN: Region = { name: 'Hoenn', id: 3, min: 252, max: 386 };
export const SINNOH: Region = { name: 'Sinnoh', id: 4, min: 387, max: 493 };
export const UNOVA: Region = { name: 'Unova', id: 5, min: 494, max: 649 };
export const KALOS: Region = { name: 'Kalos', id: 6, min: 650, max: 721 };
export const ALOLA: Region = { name: 'Alola', id: 7, min: 722, max: 809 };
export const GALAR: Region = { name: 'Galar', id: 8, min: 810, max: 905 };
export const PALDEA: Region = { name: 'Paldea', id: 9, min: 906, max: 1025 };
export const SPECIAL: Region = {
  name: 'Special',
  id: 0,
  min: 10000,
  max: 11000,
};

export const REGIONS: Region[] = [
  SPECIAL,
  KANTO,
  JOHTO,
  HOENN,
  SINNOH,
  UNOVA,
  KALOS,
  ALOLA,
  GALAR,
  PALDEA,
];

export const REGION_LIST = [
  KANTO,
  JOHTO,
  HOENN,
  SINNOH,
  UNOVA,
  KALOS,
  ALOLA,
  GALAR,
  PALDEA,
];

export function getRegionById(id: number): Region | null {
  return REGIONS.find((r) => r.id === id) || null;
}

export function getRegionByName(name: string): Region | null {
  return (
    REGIONS.find((r) => r.name.toLowerCase() === name.toLowerCase()) || null
  );
}

export function getRegionByPokemonId(pokemonId: number): Region | null {
  if (pokemonId >= 10000) return SPECIAL;

  for (const region of REGION_LIST) {
    if (pokemonId >= region.min && pokemonId <= region.max) {
      return region;
    }
  }
  return null;
}

export interface RollResult {
  pokemon: {
    id: number;
    name: string;
    rarity: number;
    bst: number;
  };
  rarity: number;
  isJackpot: boolean;
}

export interface BallType {
  id: number;
  name: string;
  displayName: string;
  pointsRange: [number, number];
  rollRates: { [rarity: number]: number };
}

export const BALL_TYPES: { [key: number]: BallType } = {
  1: {
    id: 1,
    name: 'pokeball',
    displayName: 'Poké Ball',
    pointsRange: [1, 15],
    rollRates: { 3: 60, 4: 40 },
  },
  2: {
    id: 2,
    name: 'greatball',
    displayName: 'Great Ball',
    pointsRange: [15, 30],
    rollRates: { 3: 50, 4: 40, 5: 10 },
  },
  3: {
    id: 3,
    name: 'ultraball',
    displayName: 'Ultra Ball',
    pointsRange: [30, 60],
    rollRates: { 4: 60, 5: 35, 6: 5 },
  },
  4: {
    id: 4,
    name: 'masterball',
    displayName: 'Master Ball',
    pointsRange: [60, 150],
    rollRates: { 5: 85, 6: 10, 7: 5 },
  },
};

export function getBallType(id: number): BallType | null {
  return BALL_TYPES[id] || null;
}

export const SPECIAL_POKEMON: { [id: number]: string } = {
  10000: 'https://cdn.bulbagarden.net/upload/a/aa/Flying_Pikachu_Dash.png',
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

export const RARITY_NAMES: { [rarity: number]: string } = {
  1: '1⭐',
  2: '2⭐',
  3: '3⭐',
  4: '4⭐',
  5: '5⭐',
  6: 'Legendary',
  7: 'Mythic',
  8: 'Special',
};

export const RELEASE_VALUES: { [rarity: number]: number } = {
  3: 5,
  4: 10,
  5: 15,
  6: 30,
  7: 60,
  8: 45,
};

export const GACHA_COST = 30;
export const JACKPOT_CONTRIBUTION = 3;
export const MIN_BALANCE = -100;

export const TEAMS = {
  ELECTROCUTION: {
    name: 'Team Electrocution',
    emoji: 'electrocution',
    get emojiId() {
      return TEAM_ELECTROCUTION_EMOJI_ID;
    },
    get thumbnail() {
      return `https://cdn.discordapp.com/emojis/${TEAM_ELECTROCUTION_EMOJI_ID}.png?v=1`;
    },
  },
  LENSFLARE: {
    name: 'Team Lensflare',
    emoji: 'lensflare',
    get emojiId() {
      return TEAM_LENSFLARE_EMOJI_ID;
    },
    get thumbnail() {
      return `https://cdn.discordapp.com/emojis/${TEAM_LENSFLARE_EMOJI_ID}.png?v=1`;
    },
  },
  HYPERJOY: {
    name: 'Team Hyperjoy',
    emoji: 'hyperjoy',
    get emojiId() {
      return TEAM_HYPERJOY_EMOJI_ID;
    },
    get thumbnail() {
      return `https://cdn.discordapp.com/emojis/${TEAM_HYPERJOY_EMOJI_ID}.png?v=1`;
    },
  },
};

export const TEAM_SWITCH_COST = 420;

export const RANKS = [
  { name: 'Rookie', expRequired: 0 },
  { name: 'Trainer', expRequired: 100 },
  { name: 'Ace Trainer', expRequired: 300 },
  { name: 'Gym Leader', expRequired: 600 },
  { name: 'Elite Four', expRequired: 1000 },
  { name: 'Champion', expRequired: 1500 },
  { name: 'Master', expRequired: 2500 },
];
