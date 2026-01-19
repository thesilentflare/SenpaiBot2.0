import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Client, Message, User, Guild, Collection } from 'discord.js';

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

// Mock adminManager helpers
jest.mock('../../adminManager/helpers', () => ({
  isAdmin: jest.fn(),
}));

import {
  addUser,
  updateUserName,
  getUserByDiscordID,
  getAllUsers,
  userExists,
} from '../helpers';
import { db } from '../../database';
import { isAdmin } from '../../adminManager/helpers';
import UserManagerModule from '../index';

const mockDb = db as any;
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>;

// Mock Discord.js Message
const createMockMessage = (
  content: string,
  authorId: string = '123456789',
): Partial<Message> => {
  const usersCollection = new Collection<string, User>();
  
  const mockMessage = {
    content,
    reply: jest.fn() as any,
    author: {
      bot: false,
      id: authorId,
      username: 'TestUser',
      tag: 'TestUser#0001',
    },
    mentions: {
      users: usersCollection,
    },
    guild: {
      id: 'test-guild',
    } as Guild,
  } as unknown as Partial<Message>;

  return mockMessage;
};

describe('UserManager Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    test('should add a new user to the database', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await addUser('123456789', 'TestUser');

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)',
        ['123456789', 'TestUser'],
      );
    });

    test('should ignore duplicate users (INSERT OR IGNORE)', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await addUser('123456789', 'TestUser');
      await addUser('123456789', 'DifferentName');

      expect(mockDb.run).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateUserName', () => {
    test('should update an existing user name', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const updated = await updateUserName('123456789', 'NewName');

      expect(updated).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE Users SET name = ? WHERE discordID = ?',
        ['NewName', '123456789'],
      );
    });

    test('should return false when updating non-existent user', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const updated = await updateUserName('999999999', 'SomeName');

      expect(updated).toBe(false);
    });
  });

  describe('getUserByDiscordID', () => {
    test('should return user when they exist', async () => {
      const mockUser = { discordID: '123456789', name: 'TestUser' };
      mockDb.get.mockResolvedValue(mockUser);

      const user = await getUserByDiscordID('123456789');

      expect(user).toBeDefined();
      expect(user?.discordID).toBe('123456789');
      expect(user?.name).toBe('TestUser');
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT discordID, name FROM Users WHERE discordID = ?',
        ['123456789'],
      );
    });

    test('should return null when user does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const user = await getUserByDiscordID('999999999');

      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    test('should return all users ordered by name', async () => {
      const mockUsers = [
        { discordID: '222222222', name: 'Alice' },
        { discordID: '333333333', name: 'Bob' },
        { discordID: '111111111', name: 'Charlie' },
      ];
      mockDb.all.mockResolvedValue(mockUsers);

      const users = await getAllUsers();

      expect(users).toHaveLength(3);
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT discordID, name FROM Users ORDER BY name',
      );
    });

    test('should return empty array when no users exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const users = await getAllUsers();

      expect(users).toHaveLength(0);
    });
  });

  describe('userExists', () => {
    test('should return true when user exists', async () => {
      const mockUser = { discordID: '123456789', name: 'TestUser' };
      mockDb.get.mockResolvedValue(mockUser);

      const exists = await userExists('123456789');

      expect(exists).toBe(true);
    });

    test('should return false when user does not exist', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const exists = await userExists('999999999');

      expect(exists).toBe(false);
    });
  });
});

describe('UserManager Module', () => {
  let mockClient: Partial<Client>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      on: jest.fn(),
      off: jest.fn(),
      channels: {
        fetch: jest.fn(),
      } as any,
    } as Partial<Client>;
  });

  describe('Module Initialization', () => {
    test('should have correct module properties', () => {
      expect(UserManagerModule.name).toBe('userManager');
      expect(UserManagerModule.description).toBe(
        'Manage user registration and information',
      );
      expect(UserManagerModule.enabled).toBe(true);
    });

    test('should initialize and register event listener', async () => {
      await UserManagerModule.initialize(mockClient as Client);

      expect(mockClient.on).toHaveBeenCalledWith(
        'guildMemberAdd',
        expect.any(Function),
      );
    });
  });

  describe('Command Handling - !user info', () => {
    test('should handle !user info for current user', async () => {
      const mockMessage = createMockMessage('!user info');
      const mockUser = { discordID: '123456789', name: 'TestUser' };
      mockDb.get.mockResolvedValue(mockUser);

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'User Information',
            }),
          }),
        ]),
      });
    });

    test('should handle !user info with mentioned user', async () => {
      const mockMessage = createMockMessage('!user info @OtherUser');
      const mockMentionedUser = {
        id: '987654321',
        username: 'OtherUser',
      };
      
      // Properly set up the Collection with the user
      (mockMessage.mentions!.users as Collection<string, User>).set(
        '987654321',
        mockMentionedUser as User,
      );

      const mockUser = { discordID: '987654321', name: 'OtherUser' };
      mockDb.get.mockResolvedValue(mockUser);

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT discordID, name FROM Users WHERE discordID = ?',
        ['987654321'],
      );
    });

    test('should handle user not found', async () => {
      const mockMessage = createMockMessage('!user info');
      mockDb.get.mockResolvedValue(undefined);

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'User Not Found',
            }),
          }),
        ]),
      });
    });
  });

  describe('Command Handling - !user rename', () => {
    test('should rename user when admin', async () => {
      mockIsAdmin.mockResolvedValue(true);

      const mockMessage = createMockMessage('!user rename @target NewName');
      const mockMentionedUser = {
        id: '987654321',
        username: 'OldName',
      };
      
      // Properly set up the Collection with the user
      (mockMessage.mentions!.users as Collection<string, User>).set(
        '987654321',
        mockMentionedUser as User,
      );

      const mockUser = { discordID: '987654321', name: 'OldName' };
      mockDb.get.mockResolvedValue(mockUser);
      mockDb.run.mockResolvedValue({ changes: 1 });

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE Users SET name = ? WHERE discordID = ?',
        ['NewName', '987654321'],
      );
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'User Renamed',
            }),
          }),
        ]),
      });
    });

    test('should deny rename when not admin', async () => {
      mockIsAdmin.mockResolvedValue(false);

      const mockMessage = createMockMessage('!user rename @target NewName');

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'Permission Denied',
            }),
          }),
        ]),
      });
    });

    test('should show usage when invalid arguments', async () => {
      mockIsAdmin.mockResolvedValue(true);

      const mockMessage = createMockMessage('!user rename OnlyOnePart');

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'Invalid Usage',
            }),
          }),
        ]),
      });
    });

    test('should handle user not found during rename', async () => {
      mockIsAdmin.mockResolvedValue(true);

      const mockMessage = createMockMessage(
        '!user rename 999999999 NewName',
      );
      mockDb.get.mockResolvedValue(undefined);

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'User Not Found',
            }),
          }),
        ]),
      });
    });
  });

  describe('Command Handling - !user', () => {
    test('should show usage message when no subcommand', async () => {
      const mockMessage = createMockMessage('!user');

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'User Management Commands',
            }),
          }),
        ]),
      });
    });

    test('should not handle unrelated commands', async () => {
      const mockMessage = createMockMessage('!notuser');

      const handled = await UserManagerModule.handleMessage(
        mockMessage as Message,
      );

      expect(handled).toBe(false);
      expect(mockMessage.reply).not.toHaveBeenCalled();
    });
  });

  describe('Commands Info', () => {
    test('should return command information', () => {
      const commands = UserManagerModule.getCommands();

      expect(commands).toBeDefined();
      expect(commands.length).toBeGreaterThan(0);
      expect(
        commands.some((cmd) => cmd.command.includes('!user info')),
      ).toBe(true);
      expect(
        commands.some((cmd) => cmd.command.includes('!user rename')),
      ).toBe(true);
    });

    test('should have admin-only flag on rename command', () => {
      const commands = UserManagerModule.getCommands();
      const renameCommand = commands.find((cmd) =>
        cmd.command.includes('rename'),
      );

      expect(renameCommand?.adminOnly).toBe(true);
    });

    test('should have non-admin flag on info command', () => {
      const commands = UserManagerModule.getCommands();
      const infoCommand = commands.find((cmd) => cmd.command.includes('info'));

      expect(infoCommand?.adminOnly).toBe(false);
    });
  });

  describe('Cleanup', () => {
    test('should remove event listener on cleanup', async () => {
      await UserManagerModule.initialize(mockClient as Client);
      await UserManagerModule.cleanup();

      expect(mockClient.off).toHaveBeenCalledWith(
        'guildMemberAdd',
        expect.any(Function),
      );
    });
  });
});
