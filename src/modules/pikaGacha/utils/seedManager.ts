/**
 * Seed File Manager
 * Handles uploaded CSV files and determines which seed file to use
 */

import * as fs from 'fs';
import * as path from 'path';
import Logger from '../../../utils/logger';

const SEED_DATA_DIR = path.join(process.cwd(), 'seed_data');
const DEFAULT_SEED_FILE = path.join(
  __dirname,
  '..',
  'scripts',
  'pokedata.csv',
);

/**
 * Ensure seed_data directory exists
 */
export function ensureSeedDataDirectory(): void {
  if (!fs.existsSync(SEED_DATA_DIR)) {
    fs.mkdirSync(SEED_DATA_DIR, { recursive: true });
    Logger.info('Created seed_data directory at project root');
  }
}

/**
 * Get the most recent uploaded seed file, or default if none exists
 */
export function getLatestSeedFile(): string {
  ensureSeedDataDirectory();

  // Check for uploaded files in seed_data directory
  if (!fs.existsSync(SEED_DATA_DIR)) {
    Logger.info('No seed_data directory found, using default seed file');
    return DEFAULT_SEED_FILE;
  }

  const files = fs
    .readdirSync(SEED_DATA_DIR)
    .filter((file) => file.endsWith('.csv'))
    .sort()
    .reverse(); // Sort descending to get latest first

  if (files.length === 0) {
    Logger.info('No uploaded seed files found, using default seed file');
    return DEFAULT_SEED_FILE;
  }

  const latestFile = path.join(SEED_DATA_DIR, files[0]);
  Logger.info(`Using uploaded seed file: ${files[0]}`);
  return latestFile;
}

/**
 * Save an uploaded CSV file with ISO timestamp
 */
export async function saveUploadedSeedFile(
  buffer: Buffer,
  originalFilename: string,
): Promise<string> {
  ensureSeedDataDirectory();

  // Create filename with ISO timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = path.extname(originalFilename);
  const basename = path.basename(originalFilename, extension);
  const filename = `${basename}_${timestamp}${extension}`;
  const filePath = path.join(SEED_DATA_DIR, filename);

  // Write file
  await fs.promises.writeFile(filePath, buffer);
  Logger.info(`Saved uploaded seed file: ${filename}`);

  return filePath;
}

/**
 * Get list of all uploaded seed files
 */
export function listUploadedSeedFiles(): Array<{
  filename: string;
  path: string;
  size: number;
  created: Date;
}> {
  ensureSeedDataDirectory();

  if (!fs.existsSync(SEED_DATA_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(SEED_DATA_DIR)
    .filter((file) => file.endsWith('.csv'));

  return files
    .map((file) => {
      const filePath = path.join(SEED_DATA_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
      };
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());
}

/**
 * Delete an uploaded seed file
 */
export async function deleteUploadedSeedFile(filename: string): Promise<void> {
  const filePath = path.join(SEED_DATA_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  await fs.promises.unlink(filePath);
  Logger.info(`Deleted uploaded seed file: ${filename}`);
}
