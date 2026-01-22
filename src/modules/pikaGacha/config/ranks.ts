/**
 * Rank seed data matching the Python bot
 * Team-based ranks with EXP requirements
 */

export const RANK_DATA = [
  { rank: 'Recruit', expRequired: 0 },
  { rank: 'Crook', expRequired: 250 },
  { rank: 'Grunt', expRequired: 500 },
  { rank: 'Thug', expRequired: 750 },
  { rank: 'Associate', expRequired: 1000 },
  { rank: 'Hitman', expRequired: 1250 },
  { rank: 'Officer', expRequired: 1500 },
  { rank: 'Sergeant', expRequired: 1750 },
  { rank: 'Captain', expRequired: 2000 },
  { rank: 'Lieutenant', expRequired: 2250 },
  { rank: 'Admin', expRequired: 2500 },
  { rank: 'Commander', expRequired: 2750 },
  { rank: 'Boss', expRequired: 3500 },
];

/**
 * Ball rewards for each tier
 */
export const RANK_REWARDS: { [key: string]: number } = {
  // Tier 1 ranks: Poké Ball (ID 1)
  Crook: 1,
  Grunt: 1,
  Thug: 1,
  Associate: 1,
  Hitman: 1,

  // Tier 2 ranks: Great Ball (ID 2)
  Officer: 2,
  Sergeant: 2,
  Captain: 2,
  Lieutenant: 2,

  // Tier 3 ranks: Ultra Ball (ID 3)
  Admin: 3,
  Commander: 3,
  Boss: 3,
};
