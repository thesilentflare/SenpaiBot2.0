import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  jest,
} from '@jest/globals';

jest.mock('../../database', () => {
  const mockDb: any = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  };
  return {
    db: {},
    dbPromise: Promise.resolve(mockDb),
  };
});

import {
  isExempt,
  addExemption,
  removeExemption,
  getAllExemptions,
} from '../helpers';
import { dbPromise } from '../../database';

let mockDb: any;
beforeAll(async () => {
  mockDb = await dbPromise;
});

describe('MessageLogger Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isExempt', () => {
    it('should return true if user is exempt', async () => {
      mockDb.get.mockResolvedValue({ discordID: '123' });

      const result = await isExempt('123');

      expect(result).toBe(true);
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM MsgLogExemptions'),
        ['123'],
      );
    });

    it('should return false if user is not exempt', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await isExempt('456');

      expect(result).toBe(false);
    });
  });

  describe('addExemption', () => {
    it('should add exemption successfully', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 } as any);

      await expect(addExemption('123')).resolves.toBeUndefined();
    });

    it('should handle database errors', async () => {
      mockDb.run.mockRejectedValue(new Error('Database error'));

      await expect(addExemption('123')).rejects.toThrow('Database error');
    });
  });

  describe('removeExemption', () => {
    it('should remove exemption successfully', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 } as any);

      await expect(removeExemption('123')).resolves.toBeUndefined();
    });

    it('should handle database errors', async () => {
      mockDb.run.mockRejectedValue(new Error('Database error'));

      await expect(removeExemption('123')).rejects.toThrow('Database error');
    });
  });

  describe('getAllExemptions', () => {
    it('should return all exemptions', async () => {
      const mockExemptions = [{ discordID: '123' }, { discordID: '456' }];
      mockDb.all.mockResolvedValue(mockExemptions);

      const result = await getAllExemptions();

      expect(result).toEqual(['123', '456']);
    });
  });
});
