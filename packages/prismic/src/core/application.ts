import { Container } from './container';
import { EventAggregator } from './event-aggregator';
import { RegionManager, IRegion } from './region-manager';
import { ModuleManager, IModule } from './module-manager';

/**
 * Application configuration interface
 */
export interface ApplicationConfiguration {
  container?: Container;
  eventAggregator?: EventAggregator;
  regionManager?: RegionManager;
  moduleManager?: ModuleManager;
  autoLoadModules?: boolean;
  rootElement?: HTMLElement;
}

/**
 * Application startup events
 */
export class ApplicationStartingEvent {
  static readonly TYPE = 'application-starting';
  public readonly type = ApplicationStartingEvent.TYPE;
  public readonly timestamp = new Date();
}

export class ApplicationStartedEvent {
  static readonly TYPE = 'application-started';
  public readonly type = ApplicationStartedEvent.TYPE;
  public readonly timestamp = new Date();
}

export class ApplicationShuttingDownEvent {
  static readonly TYPE = 'application-shutting-down';
  public readonly type = ApplicationShuttingDownEvent.TYPE;
  public readonly timestamp = new Date();
}

/**
 * Main application class that orchestrates the entire framework
 */
export class Application {
  private _container: Container;
  private _eventAggregator: EventAggregator;
  private _regionManager: RegionManager;
  private _moduleManager: ModuleManager;
  private _isInitialized = false;
  private _isRunning = false;

  constructor(config: ApplicationConfiguration = {}) {
    this._container = config.container ?? new Container();
    this._eventAggregator = config.eventAggregator ?? new EventAggregator();
    this._regionManager = config.regionManager ?? new RegionManager();
    this._moduleManager = config.moduleManager ?? new ModuleManager(
      this._container,
      this._eventAggregator,
      this._regionManager
    );

    this.registerCoreServices();
  }

  /**
   * Get the dependency injection container
   */
  public get container(): Container {
    return this._container;
  }

  /**
   * Get the event aggregator
   */
  public get eventAggregator(): EventAggregator {
    return this._eventAggregator;
  }

  /**
   * Get the region manager
   */
  public get regionManager(): RegionManager {
    return this._regionManager;
  }

  /**
   * Get the module manager
   */
  public get moduleManager(): ModuleManager {
    return this._moduleManager;
  }

  /**
   * Check if the application is initialized
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Check if the application is running
   */
  public get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    await this._eventAggregator.publish(new ApplicationStartingEvent());
    
    await this.onInitializing();
    
    this._isInitialized = true;
    await this.onInitialized();
  }

  /**
   * Start the application
   */
  public async start(): Promise<void> {
    if (!this._isInitialized) {
      await this.initialize();
    }

    if (this._isRunning) {
      return;
    }

    await this.onStarting();
    
    // Load all registered modules
    await this._moduleManager.loadAllModules();
    
    this._isRunning = true;
    
    await this.onStarted();
    await this._eventAggregator.publish(new ApplicationStartedEvent());
  }

  /**
   * Shutdown the application
   */
  public async shutdown(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    await this._eventAggregator.publish(new ApplicationShuttingDownEvent());
    
    await this.onShuttingDown();
    
    // Clear all modules
    await this._moduleManager.clearAll();
    
    // Clear all regions
    await this._regionManager.clearAll();
    
    // Clear event subscriptions
    this._eventAggregator.clear();
    
    // Dispose container
    this._container.dispose();
    
    this._isRunning = false;
    
    await this.onShutdown();
  }

  /**
   * Register a module with the application
   */
  public registerModule(module: IModule): Application {
    this._moduleManager.registerModule(module);
    return this;
  }

  /**
   * Register a region with the application
   */
  public registerRegion(region: IRegion): Application {
    this._regionManager.registerRegion(region);
    return this;
  }

  /**
   * Register core services in the container
   */
  private registerCoreServices(): void {
    this._container.registerInstance('container', this._container);
    this._container.registerInstance('eventAggregator', this._eventAggregator);
    this._container.registerInstance('regionManager', this._regionManager);
    this._container.registerInstance('moduleManager', this._moduleManager);
    this._container.registerInstance('application', this);
  }

  /**
   * Called during application initialization
   */
  protected async onInitializing(): Promise<void> {
    // Override in derived classes
  }

  /**
   * Called after application initialization
   */
  protected async onInitialized(): Promise<void> {
    // Override in derived classes
  }

  /**
   * Called when the application is starting
   */
  protected async onStarting(): Promise<void> {
    // Override in derived classes
  }

  /**
   * Called after the application has started
   */
  protected async onStarted(): Promise<void> {
    // Override in derived classes
  }

  /**
   * Called when the application is shutting down
   */
  protected async onShuttingDown(): Promise<void> {
    // Override in derived classes
  }

  /**
   * Called after the application has shut down
   */
  protected async onShutdown(): Promise<void> {
    // Override in derived classes
  }
}

/**
 * Application builder for fluent configuration
 */
export class ApplicationBuilder {
  private config: ApplicationConfiguration = {};

  /**
   * Use a custom container
   */
  public useContainer(container: Container): ApplicationBuilder {
    this.config.container = container;
    return this;
  }

  /**
   * Use a custom event aggregator
   */
  public useEventAggregator(eventAggregator: EventAggregator): ApplicationBuilder {
    this.config.eventAggregator = eventAggregator;
    return this;
  }

  /**
   * Use a custom region manager
   */
  public useRegionManager(regionManager: RegionManager): ApplicationBuilder {
    this.config.regionManager = regionManager;
    return this;
  }

  /**
   * Use a custom module manager
   */
  public useModuleManager(moduleManager: ModuleManager): ApplicationBuilder {
    this.config.moduleManager = moduleManager;
    return this;
  }

  /**
   * Configure auto loading of modules
   */
  public configureAutoLoadModules(autoLoad: boolean): ApplicationBuilder {
    this.config.autoLoadModules = autoLoad;
    return this;
  }

  /**
   * Set the root element for the application
   */
  public useRootElement(element: HTMLElement): ApplicationBuilder {
    this.config.rootElement = element;
    return this;
  }

  /**
   * Build the application
   */
  public build(): Application {
    return new Application(this.config);
  }

  /**
   * Build and start the application
   */
  public async buildAndStart(): Promise<Application> {
    const app = this.build();
    await app.start();
    return app;
  }
}
