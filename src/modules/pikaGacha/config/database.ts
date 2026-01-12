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

    // Sync all models
    await sequelize.sync({ alter: false });
    Logger.info('PikaGacha database models synced');
  } catch (error) {
    Logger.error('Unable to connect to PikaGacha database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
  Logger.info('PikaGacha database connection closed');
}
