import { 
  ModuleManager, 
  BaseModule, 
  DependentModule, 
  ModuleState,
  type ModuleContext 
} from '../core/module-manager';
import { Container } from '../core/container';
import { EventAggregator } from '../core/event-aggregator';
import { RegionManager } from '../core/region-manager';

class TestModule extends BaseModule {
  public readonly name = 'TestModule';
  public initializeCalled = false;
  public disposeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }

  public override async dispose(): Promise<void> {
    this.disposeCalled = true;
  }
}

class LowPriorityModule extends BaseModule {
  public readonly name = 'LowPriority';
  public override readonly priority = 10;
  public initializeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }
}

class HighPriorityModule extends BaseModule {
  public readonly name = 'HighPriority';
  public override readonly priority = 100;
  public initializeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }
}

class Module1 extends BaseModule {
  public readonly name = 'Module1';
  public initializeCalled = false;
  public disposeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }

  public override async dispose(): Promise<void> {
    this.disposeCalled = true;
  }
}

class Module2 extends BaseModule {
  public readonly name = 'Module2';
  public initializeCalled = false;
  public disposeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }

  public override async dispose(): Promise<void> {
    this.disposeCalled = true;
  }
}

class FailingModule extends BaseModule {
  public readonly name = 'FailingModule';

  public async initialize(_context: ModuleContext): Promise<void> {
    throw new Error('Module failed to initialize');
  }
}

class DependentTestModule extends DependentModule {
  public readonly name = 'DependentTestModule';
  public readonly dependencies = [
    { name: 'TestModule', required: true },
    { name: 'OptionalModule', required: false }
  ];
  public initializeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }
}

describe('ModuleManager', () => {
  let moduleManager: ModuleManager;
  let container: Container;
  let eventAggregator: EventAggregator;
  let regionManager: RegionManager;

  beforeEach(() => {
    container = new Container();
    eventAggregator = new EventAggregator();
    regionManager = new RegionManager();
    moduleManager = new ModuleManager(container, eventAggregator, regionManager);
  });

  afterEach(async () => {
    await moduleManager.clearAll();
    container.dispose();
    eventAggregator.clear();
  });

  describe('Module Registration', () => {
    it('should register modules', () => {
      // Arrange
      const module = new TestModule();

      // Act
      moduleManager.registerModule(module);

      // Assert
      expect(moduleManager.getRegisteredModuleNames()).toContain('TestModule');
      expect(moduleManager.getModuleState('TestModule')).toBe(ModuleState.NotLoaded);
    });

    it('should throw error when registering duplicate module names', () => {
      // Arrange
      const module1 = new TestModule();
      const module2 = new TestModule();
      moduleManager.registerModule(module1);

      // Act & Assert
      expect(() => moduleManager.registerModule(module2)).toThrow(
        "Module 'TestModule' is already registered"
      );
    });
  });

  describe('Module Loading', () => {
    it('should load and initialize module', async () => {
      // Arrange
      const module = new TestModule();
      moduleManager.registerModule(module);

      // Act
      await moduleManager.loadModule('TestModule');

      // Assert
      expect(module.initializeCalled).toBe(true);
      expect(moduleManager.getModuleState('TestModule')).toBe(ModuleState.Loaded);
      expect(moduleManager.isModuleLoaded('TestModule')).toBe(true);
    });

    it('should throw error when loading unregistered module', async () => {
      // Act & Assert
      await expect(moduleManager.loadModule('NonExistentModule')).rejects.toThrow(
        "Module 'NonExistentModule' is not registered"
      );
    });

    it('should not reload already loaded module', async () => {
      // Arrange
      const module = new TestModule();
      moduleManager.registerModule(module);
      await moduleManager.loadModule('TestModule');
      module.initializeCalled = false;

      // Act
      await moduleManager.loadModule('TestModule');

      // Assert
      expect(module.initializeCalled).toBe(false);
    });

    it('should throw error when loading module that is already loading', async () => {
      // Arrange
      const module = new TestModule();
      moduleManager.registerModule(module);
      
      // Mock the initialize method to be slow
      module.initialize = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Act
      const loadPromise1 = moduleManager.loadModule('TestModule');
      
      // Assert
      await expect(moduleManager.loadModule('TestModule')).rejects.toThrow(
        "Module 'TestModule' is already being loaded"
      );
      
      await loadPromise1;
    });

    it('should handle module initialization failures', async () => {
      // Arrange
      const module = new FailingModule();
      moduleManager.registerModule(module);

      // Act & Assert
      await expect(moduleManager.loadModule('FailingModule')).rejects.toThrow(
        'Module failed to initialize'
      );
      expect(moduleManager.getModuleState('FailingModule')).toBe(ModuleState.Failed);
    });
  });

  describe('Module Dependencies', () => {
    it('should check if dependencies are satisfied', () => {
      // Arrange
      const dependentModule = new DependentTestModule();
      const availableModules = ['TestModule', 'AnotherModule'];

      // Act
      const satisfied = dependentModule.areDependenciesSatisfied(availableModules);

      // Assert
      expect(satisfied).toBe(true);
    });

    it('should identify missing dependencies', () => {
      // Arrange
      const dependentModule = new DependentTestModule();
      const availableModules = ['AnotherModule'];

      // Act
      const missing = dependentModule.getMissingDependencies(availableModules);

      // Assert
      expect(missing).toEqual(['TestModule']);
    });

    it('should throw error when loading module with missing dependencies', async () => {
      // Arrange
      const dependentModule = new DependentTestModule();
      moduleManager.registerModule(dependentModule);

      // Act & Assert
      await expect(moduleManager.loadModule('DependentTestModule')).rejects.toThrow(
        "Module 'DependentTestModule' has missing dependencies: TestModule"
      );
    });

    it('should load dependent module when dependencies are satisfied', async () => {
      // Arrange
      const testModule = new TestModule();
      const dependentModule = new DependentTestModule();
      
      moduleManager.registerModule(testModule);
      moduleManager.registerModule(dependentModule);
      
      await moduleManager.loadModule('TestModule');

      // Act
      await moduleManager.loadModule('DependentTestModule');

      // Assert
      expect(dependentModule.initializeCalled).toBe(true);
      expect(moduleManager.isModuleLoaded('DependentTestModule')).toBe(true);
    });
  });

  describe('Load All Modules', () => {
    it('should load all modules in priority order', async () => {
      // Arrange
      const lowPriorityModule = new LowPriorityModule();
      const highPriorityModule = new HighPriorityModule();

      const initOrder: string[] = [];
      lowPriorityModule.initialize = jest.fn(async () => {
        initOrder.push('LowPriority');
      });
      highPriorityModule.initialize = jest.fn(async () => {
        initOrder.push('HighPriority');
      });

      moduleManager.registerModule(lowPriorityModule);
      moduleManager.registerModule(highPriorityModule);

      // Act
      await moduleManager.loadAllModules();

      // Assert
      expect(initOrder).toEqual(['HighPriority', 'LowPriority']);
    });

    it('should continue loading other modules when one fails', async () => {
      // Arrange
      const goodModule = new TestModule();
      const badModule = new FailingModule();
      
      moduleManager.registerModule(goodModule);
      moduleManager.registerModule(badModule);

      // Act & Assert
      await expect(moduleManager.loadAllModules()).rejects.toThrow(
        'Failed to load modules:'
      );
      
      expect(moduleManager.isModuleLoaded('TestModule')).toBe(true);
      expect(moduleManager.getModuleState('FailingModule')).toBe(ModuleState.Failed);
    });
  });

  describe('Module Unloading', () => {
    it('should unload and dispose module', async () => {
      // Arrange
      const module = new TestModule();
      moduleManager.registerModule(module);
      await moduleManager.loadModule('TestModule');

      // Act
      await moduleManager.unloadModule('TestModule');

      // Assert
      expect(module.disposeCalled).toBe(true);
      expect(moduleManager.getModuleState('TestModule')).toBe(ModuleState.NotLoaded);
      expect(moduleManager.isModuleLoaded('TestModule')).toBe(false);
    });

    it('should not throw when unloading unloaded module', async () => {
      // Arrange
      const module = new TestModule();
      moduleManager.registerModule(module);

      // Act & Assert
      await expect(moduleManager.unloadModule('TestModule')).resolves.not.toThrow();
    });
  });

  describe('Module State Management', () => {
    it('should return undefined for unregistered module state', () => {
      // Act
      const state = moduleManager.getModuleState('NonExistent');

      // Assert
      expect(state).toBeUndefined();
    });

    it('should return loaded module names', async () => {
      // Arrange
      const module1 = new Module1();
      const module2 = new Module2();
      
      moduleManager.registerModule(module1);
      moduleManager.registerModule(module2);
      
      await moduleManager.loadModule('Module1');

      // Act
      const loadedModules = moduleManager.getLoadedModuleNames();

      // Assert
      expect(loadedModules).toEqual(['Module1']);
    });

    it('should return module errors', async () => {
      // Arrange
      const module = new FailingModule();
      moduleManager.registerModule(module);
      
      try {
        await moduleManager.loadModule('FailingModule');
      } catch {
        // Expected
      }

      // Act
      const errors = moduleManager.getModuleErrors();

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].name).toBe('FailingModule');
      expect(errors[0].error.message).toBe('Module failed to initialize');
    });
  });

  describe('Clear All', () => {
    it('should unload all modules and clear registry', async () => {
      // Arrange
      const module1 = new Module1();
      const module2 = new Module2();
      
      moduleManager.registerModule(module1);
      moduleManager.registerModule(module2);
      
      await moduleManager.loadModule('Module1');
      await moduleManager.loadModule('Module2');

      // Act
      await moduleManager.clearAll();

      // Assert
      expect(module1.disposeCalled).toBe(true);
      expect(module2.disposeCalled).toBe(true);
      expect(moduleManager.getRegisteredModuleNames()).toHaveLength(0);
    });
  });
});
