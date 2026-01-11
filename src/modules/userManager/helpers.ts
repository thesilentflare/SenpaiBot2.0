import { dbPromise } from '../database';

export type UserEntry = {
  discordID: string;
  name: string;
};

/**
 * Add a new user to the database
 */
export const addUser = async (
  discordID: string,
  name: string,
): Promise<void> => {
  const database = await dbPromise;

  const query = `INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)`;
  await database.run(query, [discordID, name]);
};

/**
 * Update a user's name in the database
 */
export const updateUserName = async (
  discordID: string,
  newName: string,
): Promise<boolean> => {
  const database = await dbPromise;

  const query = `UPDATE Users SET name = ? WHERE discordID = ?`;
  const result = await database.run(query, [newName, discordID]);

  return (result.changes ?? 0) > 0;
};

/**
 * Get a user by Discord ID
 */
export const getUserByDiscordID = async (
  discordID: string,
): Promise<UserEntry | null> => {
  const database = await dbPromise;

  const query = `SELECT discordID, name FROM Users WHERE discordID = ?`;
  const user = await database.get<UserEntry>(query, [discordID]);

  return user || null;
};

/**
 * Get all users from the database
 */
export const getAllUsers = async (): Promise<UserEntry[]> => {
  const database = await dbPromise;

  const query = `SELECT discordID, name FROM Users ORDER BY name`;
  const users = await database.all<UserEntry[]>(query);

  return users;
};

/**
 * Check if a user exists in the database
 */
export const userExists = async (discordID: string): Promise<boolean> => {
  const user = await getUserByDiscordID(discordID);
  return user !== null;
};
