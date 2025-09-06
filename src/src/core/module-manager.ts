import { Container } from './container';
import { EventAggregator } from './event-aggregator';
import { RegionManager } from './region-manager';

/**
 * Module initialization context
 */
export interface ModuleContext {
  readonly container: Container;
  readonly eventAggregator: EventAggregator;
  readonly regionManager: RegionManager;
}

/**
 * Interface for application modules
 */
export interface IModule {
  readonly name: string;
  readonly priority: number;
  initialize(context: ModuleContext): void | Promise<void>;
  dispose?(): void | Promise<void>;
}

/**
 * Base module implementation
 */
export abstract class BaseModule implements IModule {
  public abstract readonly name: string;
  public readonly priority: number = 0;

  constructor(priority: number = 0) {
    this.priority = priority;
  }

  public abstract initialize(context: ModuleContext): void | Promise<void>;

  public dispose(): void | Promise<void> {
    // Override in derived classes if cleanup is needed
  }
}

/**
 * Module dependency information
 */
export interface ModuleDependency {
  name: string;
  required: boolean;
}

/**
 * Advanced module with dependency management
 */
export abstract class DependentModule extends BaseModule {
  public abstract readonly dependencies: ModuleDependency[];

  /**
   * Check if all required dependencies are satisfied
   */
  public areDependenciesSatisfied(availableModules: string[]): boolean {
    return this.dependencies
      .filter(dep => dep.required)
      .every(dep => availableModules.includes(dep.name));
  }

  /**
   * Get missing required dependencies
   */
  public getMissingDependencies(availableModules: string[]): string[] {
    return this.dependencies
      .filter(dep => dep.required && !availableModules.includes(dep.name))
      .map(dep => dep.name);
  }
}

/**
 * Module loading state
 */
export enum ModuleState {
  NotLoaded = 'not-loaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed'
}

/**
 * Module information for tracking
 */
export interface ModuleInfo {
  module: IModule;
  state: ModuleState;
  error?: Error | undefined;
}

/**
 * Module loader and manager
 */
export class ModuleManager {
  private modules = new Map<string, ModuleInfo>();
  private context: ModuleContext;

  constructor(
    container: Container,
    eventAggregator: EventAggregator,
    regionManager: RegionManager
  ) {
    this.context = { container, eventAggregator, regionManager };
  }

  /**
   * Register a module
   */
  public registerModule(module: IModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module '${module.name}' is already registered`);
    }

    this.modules.set(module.name, {
      module,
      state: ModuleState.NotLoaded,
    });
  }

  /**
   * Load and initialize a specific module
   */
  public async loadModule(name: string): Promise<void> {
    const moduleInfo = this.modules.get(name);
    if (!moduleInfo) {
      throw new Error(`Module '${name}' is not registered`);
    }

    if (moduleInfo.state === ModuleState.Loaded) {
      return;
    }

    if (moduleInfo.state === ModuleState.Loading) {
      throw new Error(`Module '${name}' is already being loaded`);
    }

    // Check dependencies for dependent modules
    if (moduleInfo.module instanceof DependentModule) {
      const loadedModules = this.getLoadedModuleNames();
      if (!moduleInfo.module.areDependenciesSatisfied(loadedModules)) {
        const missing = moduleInfo.module.getMissingDependencies(loadedModules);
        throw new Error(`Module '${name}' has missing dependencies: ${missing.join(', ')}`);
      }
    }

    moduleInfo.state = ModuleState.Loading;

    try {
      await moduleInfo.module.initialize(this.context);
      moduleInfo.state = ModuleState.Loaded;
    } catch (error) {
      moduleInfo.state = ModuleState.Failed;
      moduleInfo.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Load all registered modules in priority order
   */
  public async loadAllModules(): Promise<void> {
    // Sort modules by priority (higher priority loads first)
    const modulesToLoad = Array.from(this.modules.values())
      .filter(info => info.state === ModuleState.NotLoaded)
      .sort((a, b) => b.module.priority - a.module.priority);

    const errors: Error[] = [];

    for (const moduleInfo of modulesToLoad) {
      try {
        await this.loadModule(moduleInfo.module.name);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (errors.length > 0) {
      throw new Error(`Failed to load modules: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Unload and dispose a module
   */
  public async unloadModule(name: string): Promise<void> {
    const moduleInfo = this.modules.get(name);
    if (!moduleInfo || moduleInfo.state !== ModuleState.Loaded) {
      return;
    }

    if (moduleInfo.module.dispose) {
      await moduleInfo.module.dispose();
    }

    moduleInfo.state = ModuleState.NotLoaded;
    moduleInfo.error = undefined;
  }

  /**
   * Get module state
   */
  public getModuleState(name: string): ModuleState | undefined {
    return this.modules.get(name)?.state;
  }

  /**
   * Get all registered module names
   */
  public getRegisteredModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get loaded module names
   */
  public getLoadedModuleNames(): string[] {
    return Array.from(this.modules.entries())
      .filter(([, info]) => info.state === ModuleState.Loaded)
      .map(([name]) => name);
  }

  /**
   * Check if a module is loaded
   */
  public isModuleLoaded(name: string): boolean {
    const moduleInfo = this.modules.get(name);
    return moduleInfo ? moduleInfo.state === ModuleState.Loaded : false;
  }

  /**
   * Get module loading errors
   */
  public getModuleErrors(): { name: string; error: Error }[] {
    return Array.from(this.modules.entries())
      .filter(([, info]) => info.state === ModuleState.Failed && info.error)
      .map(([name, info]) => ({ name, error: info.error! }));
  }

  /**
   * Clear all modules
   */
  public async clearAll(): Promise<void> {
    const loadedModules = Array.from(this.modules.entries())
      .filter(([, info]) => info.state === ModuleState.Loaded);

    for (const [name] of loadedModules) {
      await this.unloadModule(name);
    }

    this.modules.clear();
  }
}
