import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Client } from 'discord.js';

// Mock database before importing module
jest.mock('../../database', () => ({
  db: {},
  dbPromise: Promise.resolve({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn(),
  }),
  initializeDatabase: jest.fn(),
}));

// Mock the helpers module
jest.mock('../helpers', () => ({
  isExempt: jest.fn(),
  addExemption: jest.fn(),
  removeExemption: jest.fn(),
  getAllExemptions: jest.fn(),
}));

import MessageLoggerModule from '../index';

describe('MessageLogger Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(MessageLoggerModule.name).toBe('messageLogger');
      expect(MessageLoggerModule.description).toBe(
        'Logs deleted and edited messages to a specified channel',
      );
      expect(MessageLoggerModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      const mockClient = {
        on: jest.fn(),
      } as unknown as Client;
      expect(() => MessageLoggerModule.initialize(mockClient)).not.toThrow();
    });
  });

  describe('Commands Info', () => {
    it('should return command information with hidden property', () => {
      const commands = MessageLoggerModule.getCommands();

      expect(commands).toHaveLength(2);
      expect(commands[0]).toEqual({
        command: '!logexempt',
        description: 'Toggle your message log exemption status',
        usage: '!logexempt',
        adminOnly: false,
        hidden: true,
      });
      expect(commands[1]).toEqual({
        command: '!logexempt <@user>',
        description:
          'Toggle message log exemption for another user (admin only)',
        usage: '!logexempt @username',
        adminOnly: true,
        hidden: true,
      });
    });

    it('should mark all logexempt commands as hidden', () => {
      const commands = MessageLoggerModule.getCommands();

      commands.forEach((cmd) => {
        expect(cmd.hidden).toBe(true);
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => MessageLoggerModule.cleanup()).not.toThrow();
    });
  });
});
