import { IReactModule, ModuleContext, UIContributions, ICommand } from './interfaces';

/**
 * Base module class providing common functionality
 */
export abstract class BaseReactModule implements IReactModule {
  public abstract readonly name: string;
  public readonly version?: string;
  public readonly priority: number = 0;
  public readonly dependencies?: string[];
  
  protected context?: ModuleContext;
  
  constructor(priority: number = 0) {
    this.priority = priority;
  }
  
  /**
   * Initialize the module with the provided context
   */
  public async initialize(context: ModuleContext): Promise<void> {
    this.context = context;
    await this.onInitialize(context);
  }
  
  /**
   * Dispose of the module and clean up resources
   */
  public async dispose(): Promise<void> {
    await this.onDispose();
    this.context = undefined;
  }
  
  /**
   * Override in derived classes for custom initialization
   */
  protected async onInitialize(context: ModuleContext): Promise<void> {
    // Override in derived classes
  }
  
  /**
   * Override in derived classes for custom disposal
   */
  protected async onDispose(): Promise<void> {
    // Override in derived classes
  }
  
  /**
   * Get components that can be dynamically loaded
   */
  public getComponents?(): Record<string, React.ComponentType<any>>;
  
  /**
   * Get UI contributions for dashboard elements
   */
  public getUIContributions?(): UIContributions;
  
  /**
   * Get commands provided by this module
   */
  public getCommands?(): Record<string, ICommand>;
  
  /**
   * Helper method to register services in the container
   */
  protected registerService<T>(
    identifier: string,
    factory: () => T,
    singleton: boolean = true
  ): void {
    if (!this.context) {
      throw new Error('Cannot register services before module initialization');
    }
    
    if (singleton) {
      this.context.container.registerSingleton(identifier, factory);
    } else {
      this.context.container.registerTransient(identifier, factory);
    }
  }
  
  /**
   * Helper method to resolve services from the container
   */
  protected resolveService<T>(identifier: string): T {
    if (!this.context) {
      throw new Error('Cannot resolve services before module initialization');
    }
    
    return this.context.container.resolve<T>(identifier);
  }
  
  /**
   * Helper method to subscribe to events
   */
  protected subscribeToEvent<T>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void {
    if (!this.context) {
      throw new Error('Cannot subscribe to events before module initialization');
    }
    
    const subscription = this.context.eventAggregator.subscribe(eventType, handler);
    return () => subscription.unsubscribe();
  }
  
  /**
   * Helper method to publish events
   */
  protected async publishEvent<T>(event: T): Promise<void> {
    if (!this.context) {
      throw new Error('Cannot publish events before module initialization');
    }
    
    await this.context.eventAggregator.publish(event);
  }
}
