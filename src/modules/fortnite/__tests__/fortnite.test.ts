import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Client, Message, TextChannel } from 'discord.js';
import FortniteModule from '../index';

// Mock Discord.js Message and Channel
const createMockMessage = (content: string): Partial<Message> => {
  const mockSentMessage = {
    react: jest.fn<any>().mockResolvedValue(undefined),
  };

  const mockChannel = {
    send: jest.fn<any>().mockResolvedValue(mockSentMessage),
    isSendable: jest.fn<any>().mockReturnValue(true),
  } as any;

  const mockMessage = {
    content,
    reply: jest.fn() as any,
    channel: mockChannel,
    author: {
      bot: false,
      id: '123456789',
      username: 'TestUser',
    },
  } as unknown as Partial<Message>;

  return mockMessage;
};

describe('Fortnite Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(FortniteModule.name).toBe('fortnite');
      expect(FortniteModule.description).toBe(
        'Random Fortnite drop location selector',
      );
      expect(FortniteModule.enabled).toBe(true);
    });

    it('should initialize without errors', () => {
      const mockClient = {} as Client;
      expect(() => FortniteModule.initialize(mockClient)).not.toThrow();
    });
  });

  describe('Command Handling', () => {
    it('should handle !drop command', async () => {
      const mockMessage = createMockMessage('!drop');
      const handled = await FortniteModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect((mockMessage.channel as any).send).toHaveBeenCalledTimes(1);
      expect((mockMessage.channel as any).send).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('We dropping'),
          files: expect.arrayContaining([expect.any(Object)]),
        }),
      );
    });

    it('should handle !wherewedroppingbois command', async () => {
      const mockMessage = createMockMessage('!wherewedroppingbois');
      const handled = await FortniteModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect((mockMessage.channel as any).send).toHaveBeenCalledTimes(1);
      expect((mockMessage.channel as any).send).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('We dropping'),
          files: expect.arrayContaining([expect.any(Object)]),
        }),
      );
    });

    it('should handle commands case-insensitively', async () => {
      const variations = ['!DROP', '!Drop', '!WHEREWEDROPPINGBOIS'];

      for (const variation of variations) {
        jest.clearAllMocks();
        const mockMessage = createMockMessage(variation);
        const handled = await FortniteModule.handleMessage(
          mockMessage as Message,
        );

        expect(handled).toBe(true);
        expect((mockMessage.channel as any).send).toHaveBeenCalledTimes(1);
      }
    });

    it('should not handle unrelated messages', async () => {
      const mockMessage = createMockMessage('!somethingelse');
      const handled = await FortniteModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(false);
      expect((mockMessage.channel as any).send).not.toHaveBeenCalled();
    });

    it('should not handle messages that only contain the word drop', async () => {
      const mockMessage = createMockMessage('drop this message');
      const handled = await FortniteModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(false);
      expect((mockMessage.channel as any).send).not.toHaveBeenCalled();
    });
  });

  describe('getCommands', () => {
    it('should return command information', () => {
      const commands = FortniteModule.getCommands();

      expect(commands).toBeDefined();
      expect(commands?.length).toBe(2);
      expect(commands).toContainEqual(
        expect.objectContaining({
          command: '!drop',
          description: expect.any(String),
        }),
      );
      expect(commands).toContainEqual(
        expect.objectContaining({
          command: '!wherewedroppingbois',
          description: expect.any(String),
        }),
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup without errors', () => {
      expect(() => FortniteModule.cleanup()).not.toThrow();
    });
  });
});
