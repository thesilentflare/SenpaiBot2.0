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

    // First sync without altering to ensure tables exist
    await sequelize.sync({ alter: false });
    
    // Run migrations to add new columns safely
    await runMigrations();
    
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
    // Check and add leagueGameStart column to Users table
    await addColumnIfNotExists('users', 'leagueGameStart', 'BIGINT DEFAULT NULL');
    
    // Check and add currentStreak column to Trainers table
    await addColumnIfNotExists('trainers', 'currentStreak', 'INTEGER DEFAULT 0 NOT NULL');
    
    Logger.info('Database migrations completed');
  } catch (error) {
    Logger.error('Error running migrations:', error);
  }
}

/**
 * Add a column to a table if it doesn't already exist
 */
async function addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
  try {
    // Check if column exists
    const [results] = await sequelize.query(`PRAGMA table_info(${tableName})`);
    const columns = results as any[];
    const columnExists = columns.some((col: any) => col.name === columnName);
    
    if (!columnExists) {
      await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      Logger.info(`Added column ${columnName} to table ${tableName}`);
    } else {
      Logger.debug(`Column ${columnName} already exists in table ${tableName}`);
    }
  } catch (error) {
    Logger.error(`Error adding column ${columnName} to table ${tableName}:`, error);
  }
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
  Logger.info('PikaGacha database connection closed');
}
