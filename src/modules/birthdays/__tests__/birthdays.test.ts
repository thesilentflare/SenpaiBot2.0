import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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
  setBirthday,
  getAllBirthdays,
  getTodayBirthdays,
  getMonthlyBirthdays,
} from '../helpers';
import { db } from '../../database';

const mockDb = db as any;

describe('Birthday Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setBirthday', () => {
    it('should set birthday for new user', async () => {
      mockDb.get.mockImplementation(
        (_query: any, _params: any, callback: any) => {
          callback(null, null); // User not found
        },
      );
      mockDb.run.mockImplementation(
        (_query: any, _params: any, callback: any) => {
          callback.call({ changes: 1 }, null);
        },
      );

      const result = await setBirthday('123', '2000-05-15T00:00:00.000Z');

      expect(result.success).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should update birthday for existing user', async () => {
      mockDb.get.mockImplementation(
        (_query: any, _params: any, callback: any) => {
          callback(null, { discordID: '123' }); // User found
        },
      );
      mockDb.run.mockImplementation(
        (_query: any, _params: any, callback: any) => {
          callback.call({ changes: 1 }, null);
        },
      );

      const result = await setBirthday('123', '2000-05-15T00:00:00.000Z');

      expect(result.success).toBe(true);
      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('getAllBirthdays', () => {
    it('should return all birthdays', async () => {
      const mockBirthdays = [
        {
          discordID: '123',
          name: 'User1',
          dateISOString: '2000-05-15T00:00:00.000Z',
        },
        {
          discordID: '456',
          name: 'User2',
          dateISOString: '2000-08-20T00:00:00.000Z',
        },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getAllBirthdays();

      expect(result).toEqual(mockBirthdays);
      expect(mockDb.all).toHaveBeenCalled();
    });
  });

  describe('getTodayBirthdays', () => {
    it('should filter birthdays for today', async () => {
      const today = new Date();
      const todayBirthday = new Date(
        2000,
        today.getMonth(),
        today.getDate(),
      ).toISOString();

      const mockBirthdays = [
        { discordID: '123', name: 'User1', dateISOString: todayBirthday },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getTodayBirthdays(
        today.getMonth() + 1,
        today.getDate(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].discordID).toBe('123');
    });
  });

  describe('getMonthlyBirthdays', () => {
    it('should filter birthdays for specific month', async () => {
      const mayBirthday = new Date(2000, 4, 15).toISOString(); // May

      const mockBirthdays = [
        { discordID: '123', name: 'User1', dateISOString: mayBirthday },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getMonthlyBirthdays(5); // May

      expect(result).toHaveLength(1);
      expect(result[0].discordID).toBe('123');
    });
  });
});
