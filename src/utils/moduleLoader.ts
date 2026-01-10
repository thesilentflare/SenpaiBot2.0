import { Client } from 'discord.js';
import { BotModule, ModuleConfig } from '../types/module';
import * as fs from 'fs';
import * as path from 'path';

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
        console.log(`[ModuleLoader] Loaded config from ${finalPath}`);
      } else {
        console.warn(
          `[ModuleLoader] Config file not found at ${finalPath}, using defaults`,
        );
      }
    } catch (error) {
      console.error(`[ModuleLoader] Error loading config:`, error);
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
              console.log(
                `[ModuleLoader] Discovered module: ${moduleName} (${isEnabled ? 'enabled' : 'disabled'})`,
              );
            } catch (error) {
              console.error(
                `[ModuleLoader] Error loading module ${moduleName}:`,
                error,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(`[ModuleLoader] Error discovering modules:`, error);
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
          console.error(
            `[ModuleLoader] Error initializing module ${name}:`,
            error,
          );
        }
      }
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
      console.error(`[ModuleLoader] Module ${name} not found`);
      return false;
    }

    if (!module.enabled) {
      module.enabled = true;
      await module.initialize(this.client);
      console.log(`[ModuleLoader] Enabled module: ${name}`);
    }
    return true;
  }

  /**
   * Disable a module by name
   */
  async disableModule(name: string): Promise<boolean> {
    const module = this.modules.get(name);
    if (!module) {
      console.error(`[ModuleLoader] Module ${name} not found`);
      return false;
    }

    if (module.enabled) {
      module.enabled = false;
      if (module.cleanup) {
        await module.cleanup();
      }
      console.log(`[ModuleLoader] Disabled module: ${name}`);
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
          console.error(
            `[ModuleLoader] Error cleaning up module ${name}:`,
            error,
          );
        }
      }
    }
  }
}
