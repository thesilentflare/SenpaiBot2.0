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
export const QUIZ_TIMEOUT_MS = parseInt(process.env.QUIZ_TIMEOUT_MS || '60000'); // 1 minute to answer
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
