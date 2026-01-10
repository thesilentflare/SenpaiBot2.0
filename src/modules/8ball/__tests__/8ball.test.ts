import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Client, Message } from 'discord.js';
import EightBallModule from '../index';

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

describe('8ball Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(EightBallModule.name).toBe('8ball');
      expect(EightBallModule.description).toBe('Magic 8-ball fortune telling');
      expect(EightBallModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      const mockClient = {} as Client;
      expect(() => EightBallModule.initialize(mockClient)).not.toThrow();
    });
  });

  describe('Command Handling', () => {
    it('should handle valid !8ball command with question', () => {
      const mockMessage = createMockMessage('!8ball Will I be successful?');
      const handled = EightBallModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
      expect(mockMessage.reply).toHaveBeenCalledWith(expect.any(String));
    });

    it('should prompt for question when no question provided', () => {
      const mockMessage = createMockMessage('!8ball');
      const handled = EightBallModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining('Please ask me a question'),
      );
    });

    it('should handle !8ball with just spaces', () => {
      const mockMessage = createMockMessage('!8ball   ');
      const handled = EightBallModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining('Please ask me a question'),
      );
    });

    it('should detect common misspellings', () => {
      const misspellings = ['!8bal', '!8bll', '!8aball', '!8BALL'];

      misspellings.forEach((misspelling) => {
        const mockMessage = createMockMessage(misspelling);
        const handled = EightBallModule.handleMessage(mockMessage as Message);

        expect(handled).toBe(true);
        expect(mockMessage.reply).toHaveBeenCalledWith(
          expect.stringContaining('Did you mean'),
        );
      });
    });

    it('should not handle unrelated commands', () => {
      const mockMessage = createMockMessage('!fortune');
      const handled = EightBallModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(false);
      expect(mockMessage.reply).not.toHaveBeenCalled();
    });

    it('should not handle regular messages', () => {
      const mockMessage = createMockMessage('Hello world');
      const handled = EightBallModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(false);
      expect(mockMessage.reply).not.toHaveBeenCalled();
    });
  });

  describe('Commands Info', () => {
    it('should return command information', () => {
      const commands = EightBallModule.getCommands();

      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual({
        command: '!8ball',
        description: 'Ask the magic 8-ball a question',
        usage: '!8ball <your question>',
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => EightBallModule.cleanup()).not.toThrow();
    });
  });
});
