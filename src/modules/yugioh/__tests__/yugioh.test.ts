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

import YugiohModule from '../index';

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

describe('Yugioh Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(YugiohModule.name).toBe('yugioh');
      expect(YugiohModule.description).toBe(
        'Search for Yu-Gi-Oh! card information',
      );
      expect(YugiohModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
    expect(() => YugiohModule.initialize()).not.toThrow();
  });
});

describe('Command Handling', () => {
  it('should handle !ygo command with card name as misspelling', async () => {
    const mockMessage = createMockMessage('!ygo Dark Magician');
    const handled = await YugiohModule.handleMessage(mockMessage as Message);

    expect(handled).toBe(true);
    expect(mockMessage.reply).toHaveBeenCalledWith(
      expect.stringContaining('Did you mean'),
    );
  });

  it('should prompt when no card name provided', async () => {
      const mockMessage = createMockMessage('!ygo');
      const handled = await YugiohModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining('!yugioh <card name>'),
      );
    });

    it('should not handle unrelated commands', async () => {
      const mockMessage = createMockMessage('!fortune');
      const handled = await YugiohModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(false);
    });
  });

  describe('Commands Info', () => {
    it('should return command information', () => {
      const commands = YugiohModule.getCommands();

      expect(commands).toHaveLength(1);
      expect(commands[0].command).toBe('!yugioh');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => YugiohModule.cleanup()).not.toThrow();
    });
  });
});
