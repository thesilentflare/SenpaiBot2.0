import { describe, test, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../database', () => {
  const mockDb: any = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  };
  return {
    db: mockDb,
    dbPromise: Promise.resolve(mockDb),
  };
});

import {
  addUser,
  updateUserName,
  getUserByDiscordID,
  getAllUsers,
  userExists,
} from '../helpers';
import { db } from '../../database';

const mockDb = db as any;

describe('UserManager Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    test('should add a new user to the database', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await addUser('123456789', 'TestUser');

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)',
        ['123456789', 'TestUser'],
      );
    });

    test('should ignore duplicate users (INSERT OR IGNORE)', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await addUser('123456789', 'TestUser');
      await addUser('123456789', 'DifferentName');

      expect(mockDb.run).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateUserName', () => {
    test('should update an existing user name', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const updated = await updateUserName('123456789', 'NewName');

      expect(updated).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE Users SET name = ? WHERE discordID = ?',
        ['NewName', '123456789'],
      );
    });

    test('should return false when updating non-existent user', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const updated = await updateUserName('999999999', 'SomeName');

      expect(updated).toBe(false);
    });
  });

  describe('getUserByDiscordID', () => {
    test('should return user when they exist', async () => {
      const mockUser = { discordID: '123456789', name: 'TestUser' };
      mockDb.get.mockResolvedValue(mockUser);

      const user = await getUserByDiscordID('123456789');

      expect(user).toBeDefined();
      expect(user?.discordID).toBe('123456789');
      expect(user?.name).toBe('TestUser');
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT discordID, name FROM Users WHERE discordID = ?',
        ['123456789'],
      );
    });

    test('should return null when user does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const user = await getUserByDiscordID('999999999');

      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    test('should return all users ordered by name', async () => {
      const mockUsers = [
        { discordID: '222222222', name: 'Alice' },
        { discordID: '333333333', name: 'Bob' },
        { discordID: '111111111', name: 'Charlie' },
      ];
      mockDb.all.mockResolvedValue(mockUsers);

      const users = await getAllUsers();

      expect(users).toHaveLength(3);
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT discordID, name FROM Users ORDER BY name',
      );
    });

    test('should return empty array when no users exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const users = await getAllUsers();

      expect(users).toHaveLength(0);
    });
  });

  describe('userExists', () => {
    test('should return true when user exists', async () => {
      const mockUser = { discordID: '123456789', name: 'TestUser' };
      mockDb.get.mockResolvedValue(mockUser);

      const exists = await userExists('123456789');

      expect(exists).toBe(true);
    });

    test('should return false when user does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const exists = await userExists('999999999');

      expect(exists).toBe(false);
    });
  });
});
