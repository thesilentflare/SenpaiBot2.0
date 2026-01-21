import { Sequelize } from 'sequelize';
import path from 'path';
import Logger from '../../../utils/logger';

const dbPath = path.join(__dirname, '../data/pikagacha.db');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => Logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    Logger.info('PikaGacha database connection established');

    // Run migrations first to handle schema changes
    await runMigrations();

    // Then sync without alter to avoid SQLite issues
    await sequelize.sync({ alter: false });

    // Initialize ranks table with seed data
    // Import here to avoid circular dependency
    const { default: rankService } = await import('../services/RankService');
    await rankService.initializeRanks();

    Logger.info('PikaGacha database models synced');
  } catch (error) {
    Logger.error('Unable to connect to PikaGacha database:', error);
    throw error;
  }
}

/**
 * Run database migrations to add new columns safely
 */
async function runMigrations(): Promise<void> {
  try {
    // Clean up any backup tables from failed migrations
    await cleanupBackupTables();

    // Create items table if it doesn't exist
    await createItemsTableIfNotExists();

    // Check and add leagueGameStart column to Users table
    await addColumnIfNotExists(
      'users',
      'leagueGameStart',
      'BIGINT DEFAULT NULL',
    );

    // Check and add voiceChannelJoinTime column to Users table
    await addColumnIfNotExists(
      'users',
      'voiceChannelJoinTime',
      'BIGINT DEFAULT NULL',
    );

    // Check and add currentStreak column to Trainers table
    await addColumnIfNotExists(
      'trainers',
      'currentStreak',
      'INTEGER DEFAULT 0 NOT NULL',
    );

    Logger.info('Database migrations completed');
  } catch (error) {
    Logger.error('Error running migrations:', error);
  }
}

/**
 * Add a column to a table if it doesn't already exist
 */
async function addColumnIfNotExists(
  tableName: string,
  columnName: string,
  columnDefinition: string,
): Promise<void> {
  try {
    // Check if column exists
    const [results] = await sequelize.query(`PRAGMA table_info(${tableName})`);
    const columns = results as any[];
    const columnExists = columns.some((col: any) => col.name === columnName);

    if (!columnExists) {
      await sequelize.query(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
      );
      Logger.info(`Added column ${columnName} to table ${tableName}`);
    } else {
      Logger.debug(`Column ${columnName} already exists in table ${tableName}`);
    }
  } catch (error) {
    Logger.error(
      `Error adding column ${columnName} to table ${tableName}:`,
      error,
    );
  }
}

/**
 * Clean up backup tables from failed migrations
 */
async function cleanupBackupTables(): Promise<void> {
  try {
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup'",
    );

    for (const table of tables as any[]) {
      await sequelize.query(`DROP TABLE IF EXISTS ${table.name}`);
      Logger.info(`Dropped backup table: ${table.name}`);
    }
  } catch (error) {
    Logger.error('Error cleaning up backup tables:', error);
  }
}

/**
 * Create items table if it doesn't exist
 */
async function createItemsTableIfNotExists(): Promise<void> {
  try {
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='items'",
    );

    if ((tables as any[]).length === 0) {
      await sequelize.query(`
        CREATE TABLE items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId VARCHAR(255) NOT NULL,
          itemType INTEGER NOT NULL CHECK(itemType >= 1 AND itemType <= 4),
          quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 0),
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(userId, itemType)
        )
      `);
      Logger.info('Created items table');
    } else {
      Logger.debug('Items table already exists');
    }
  } catch (error) {
    Logger.error('Error creating items table:', error);
  }
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
  Logger.info('PikaGacha database connection closed');
}
