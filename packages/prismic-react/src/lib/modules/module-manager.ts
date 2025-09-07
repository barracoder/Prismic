import { 
  IReactModule, 
  ModuleConfig, 
  ModuleInfo, 
  ModuleState, 
  ModuleContext, 
  IModuleManager,
  UIContributions,
  ICommand
} from './interfaces';
import { BaseEvent } from 'prismic';

/**
 * Event fired when a module state changes
 */
export class ModuleStateChangedEvent extends BaseEvent {
  static readonly TYPE = 'module-state-changed';
  
  constructor(
    public readonly moduleName: string,
    public readonly oldState: ModuleState,
    public readonly newState: ModuleState,
    public readonly error?: Error
  ) {
    super(ModuleStateChangedEvent.TYPE);
  }
}

/**
 * Module loader responsible for dynamically importing modules
 */
export class ReactModuleLoader {
  /**
   * Load a module using dynamic import
   */
  async loadModule(config: ModuleConfig): Promise<IReactModule> {
    try {
      const moduleFactory = await import(/* webpackChunkName: "[request]" */ config.path);
      
      // Support both default export and named export
      const ModuleClass = moduleFactory.default || moduleFactory[config.name];
      
      if (!ModuleClass) {
        throw new Error(`Module class not found in ${config.path}. Expected default export or named export '${config.name}'.`);
      }
      
      // Instantiate the module
      const module = typeof ModuleClass === 'function' ? new ModuleClass() : ModuleClass;
      
      if (!this.isValidModule(module)) {
        throw new Error(`Invalid module: ${config.name}. Must implement IReactModule interface.`);
      }
      
      return module;
    } catch (error) {
      throw new Error(`Failed to load module ${config.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Validate that the loaded object implements IReactModule
   */
  private isValidModule(obj: unknown): obj is IReactModule {
    return obj !== null && 
           obj !== undefined && 
           typeof obj === 'object' &&
           'name' in obj &&
           'priority' in obj &&
           'initialize' in obj &&
           typeof (obj as IReactModule).name === 'string' &&
           typeof (obj as IReactModule).priority === 'number' &&
           typeof (obj as IReactModule).initialize === 'function';
  }
}

/**
 * React Module Manager - orchestrates module loading and lifecycle
 */
export class ReactModuleManager implements IModuleManager {
  private moduleConfigs = new Map<string, ModuleConfig>();
  private moduleInfos = new Map<string, ModuleInfo>();
  private loader = new ReactModuleLoader();
  private stateChangeListeners = new Set<(moduleName: string, state: ModuleState) => void>();
  
  constructor(private context: Omit<ModuleContext, 'moduleManager'>) {}
  
  /**
   * Register a module configuration
   */
  registerModule(config: ModuleConfig): void {
    if (this.moduleConfigs.has(config.name)) {
      throw new Error(`Module ${config.name} is already registered`);
    }
    
    this.moduleConfigs.set(config.name, config);
    this.moduleInfos.set(config.name, {
      config,
      state: ModuleState.NotLoaded
    });
  }
  
  /**
   * Register multiple modules from a catalog
   */
  registerModules(configs: ModuleConfig[]): void {
    configs.forEach(config => this.registerModule(config));
  }
  
  /**
   * Load a specific module
   */
  async loadModule(name: string): Promise<void> {
    const moduleInfo = this.moduleInfos.get(name);
    if (!moduleInfo) {
      throw new Error(`Module ${name} is not registered`);
    }
    
    if (moduleInfo.state === ModuleState.Loaded) {
      return; // Already loaded
    }
    
    if (moduleInfo.state === ModuleState.Loading) {
      // Wait for existing load to complete
      return this.waitForModuleLoad(name);
    }
    
    try {
      this.updateModuleState(name, ModuleState.Loading);
      
      // Check dependencies first
      await this.loadDependencies(moduleInfo.config);
      
      // Load the module
      const module = await this.loader.loadModule(moduleInfo.config);
      
      // Initialize the module
      const moduleContext: ModuleContext = {
        ...this.context,
        moduleManager: this
      };
      
      await module.initialize(moduleContext);
      
      // Update module info
      moduleInfo.module = module;
      moduleInfo.loadTime = new Date();
      this.updateModuleState(name, ModuleState.Loaded);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      moduleInfo.error = err;
      this.updateModuleState(name, ModuleState.Failed, err);
      throw err;
    }
  }
  
  /**
   * Load all auto-load modules
   */
  async loadAllModules(): Promise<void> {
    const autoLoadModules = Array.from(this.moduleConfigs.values())
      .filter(config => config.autoLoad && config.enabled)
      .sort((a, b) => b.priority - a.priority); // Higher priority first
    
    // Load modules in priority order
    for (const config of autoLoadModules) {
      try {
        await this.loadModule(config.name);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load module ${config.name}:`, error);
        // Continue loading other modules even if one fails
      }
    }
  }
  
  /**
   * Unload a module
   */
  async unloadModule(name: string): Promise<void> {
    const moduleInfo = this.moduleInfos.get(name);
    if (!moduleInfo || moduleInfo.state !== ModuleState.Loaded) {
      return;
    }
    
    try {
      // Dispose the module if it supports disposal
      if (moduleInfo.module?.dispose) {
        await moduleInfo.module.dispose();
      }
      
      // Clear module reference
      moduleInfo.module = undefined;
      moduleInfo.error = undefined;
      this.updateModuleState(name, ModuleState.NotLoaded);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      moduleInfo.error = err;
      this.updateModuleState(name, ModuleState.Failed, err);
      throw err;
    }
  }
  
  /**
   * Get module information
   */
  getModuleInfo(name: string): ModuleInfo | undefined {
    return this.moduleInfos.get(name);
  }
  
  /**
   * Get all loaded modules
   */
  getLoadedModules(): ModuleInfo[] {
    return Array.from(this.moduleInfos.values())
      .filter(info => info.state === ModuleState.Loaded);
  }
  
  /**
   * Check if a module is loaded
   */
  isModuleLoaded(name: string): boolean {
    const info = this.moduleInfos.get(name);
    return info?.state === ModuleState.Loaded;
  }
  
  /**
   * Get all UI contributions from loaded modules
   */
  getUIContributions(): UIContributions {
    const contributions: UIContributions = {
      sidebars: [],
      menuItems: [],
      toolbarItems: [],
      statusBarItems: [],
      contextMenus: []
    };
    
    this.getLoadedModules().forEach(moduleInfo => {
      if (moduleInfo.module?.getUIContributions) {
        const moduleContributions = moduleInfo.module.getUIContributions();
        
        if (moduleContributions.sidebars && contributions.sidebars) {
          contributions.sidebars.push(...moduleContributions.sidebars);
        }
        if (moduleContributions.menuItems && contributions.menuItems) {
          contributions.menuItems.push(...moduleContributions.menuItems);
        }
        if (moduleContributions.toolbarItems && contributions.toolbarItems) {
          contributions.toolbarItems.push(...moduleContributions.toolbarItems);
        }
        if (moduleContributions.statusBarItems && contributions.statusBarItems) {
          contributions.statusBarItems.push(...moduleContributions.statusBarItems);
        }
        if (moduleContributions.contextMenus && contributions.contextMenus) {
          contributions.contextMenus.push(...moduleContributions.contextMenus);
        }
      }
    });
    
    // Sort by priority
    contributions.sidebars?.sort((a, b) => b.priority - a.priority);
    contributions.toolbarItems?.sort((a, b) => b.priority - a.priority);
    contributions.statusBarItems?.sort((a, b) => b.priority - a.priority);
    
    return contributions;
  }
  
  /**
   * Get all commands from loaded modules
   */
  getCommands(): Record<string, ICommand> {
    const commands: Record<string, ICommand> = {};
    
    this.getLoadedModules().forEach(moduleInfo => {
      if (moduleInfo.module?.getCommands) {
        const moduleCommands = moduleInfo.module.getCommands();
        Object.assign(commands, moduleCommands);
      }
    });
    
    return commands;
  }
  
  /**
   * Add a module state change listener
   */
  addStateChangeListener(listener: (moduleName: string, state: ModuleState) => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }
  
  /**
   * Load module dependencies
   */
  private async loadDependencies(config: ModuleConfig): Promise<void> {
    if (!config.dependencies || config.dependencies.length === 0) {
      return;
    }
    
    const unloadedDeps = config.dependencies.filter(dep => !this.isModuleLoaded(dep));
    
    for (const dep of unloadedDeps) {
      if (!this.moduleConfigs.has(dep)) {
        throw new Error(`Dependency ${dep} is not registered for module ${config.name}`);
      }
      await this.loadModule(dep);
    }
  }
  
  /**
   * Wait for a module to finish loading
   */
  private async waitForModuleLoad(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkState = () => {
        const info = this.moduleInfos.get(name);
        if (!info) {
          reject(new Error(`Module ${name} not found`));
          return;
        }
        
        if (info.state === ModuleState.Loaded) {
          resolve();
        } else if (info.state === ModuleState.Failed) {
          reject(info.error || new Error(`Module ${name} failed to load`));
        } else {
          // Still loading, check again
          setTimeout(checkState, 100);
        }
      };
      
      checkState();
    });
  }
  
  /**
   * Update module state and notify listeners
   */
  private updateModuleState(name: string, newState: ModuleState, error?: Error): void {
    const moduleInfo = this.moduleInfos.get(name);
    if (!moduleInfo) return;
    
    const oldState = moduleInfo.state;
    moduleInfo.state = newState;
    
    if (error) {
      moduleInfo.error = error;
    }
    
    // Notify listeners
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(name, newState);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error in module state change listener:', err);
      }
    });
    
    // Publish event
    this.context.eventAggregator.publishSync(
      new ModuleStateChangedEvent(name, oldState, newState, error)
    );
  }
}
