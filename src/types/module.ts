import { Client, Message } from 'discord.js';

/**
 * Interface that all feature modules must implement
 */
export interface BotModule {
  /** Unique identifier for the module */
  name: string;

  /** Human-readable description of what the module does */
  description: string;

  /** Whether this module is enabled */
  enabled: boolean;

  /**
   * Initialize the module
   * @param client - The Discord client instance
   */
  initialize(client: Client): void | Promise<void>;

  /**
   * Handle incoming messages
   * @param message - The Discord message
   * @returns true if the message was handled, false otherwise
   */
  handleMessage?(message: Message): boolean | Promise<boolean>;

  /**
   * Cleanup when the module is disabled or bot shuts down
   */
  cleanup?(): void | Promise<void>;
}

/**
 * Configuration for module loading
 */
export interface ModuleConfig {
  [moduleName: string]: {
    enabled: boolean;
  };
}
