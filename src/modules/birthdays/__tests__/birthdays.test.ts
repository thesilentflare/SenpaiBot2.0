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
          announce_on: 1,
        },
        {
          discordID: '456',
          name: 'User2',
          dateISOString: '2000-08-20T00:00:00.000Z',
          announce_on: 1,
        },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getAllBirthdays();

      expect(result).toHaveLength(2);
      expect(result[0].announce_on).toBe(true);
      expect(result[1].announce_on).toBe(true);
      expect(mockDb.all).toHaveBeenCalled();
    });

    it('should return all birthdays including those with announce_on = false', async () => {
      const mockBirthdays = [
        {
          discordID: '123',
          name: 'User1',
          dateISOString: '2000-05-15T00:00:00.000Z',
          announce_on: 1,
        },
        {
          discordID: '456',
          name: 'User2',
          dateISOString: '2000-08-20T00:00:00.000Z',
          announce_on: 0,
        },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getAllBirthdays();

      expect(result).toHaveLength(2);
      expect(result[0].announce_on).toBe(true);
      expect(result[1].announce_on).toBe(false);
    });
  });

  describe('getTodayBirthdays', () => {
    it('should filter birthdays for today with announce_on = true', async () => {
      const today = new Date();
      const todayBirthday = new Date(
        2000,
        today.getMonth(),
        today.getDate(),
      ).toISOString();

      const mockBirthdays = [
        {
          discordID: '123',
          name: 'User1',
          dateISOString: todayBirthday,
          announce_on: 1,
        },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getTodayBirthdays(
        today.getMonth() + 1,
        today.getDate(),
      );

      expect(result).toHaveLength(1);
      expect(result[0].discordID).toBe('123');
      expect(result[0].announce_on).toBe(true);
    });

    it('should not return birthdays with announce_on = false', async () => {
      const today = new Date();

      // Mock returns empty array since query filters by announce_on = 1
      mockDb.all.mockResolvedValue([]);

      const result = await getTodayBirthdays(
        today.getMonth() + 1,
        today.getDate(),
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('getMonthlyBirthdays', () => {
    it('should filter birthdays for specific month', async () => {
      const mayBirthday = new Date(2000, 4, 15).toISOString(); // May

      const mockBirthdays = [
        {
          discordID: '123',
          name: 'User1',
          dateISOString: mayBirthday,
          announce_on: 1,
        },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getMonthlyBirthdays(5); // May

      expect(result).toHaveLength(1);
      expect(result[0].discordID).toBe('123');
      expect(result[0].announce_on).toBe(true);
    });

    it('should return all birthdays for the month including announce_on = false', async () => {
      const mayBirthday1 = new Date(2000, 4, 15).toISOString(); // May
      const mayBirthday2 = new Date(2000, 4, 20).toISOString(); // May

      const mockBirthdays = [
        {
          discordID: '123',
          name: 'User1',
          dateISOString: mayBirthday1,
          announce_on: 1,
        },
        {
          discordID: '456',
          name: 'User2',
          dateISOString: mayBirthday2,
          announce_on: 0,
        },
      ];
      mockDb.all.mockResolvedValue(mockBirthdays);

      const result = await getMonthlyBirthdays(5); // May

      expect(result).toHaveLength(2);
      expect(result[0].announce_on).toBe(true);
      expect(result[1].announce_on).toBe(false);
    });
  });
});
