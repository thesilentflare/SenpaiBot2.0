import { db, dbPromise } from '../database';

/**
 * Check if a user is exempt from message logging
 */
export async function isExempt(discordId: string): Promise<boolean> {
  const database = await dbPromise;
  const result = await database.get(
    'SELECT * FROM MsgLogExemptions WHERE discordID = ?',
    [discordId],
  );
  return !!result;
}

/**
 * Add a user to message log exemptions
 */
export async function addExemption(discordId: string): Promise<void> {
  const database = await dbPromise;

  // First, ensure user exists in Users table
  await database.run(
    'INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)',
    [discordId, 'Unknown'],
  );

  // Add exemption
  await database.run('INSERT INTO MsgLogExemptions (discordID) VALUES (?)', [
    discordId,
  ]);
}

/**
 * Remove a user from message log exemptions
 */
export async function removeExemption(discordId: string): Promise<void> {
  const database = await dbPromise;
  await database.run('DELETE FROM MsgLogExemptions WHERE discordID = ?', [
    discordId,
  ]);
}

/**
 * Get all exempt users
 */
export async function getAllExemptions(): Promise<string[]> {
  const database = await dbPromise;
  const results = await database.all('SELECT discordID FROM MsgLogExemptions');
  return results.map((row: any) => row.discordID);
}
