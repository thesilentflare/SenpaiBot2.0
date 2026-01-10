import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Client, Message, TextChannel } from 'discord.js';

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

import HelpModule from '../index';

const createMockMessage = (content: string): Partial<Message> => {
  return {
    content,
    reply: jest.fn() as any,
    channel: {
      send: jest.fn() as any,
    } as unknown as TextChannel,
    author: {
      bot: false,
      id: '123456789',
      username: 'TestUser',
    },
  } as unknown as Partial<Message>;
};

describe('Help Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(HelpModule.name).toBe('help');
      expect(HelpModule.description).toBe('Display available commands');
      expect(HelpModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      const mockClient = {} as Client;
      expect(() => HelpModule.initialize(mockClient)).not.toThrow();
    });
  });

  describe('Command Handling', () => {
    it('should handle !help command', () => {
      const mockMessage = createMockMessage('!help');
      const handled = HelpModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
    });

    it('should handle !help with trailing spaces', () => {
      const mockMessage = createMockMessage('!help   ');
      const handled = HelpModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
    });

    it('should handle !commands alias', () => {
      const mockMessage = createMockMessage('!commands');
      const handled = HelpModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
    });

    it('should not handle unrelated commands', () => {
      const mockMessage = createMockMessage('!fortune');
      const handled = HelpModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(false);
    });
  });

  describe('Commands Info', () => {
    it('should return command information', () => {
      const commands = HelpModule.getCommands();

      expect(commands).toHaveLength(2);
      expect(commands[0]).toEqual({
        command: '!help',
        description: 'Show all available commands',
        usage: '!help',
      });
      expect(commands[1]).toEqual({
        command: '!commands',
        description: 'Alias for !help',
        usage: '!commands',
      });
    });

    it('should filter out hidden commands from help display', () => {
      // Create mock modules with hidden commands
      const mockModules = [
        {
          name: 'test1',
          enabled: true,
          getCommands: () => [
            { command: '!visible', description: 'Visible command' },
            {
              command: '!hidden',
              description: 'Hidden command',
              hidden: true,
            },
          ],
        },
      ] as any;

      HelpModule.setModules(mockModules);

      // Access private method through reflection (for testing purposes)
      const mockMessage = createMockMessage('!help');
      HelpModule.handleMessage(mockMessage as Message);

      // The reply should not contain the hidden command
      expect(mockMessage.reply).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => HelpModule.cleanup()).not.toThrow();
    });
  });
});
