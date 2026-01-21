import * as fs from 'fs';
import * as path from 'path';

// Load configuration from modules.config.json
let moduleConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'modules.config.json');
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const fullConfig = JSON.parse(configData);
    moduleConfig = fullConfig.pikaGacha || {};
  }
} catch (error) {
  console.warn('Failed to load modules.config.json for PikaGacha:', error);
}

/**
 * PikaGacha Module Configuration
 */

// Quiz System Configuration
export const QUIZ_CHANNEL_ID = process.env.QUIZ_CHANNEL_ID || '';

// Reward Logging Configuration
export const REWARD_LOG_CHANNEL_ID = process.env.REWARD_LOG_CHANNEL_ID || '';

// Roll Command Configuration
export const ALLOWED_ROLL_CHANNEL_IDS = process.env.ALLOWED_ROLL_CHANNEL_IDS
  ? JSON.parse(process.env.ALLOWED_ROLL_CHANNEL_IDS)
  : [];

// Team Emoji Configuration
export const TEAM_ELECTROCUTION_EMOJI_ID =
  process.env.TEAM_ELECTROCUTION_EMOJI_ID || '674064096664223745';
export const TEAM_LENSFLARE_EMOJI_ID =
  process.env.TEAM_LENSFLARE_EMOJI_ID || '496138997391687710';
export const TEAM_HYPERJOY_EMOJI_ID =
  process.env.TEAM_HYPERJOY_EMOJI_ID || '1008527027441246329';

// League of Legends Integration
export const ENABLE_LEAGUE_TRACKING =
  moduleConfig.enableLeagueTracking !== false &&
  process.env.ENABLE_LEAGUE_TRACKING !== 'false';

// Quiz System
export const ENABLE_QUIZ =
  moduleConfig.enableQuiz !== false && process.env.ENABLE_QUIZ !== 'false';

// League of Legends Constants
export const LEAGUE_CLIENT_ID =
  process.env.LEAGUE_CLIENT_ID || '401518684763586560'; // Official League of Legends Discord app ID
export const MIN_GAME_DURATION_MS = parseInt(
  process.env.MIN_GAME_DURATION_MS || '900000',
); // 15 minutes in milliseconds
export const LEAGUE_REWARD_POINTS = parseInt(
  process.env.LEAGUE_REWARD_POINTS || '30',
);

// Quiz System Constants
export const QUIZ_INTERVAL_MS = parseInt(
  process.env.QUIZ_INTERVAL_MS || '7200000',
); // 2 hours in milliseconds
export const QUIZ_TIMEOUT_MS = parseInt(
  process.env.QUIZ_TIMEOUT_MS || '300000',
); // 5 minutes to answer
export const BASE_REWARD = parseInt(process.env.BASE_REWARD || '20');
export const STREAK_BONUS = parseInt(process.env.STREAK_BONUS || '10');
export const MAX_REWARD = parseInt(process.env.MAX_REWARD || '60');
export const SHUTDOWN_MULTIPLIER = parseInt(
  process.env.SHUTDOWN_MULTIPLIER || '10',
);

// Streak Rewards (ball types: 1=Pokeball, 2=Greatball, 3=Ultraball, 4=Masterball)
export const STREAK_REWARDS = {
  5: parseInt(process.env.STREAK_REWARD_5 || '1'), // pokeball
  10: parseInt(process.env.STREAK_REWARD_10 || '2'), // greatball
  15: parseInt(process.env.STREAK_REWARD_15 || '3'), // ultraball
  20: parseInt(process.env.STREAK_REWARD_20 || '4'), // masterball
} as const;

// Voice Channel Rewards
export const ENABLE_VOICE_REWARDS =
  moduleConfig.enableVoiceRewards !== false &&
  process.env.ENABLE_VOICE_REWARDS !== 'false';
export const MIN_VOICE_MEMBERS = parseInt(process.env.MIN_VOICE_MEMBERS || '2'); // Minimum members in voice channel
export const VOICE_REWARD_INTERVAL_MS = parseInt(
  process.env.VOICE_REWARD_INTERVAL_MS || '600000',
); // 10 minutes in milliseconds
export const VOICE_REWARD_POINTS = parseInt(
  process.env.VOICE_REWARD_POINTS || '2',
); // Points per interval

// Game Economy Constants
export const ROLL_COST = parseInt(process.env.ROLL_COST || '30'); // Cost per roll
export const GACHA_COST = parseInt(process.env.GACHA_COST || '30'); // Cost per gacha
export const JACKPOT_CONTRIBUTION = parseInt(
  process.env.JACKPOT_CONTRIBUTION || '3',
); // Points per roll to jackpot
export const MIN_BALANCE = parseInt(process.env.MIN_BALANCE || '-100'); // Minimum allowed balance
export const STARTER_BONUS = parseInt(process.env.STARTER_BONUS || '100'); // Starter pikapoints for new trainers
export const TEAM_SWITCH_COST = parseInt(process.env.TEAM_SWITCH_COST || '420'); // Cost to switch teams
export const JACKPOT_MYTHIC_MULTIPLIER = parseInt(
  process.env.JACKPOT_MYTHIC_MULTIPLIER || '2',
); // Mythic jackpot multiplier

// Box/UI Constants
export const BOX_POKEMON_PER_PAGE = parseInt(
  process.env.BOX_POKEMON_PER_PAGE || '32',
); // Pokemon per page in box view
export const BOX_SPRITE_SIZE = parseInt(process.env.BOX_SPRITE_SIZE || '64'); // Sprite size in pixels
export const BOX_COLS = parseInt(process.env.BOX_COLS || '8'); // Number of columns
export const BOX_INTERACTION_TIMEOUT = parseInt(
  process.env.BOX_INTERACTION_TIMEOUT || '120000',
); // 2 minutes

// Collection/Inventory Constants
export const COLLECTION_ITEMS_PER_PAGE = parseInt(
  process.env.COLLECTION_ITEMS_PER_PAGE || '20',
); // Items per page in collection
export const MAX_FAVORITES = parseInt(process.env.MAX_FAVORITES || '6'); // Maximum favorite Pokemon
