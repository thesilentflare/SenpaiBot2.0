import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Message } from 'discord.js';

// Mock https module
const mockHttpsResponse = {
  on: jest.fn(),
  setEncoding: jest.fn(),
};

const mockHttpsRequest = {
  on: jest.fn(),
  end: jest.fn(),
  write: jest.fn(),
};

jest.mock('https', () => ({
  get: jest.fn((_url: any, callback: any) => {
    callback(mockHttpsResponse);
    return mockHttpsRequest;
  }),
}));

import WarframeModule from '../index';

const createMockMessage = (content: string): Partial<Message> => {
  return {
    content,
    reply: jest.fn() as any,
    author: {
      bot: false,
      id: '123456789',
      username: 'TestUser',
    },
  } as unknown as Partial<Message>;
};

describe('Warframe Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(WarframeModule.name).toBe('warframe');
      expect(WarframeModule.description).toBe('Warframe codex wiki lookup');
      expect(WarframeModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      expect(() => WarframeModule.initialize()).not.toThrow();
    });
  });

  describe('Command Handling', () => {
    it.skip('should handle !codex command', async () => {
      // Skipped for now as it would make real API calls
      const mockMessage = createMockMessage('!codex Excalibur');
      const handled = await WarframeModule.handleMessage(
        mockMessage as Message,
      );
      expect(handled).toBe(true);
    });

    it('should prompt when no item name provided', async () => {
      const mockMessage = createMockMessage('!codex');
      const handled = await WarframeModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining(
          'Operator, what codex entry are you looking for?',
        ),
      );
    });

    it('should not handle unrelated commands', async () => {
      const mockMessage = createMockMessage('!fortune');
      const handled = await WarframeModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(false);
    });
  });

  describe('Commands Info', () => {
    it('should return command information', () => {
      const commands = WarframeModule.getCommands();

      expect(commands).toHaveLength(1);
      expect(commands[0].command).toBe('!codex <entry name>');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => WarframeModule.cleanup()).not.toThrow();
    });
  });
});
