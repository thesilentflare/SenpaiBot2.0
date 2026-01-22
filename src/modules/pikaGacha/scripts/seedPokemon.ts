/**
 * Database Seeding Script for PikaGacha
 *
 * Run this script to populate the Pokemon table with data from pokedata.csv
 *
 * Usage:
 *   npx ts-node src/modules/pikaGacha/scripts/seedPokemon.ts
 */

import * as fs from 'fs';

import { initializeDatabase } from '../config/database';
import { Pokemon } from '../models';
import Logger from '../../../utils/logger';
import { getLatestSeedFile } from '../utils/seedManager';

interface PokemonData {
  id: number;
  name: string;
  rarity: number;
  focus: number;
  bst: number;
}

/**
 * Parse pokedata.csv file
 */
function parsePokemonCSV(filePath: string): PokemonData[] {
  const data: PokemonData[] = [];
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    if (parts.length < 5) continue;

    data.push({
      id: parseInt(parts[0]),
      name: parts[1].trim(),
      rarity: parseInt(parts[2]),
      focus: parseInt(parts[3]),
      bst: parseInt(parts[4]),
    });
  }

  return data;
}

/**
 * Determine regionId based on Pokemon ID
 */
function getRegionId(pokemonId: number): number {
  if (pokemonId >= 10000) return 0; // Special
  if (pokemonId <= 151) return 1; // Kanto
  if (pokemonId <= 251) return 2; // Johto
  if (pokemonId <= 386) return 3; // Hoenn
  if (pokemonId <= 493) return 4; // Sinnoh
  if (pokemonId <= 649) return 5; // Unova
  if (pokemonId <= 721) return 6; // Kalos
  if (pokemonId <= 809) return 7; // Alola
  if (pokemonId <= 905) return 8; // Galar
  if (pokemonId <= 1025) return 9; // Paldea
  return 0; // Special (fallback)
}

/**
 * Check if Pokemon is special (custom/event Pokemon)
 */
function isSpecialPokemon(pokemonId: number): boolean {
  return pokemonId >= 10000;
}

/**
 * Seed the Pokemon table
 */
async function seedPokemon() {
  try {
    // Initialize database
    await initializeDatabase();
    Logger.info('Database initialized');

    // Get the latest seed file (uploaded or default)
    const csvPath = getLatestSeedFile();
    Logger.info(`Using seed file: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      Logger.error(`Seed file not found at ${csvPath}`);
      process.exit(1);
    }

    // Parse CSV
    Logger.info('Parsing pokedata.csv...');
    const pokemonData = parsePokemonCSV(csvPath);
    Logger.info(`Found ${pokemonData.length} Pokemon entries`);

    // Insert Pokemon
    let inserted = 0;
    let updated = 0;

    for (const data of pokemonData) {
      const regionId = getRegionId(data.id);
      const isSpecial = isSpecialPokemon(data.id);

      const [pokemon, created] = await Pokemon.findOrCreate({
        where: { id: data.id },
        defaults: {
          id: data.id,
          name: data.name,
          rarity: data.rarity,
          focus: data.focus === 1,
          bst: data.bst,
          regionId,
          isSpecial,
          active: isSpecial ? true : false, // Special Pokemon active by default
        },
      });

      if (created) {
        inserted++;
      } else {
        // Update existing
        await pokemon.update({
          name: data.name,
          rarity: data.rarity,
          focus: data.focus === 1,
          bst: data.bst,
          regionId,
          isSpecial,
        });
        updated++;
      }

      if ((inserted + updated) % 100 === 0) {
        Logger.info(`Progress: ${inserted + updated}/${pokemonData.length}`);
      }
    }

    Logger.info('✅ Pokemon seeding complete!');
    Logger.info(`  - ${inserted} Pokemon inserted`);
    Logger.info(`  - ${updated} Pokemon updated`);
    Logger.info(`  - Total: ${pokemonData.length} Pokemon`);

    process.exit(0);
  } catch (error) {
    Logger.error('Failed to seed Pokemon', error);
    process.exit(1);
  }
}

// Run the seeding
seedPokemon();
