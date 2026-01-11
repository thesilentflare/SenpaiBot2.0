import { Client } from 'discord.js';
import { BotModule, ModuleConfig } from '../types/module';
import * as fs from 'fs';
import * as path from 'path';
import Logger from './logger';

const logger = Logger.forModule('ModuleLoader');

export class ModuleLoader {
  private modules: Map<string, BotModule> = new Map();
  private config: ModuleConfig = {};

  constructor(
    private client: Client,
    configPath?: string,
  ) {
    this.loadConfig(configPath);
  }

  /**
   * Load module configuration from a JSON file
   */
  private loadConfig(configPath?: string): void {
    const defaultPath = path.join(process.cwd(), 'modules.config.json');
    const finalPath = configPath || defaultPath;

    try {
      if (fs.existsSync(finalPath)) {
        const configData = fs.readFileSync(finalPath, 'utf-8');
        this.config = JSON.parse(configData);
        logger.debug(`Loaded config from ${finalPath}`);
      } else {
        logger.warn(
          `Config file not found at ${finalPath}, using defaults`,
        );
      }
    } catch (error) {
      logger.error(`Error loading config`, error);
    }
  }

  /**
   * Dynamically discover and load all modules from the modules directory
   */
  async discoverModules(): Promise<void> {
    const modulesDir = path.join(__dirname, '../modules');

    try {
      const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const moduleName = entry.name;
          const indexPath = path.join(modulesDir, moduleName, 'index.ts');

          // Check if the module has an index.ts file
          if (
            fs.existsSync(indexPath) ||
            fs.existsSync(indexPath.replace('.ts', '.js'))
          ) {
            try {
              const moduleImport = await import(
                `../modules/${moduleName}/index`
              );
              const module: BotModule = moduleImport.default;

              // Check if module should be enabled based on config
              const isEnabled = this.config[moduleName]?.enabled ?? true;
              module.enabled = isEnabled;

              this.modules.set(moduleName, module);
              logger.debug(
                `Discovered module: ${moduleName} (${isEnabled ? 'enabled' : 'disabled'})`,
              );
            } catch (error) {
              logger.error(
                `Error loading module ${moduleName}`,
                error,
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error discovering modules`, error);
    }
  }

  /**
   * Initialize all enabled modules
   */
  async initializeModules(): Promise<void> {
    for (const [name, module] of this.modules) {
      if (module.enabled) {
        try {
          await module.initialize(this.client);
        } catch (error) {
          logger.error(
            `Error initializing module ${name}`,
            error,
          );
        }
      }
    }

    // After all modules are initialized, set module references for help module
    const helpModule = this.modules.get('help');
    if (helpModule && 'setModules' in helpModule) {
      (helpModule as any).setModules(this.getEnabledModules());
    }
  }

  /**
   * Get all enabled modules
   */
  getEnabledModules(): BotModule[] {
    return Array.from(this.modules.values()).filter((module) => module.enabled);
  }

  /**
   * Get a specific module by name
   */
  getModule(name: string): BotModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Enable a module by name
   */
  async enableModule(name: string): Promise<boolean> {
    const module = this.modules.get(name);
    if (!module) {
      logger.error(`Module ${name} not found`);
      return false;
    }

    if (!module.enabled) {
      module.enabled = true;
      await module.initialize(this.client);
      logger.info(`Enabled module: ${name}`);
    }
    return true;
  }

  /**
   * Disable a module by name
   */
  async disableModule(name: string): Promise<boolean> {
    const module = this.modules.get(name);
    if (!module) {
      logger.error(`Module ${name} not found`);
      return false;
    }

    if (module.enabled) {
      module.enabled = false;
      if (module.cleanup) {
        await module.cleanup();
      }
      logger.info(`Disabled module: ${name}`);
    }
    return true;
  }

  /**
   * Cleanup all modules
   */
  async cleanup(): Promise<void> {
    for (const [name, module] of this.modules) {
      if (module.cleanup) {
        try {
          await module.cleanup();
        } catch (error) {
          logger.error(
            `Error cleaning up module ${name}`,
            error,
          );
        }
      }
    }
  }
}
