import { 
  Application, 
  ApplicationBuilder,
  ApplicationStartingEvent,
  ApplicationStartedEvent,
  ApplicationShuttingDownEvent 
} from '../core/application';
import { Container } from '../core/container';
import { EventAggregator } from '../core/event-aggregator';
import { RegionManager } from '../core/region-manager';
import { ModuleManager, BaseModule, type ModuleContext } from '../core/module-manager';

class TestApplicationModule extends BaseModule {
  public readonly name = 'TestApplicationModule';
  public initializeCalled = false;

  public async initialize(_context: ModuleContext): Promise<void> {
    this.initializeCalled = true;
  }
}

describe('Application', () => {
  let app: Application;

  afterEach(async () => {
    if (app && app.isRunning) {
      await app.shutdown();
    }
  });

  describe('Constructor', () => {
    it('should create application with default configuration', () => {
      // Act
      app = new Application();

      // Assert
      expect(app.container).toBeInstanceOf(Container);
      expect(app.eventAggregator).toBeInstanceOf(EventAggregator);
      expect(app.regionManager).toBeInstanceOf(RegionManager);
      expect(app.moduleManager).toBeInstanceOf(ModuleManager);
      expect(app.isInitialized).toBe(false);
      expect(app.isRunning).toBe(false);
    });

    it('should create application with custom services', () => {
      // Arrange
      const container = new Container();
      const eventAggregator = new EventAggregator();
      const regionManager = new RegionManager();
      const moduleManager = new ModuleManager(container, eventAggregator, regionManager);

      // Act
      app = new Application({
        container,
        eventAggregator,
        regionManager,
        moduleManager
      });

      // Assert
      expect(app.container).toBe(container);
      expect(app.eventAggregator).toBe(eventAggregator);
      expect(app.regionManager).toBe(regionManager);
      expect(app.moduleManager).toBe(moduleManager);
    });
  });

  describe('Initialization', () => {
    it('should initialize application', async () => {
      // Arrange
      app = new Application();
      const eventHandler = jest.fn();
      app.eventAggregator.subscribe(ApplicationStartingEvent.TYPE, eventHandler);

      // Act
      await app.initialize();

      // Assert
      expect(app.isInitialized).toBe(true);
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      // Arrange
      app = new Application();
      await app.initialize();

      // Act
      await app.initialize();

      // Assert
      expect(app.isInitialized).toBe(true);
    });
  });

  describe('Startup', () => {
    it('should start application', async () => {
      // Arrange
      app = new Application();
      const startedHandler = jest.fn();
      app.eventAggregator.subscribe(ApplicationStartedEvent.TYPE, startedHandler);

      // Act
      await app.start();

      // Assert
      expect(app.isInitialized).toBe(true);
      expect(app.isRunning).toBe(true);
      expect(startedHandler).toHaveBeenCalled();
    });

    it('should initialize if not already initialized', async () => {
      // Arrange
      app = new Application();

      // Act
      await app.start();

      // Assert
      expect(app.isInitialized).toBe(true);
      expect(app.isRunning).toBe(true);
    });

    it('should not start twice', async () => {
      // Arrange
      app = new Application();
      await app.start();

      // Act
      await app.start();

      // Assert
      expect(app.isRunning).toBe(true);
    });

    it('should load all modules on start', async () => {
      // Arrange
      app = new Application();
      const module = new TestApplicationModule();
      app.registerModule(module);

      // Act
      await app.start();

      // Assert
      expect(module.initializeCalled).toBe(true);
    });
  });

  describe('Module Registration', () => {
    it('should register modules', () => {
      // Arrange
      app = new Application();
      const module = new TestApplicationModule();

      // Act
      const result = app.registerModule(module);

      // Assert
      expect(result).toBe(app); // Should return self for chaining
      expect(app.moduleManager.getRegisteredModuleNames()).toContain('TestApplicationModule');
    });
  });

  describe('Shutdown', () => {
    it('should shutdown application', async () => {
      // Arrange
      app = new Application();
      await app.start();
      
      const shutdownHandler = jest.fn();
      app.eventAggregator.subscribe(ApplicationShuttingDownEvent.TYPE, shutdownHandler);

      // Act
      await app.shutdown();

      // Assert
      expect(app.isRunning).toBe(false);
      expect(shutdownHandler).toHaveBeenCalled();
    });

    it('should not shutdown if not running', async () => {
      // Arrange
      app = new Application();

      // Act & Assert
      await expect(app.shutdown()).resolves.not.toThrow();
      expect(app.isRunning).toBe(false);
    });
  });

  describe('Core Services Registration', () => {
    it('should register core services in container', () => {
      // Arrange & Act
      app = new Application();

      // Assert
      expect(app.container.isRegistered('container')).toBe(true);
      expect(app.container.isRegistered('eventAggregator')).toBe(true);
      expect(app.container.isRegistered('regionManager')).toBe(true);
      expect(app.container.isRegistered('moduleManager')).toBe(true);
      expect(app.container.isRegistered('application')).toBe(true);
    });

    it('should resolve core services correctly', () => {
      // Arrange
      app = new Application();

      // Act & Assert
      expect(app.container.resolve('container')).toBe(app.container);
      expect(app.container.resolve('eventAggregator')).toBe(app.eventAggregator);
      expect(app.container.resolve('regionManager')).toBe(app.regionManager);
      expect(app.container.resolve('moduleManager')).toBe(app.moduleManager);
      expect(app.container.resolve('application')).toBe(app);
    });
  });
});

describe('ApplicationBuilder', () => {
  describe('Fluent Configuration', () => {
    it('should configure container', () => {
      // Arrange
      const customContainer = new Container();

      // Act
      const builder = new ApplicationBuilder()
        .useContainer(customContainer);

      // Assert
      const app = builder.build();
      expect(app.container).toBe(customContainer);
    });

    it('should configure event aggregator', () => {
      // Arrange
      const customEventAggregator = new EventAggregator();

      // Act
      const builder = new ApplicationBuilder()
        .useEventAggregator(customEventAggregator);

      // Assert
      const app = builder.build();
      expect(app.eventAggregator).toBe(customEventAggregator);
    });

    it('should configure region manager', () => {
      // Arrange
      const customRegionManager = new RegionManager();

      // Act
      const builder = new ApplicationBuilder()
        .useRegionManager(customRegionManager);

      // Assert
      const app = builder.build();
      expect(app.regionManager).toBe(customRegionManager);
    });

    it('should configure auto load modules', () => {
      // Act
      const builder = new ApplicationBuilder()
        .configureAutoLoadModules(true);

      // Assert - This just ensures the configuration is stored, 
      // actual behavior would be tested in integration tests
      const app = builder.build();
      expect(app).toBeInstanceOf(Application);
    });

    it('should support method chaining', () => {
      // Act
      const builder = new ApplicationBuilder()
        .useContainer(new Container())
        .useEventAggregator(new EventAggregator())
        .useRegionManager(new RegionManager())
        .configureAutoLoadModules(true);

      // Assert
      expect(builder).toBeInstanceOf(ApplicationBuilder);
      const app = builder.build();
      expect(app).toBeInstanceOf(Application);
    });

    it('should build and start application', async () => {
      // Arrange
      const builder = new ApplicationBuilder();

      // Act
      const app = await builder.buildAndStart();

      // Assert
      expect(app).toBeInstanceOf(Application);
      expect(app.isRunning).toBe(true);

      // Cleanup
      await app.shutdown();
    });
  });
});
