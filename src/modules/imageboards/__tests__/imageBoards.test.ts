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

import ImageBoardsModule from '../index';

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

describe('ImageBoards Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(ImageBoardsModule.name).toBe('imageBoards');
      expect(ImageBoardsModule.description).toBe('Random imageboard posts');
      expect(ImageBoardsModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      expect(() => ImageBoardsModule.initialize()).not.toThrow();
    });
  });

  describe('Command Handling', () => {
    it('should handle !daily yandere command', async () => {
      const mockMessage = createMockMessage('!daily yandere');
      const handled = await ImageBoardsModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
    });

    it('should handle !daily safebooru command', async () => {
      const mockMessage = createMockMessage('!daily safebooru');
      const handled = await ImageBoardsModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
    });

    it('should handle !daily command', async () => {
      const mockMessage = createMockMessage('!daily');
      const handled = await ImageBoardsModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
    });

    it('should handle !daily all command', async () => {
      const mockMessage = createMockMessage('!daily all');
      const handled = await ImageBoardsModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
    });

    it('should not handle unrelated commands', async () => {
      const mockMessage = createMockMessage('!fortune');
      const handled = await ImageBoardsModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(false);
    });
  });

  describe('Commands Info', () => {
    it('should return command information', () => {
      const commands = ImageBoardsModule.getCommands();

      expect(commands).toHaveLength(5);
      expect(commands[0].command).toBe('!daily');
      expect(commands[2].command).toBe('!daily yandere');
      expect(commands[3].command).toBe('!daily safebooru');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => ImageBoardsModule.cleanup()).not.toThrow();
    });
  });
});
