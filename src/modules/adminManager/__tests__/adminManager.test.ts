import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Guild } from 'discord.js';

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
  isAdmin,
  isActiveAdmin,
  addAdmin,
  removeAdmin,
  setAdminStatus,
  getAllAdmins,
} from '../helpers';
import { db } from '../../database';

const mockDb = db as any;

describe('AdminManager Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isActiveAdmin', () => {
    it('should return true if user is active admin', async () => {
      mockDb.get.mockResolvedValue({ discordID: '123', active: 1 });

      const result = await isActiveAdmin('123');

      expect(result).toBe(true);
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM Admins'),
        ['123'],
      );
    });

    it('should return false if user is not admin', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await isActiveAdmin('456');

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for server owner', async () => {
      const mockGuild = {
        ownerId: '123',
      } as Guild;

      const result = await isAdmin('123', mockGuild);

      expect(result).toBe(true);
      expect(mockDb.get).not.toHaveBeenCalled();
    });

    it('should check database if not server owner', async () => {
      const mockGuild = {
        ownerId: '999',
      } as Guild;

      mockDb.get.mockResolvedValue({ discordID: '123', active: 1 });

      const result = await isAdmin('123', mockGuild);

      expect(result).toBe(true);
      expect(mockDb.get).toHaveBeenCalled();
    });

    it('should work without guild parameter', async () => {
      mockDb.get.mockResolvedValue({ discordID: '123', active: 1 });

      const result = await isAdmin('123');

      expect(result).toBe(true);
    });
  });

  describe('addAdmin', () => {
    it('should add new admin successfully', async () => {
      mockDb.get.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback(null, null); // User not already admin
        },
      );

      mockDb.run.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback.call({ changes: 1 }, null);
        },
      );

      const result = await addAdmin('123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('added successfully');
    });

    it('should reject if user already admin', async () => {
      mockDb.get.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback(null, { discordID: '123' }); // User already admin
        },
      );

      const result = await addAdmin('123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already an admin');
    });
  });

  describe('removeAdmin', () => {
    it('should remove admin successfully', async () => {
      mockDb.run.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback.call({ changes: 1 }, null);
        },
      );

      const result = await removeAdmin('123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('removed successfully');
    });

    it('should handle user not being admin', async () => {
      mockDb.run.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback.call({ changes: 0 }, null);
        },
      );

      const result = await removeAdmin('123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not an admin');
    });
  });

  describe('setAdminStatus', () => {
    it('should enable admin successfully', async () => {
      mockDb.run.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback.call({ changes: 1 }, null);
        },
      );

      const result = await setAdminStatus('123', true);

      expect(result.success).toBe(true);
      expect(result.message).toContain('enabled');
    });

    it('should disable admin successfully', async () => {
      mockDb.run.mockImplementation(
        (query: any, params: any, callback: any) => {
          callback.call({ changes: 1 }, null);
        },
      );

      const result = await setAdminStatus('123', false);

      expect(result.success).toBe(true);
      expect(result.message).toContain('disabled');
    });
  });

  describe('getAllAdmins', () => {
    it('should return all admins', async () => {
      const mockAdmins = [
        { discordID: '123', name: 'Admin1', active: 1 },
        { discordID: '456', name: 'Admin2', active: 0 },
      ];
      mockDb.all.mockResolvedValue(mockAdmins);

      const result = await getAllAdmins();

      expect(result).toHaveLength(2);
      expect(result[0].active).toBe(true);
      expect(result[1].active).toBe(false);
    });
  });
});
