import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Client, Message } from 'discord.js';
import FortuneModule from '../index';

// Mock Discord.js Message
const createMockMessage = (content: string): Partial<Message> => {
  const mockMessage = {
    content,
    reply: jest.fn() as any,
    author: {
      bot: false,
      id: '123456789',
      username: 'TestUser',
    },
  } as unknown as Partial<Message>;

  return mockMessage;
};

describe('Fortune Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(FortuneModule.name).toBe('fortune');
      expect(FortuneModule.description).toBe('Random fortune cookie messages');
      expect(FortuneModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      const mockClient = {} as Client;
      expect(() => FortuneModule.initialize(mockClient)).not.toThrow();
    });
  });

  describe('Command Handling', () => {
    it('should handle !fortune command', () => {
      const mockMessage = createMockMessage('!fortune');
      const handled = FortuneModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
      expect(mockMessage.reply).toHaveBeenCalledWith(expect.any(String));
    });

    it('should handle !fortune with trailing text', () => {
      const mockMessage = createMockMessage('!fortune please');
      const handled = FortuneModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
    });

    it('should detect common misspellings', () => {
      const misspellings = [
        '!fortun',
        '!forune',
        '!fotune',
        '!fourtune',
        '!FORTUNE',
      ];

      misspellings.forEach((misspelling) => {
        const mockMessage = createMockMessage(misspelling);
        const handled = FortuneModule.handleMessage(mockMessage as Message);

        expect(handled).toBe(true);
        expect(mockMessage.reply).toHaveBeenCalledWith(
          expect.stringContaining('Did you mean'),
        );
      });
    });

    it('should not handle unrelated commands', () => {
      const mockMessage = createMockMessage('!8ball test');
      const handled = FortuneModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(false);
      expect(mockMessage.reply).not.toHaveBeenCalled();
    });

    it('should not handle regular messages', () => {
      const mockMessage = createMockMessage('Hello world');
      const handled = FortuneModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(false);
      expect(mockMessage.reply).not.toHaveBeenCalled();
    });
  });

  describe('Commands Info', () => {
    it('should return command information', () => {
      const commands = FortuneModule.getCommands();

      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual({
        command: '!fortune',
        description: 'Get a random fortune cookie message',
        usage: '!fortune',
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => FortuneModule.cleanup()).not.toThrow();
    });
  });
});
