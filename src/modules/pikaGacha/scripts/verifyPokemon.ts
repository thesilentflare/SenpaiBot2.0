/**
 * Verify Pokemon Database Seeding
 *
 * Quick script to check if Pokemon were seeded correctly
 *
 * Usage:
 *   npx ts-node src/modules/pikaGacha/scripts/verifyPokemon.ts
 */

import { initializeDatabase } from '../config/database';
import { Pokemon } from '../models';
import Logger from '../../../utils/logger';
import { REGIONS } from '../types';

async function verifyPokemon() {
  try {
    await initializeDatabase();
    Logger.info('Database connected\n');

    // Total count
    const total = await Pokemon.count();
    Logger.info(`✅ Total Pokemon: ${total}\n`);

    // Count by rarity
    Logger.info('Pokemon by Rarity:');
    for (let rarity = 1; rarity <= 8; rarity++) {
      const count = await Pokemon.count({ where: { rarity } });
      const stars = '⭐'.repeat(rarity);
      Logger.info(`  ${stars} ${rarity}-star: ${count}`);
    }
    Logger.info('');

    // Count by region
    Logger.info('Pokemon by Region:');
    for (let i = 0; i < REGIONS.length; i++) {
      const count = await Pokemon.count({ where: { regionId: i + 1 } });
      Logger.info(`  ${REGIONS[i].name}: ${count}`);
    }
    Logger.info('');

    // Focus Pokemon
    const focusPokemon = await Pokemon.findAll({ where: { focus: true } });
    Logger.info(`Focus Pokemon: ${focusPokemon.length}`);
    focusPokemon.forEach((p) => {
      Logger.info(`  - ${p.name} (${p.rarity}⭐, BST: ${p.bst})`);
    });
    Logger.info('');

    // Special Pokemon
    const specialPokemon = await Pokemon.findAll({
      where: { isSpecial: true },
    });
    Logger.info(`Special Pokemon: ${specialPokemon.length}`);
    specialPokemon.forEach((p) => {
      Logger.info(`  - ${p.name} (ID: ${p.id}, ${p.rarity}⭐)`);
    });
    Logger.info('');

    // Sample Pokemon
    Logger.info('Sample Pokemon:');
    const samples = [1, 25, 150, 251, 386, 493, 649, 721, 809];
    for (const id of samples) {
      const pokemon = await Pokemon.findByPk(id);
      if (pokemon) {
        const region = REGIONS[pokemon.regionId - 1]?.name || 'Unknown';
        Logger.info(
          `  ${pokemon.name.padEnd(15)} - ${pokemon.rarity}⭐, BST: ${pokemon.bst.toString().padStart(3)}, ${region}`,
        );
      }
    }

    Logger.info('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    Logger.error('Verification failed', error);
    process.exit(1);
  }
}

verifyPokemon();
