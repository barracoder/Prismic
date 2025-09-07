/**
 * Service lifetime enumeration
 */
export enum ServiceLifetime {
  /** A new instance is created every time the service is requested */
  Transient = 'transient',
  /** A single instance is created and shared for the entire application lifetime */
  Singleton = 'singleton',
  /** A single instance is created and shared within a scope (e.g., per request) */
  Scoped = 'scoped'
}

/**
 * Interface for service registration
 */
export interface ServiceRegistration<T = unknown> {
  lifetime: ServiceLifetime;
  factory: () => T;
  instance?: T;
}

/**
 * Interface for constructor that can be instantiated
 */
export interface Constructor<T = {}> {
  new (...args: unknown[]): T;
}

/**
 * Type for service identifier (string or constructor)
 */
export type ServiceIdentifier<T = unknown> = string | Constructor<T>;

/**
 * Dependency Injection Container
 * Provides service registration, resolution, and lifetime management
 */
export class Container {
  private services = new Map<ServiceIdentifier, ServiceRegistration>();
  private scopedInstances = new Map<ServiceIdentifier, unknown>();

  /**
   * Register a transient service
   */
  public registerTransient<T>(
    identifier: ServiceIdentifier<T>,
    factory: () => T
  ): Container {
    this.services.set(identifier, {
      lifetime: ServiceLifetime.Transient,
      factory,
    });
    return this;
  }

  /**
   * Register a singleton service
   */
  public registerSingleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: () => T
  ): Container {
    this.services.set(identifier, {
      lifetime: ServiceLifetime.Singleton,
      factory,
    });
    return this;
  }

  /**
   * Register a scoped service
   */
  public registerScoped<T>(
    identifier: ServiceIdentifier<T>,
    factory: () => T
  ): Container {
    this.services.set(identifier, {
      lifetime: ServiceLifetime.Scoped,
      factory,
    });
    return this;
  }

  /**
   * Register an instance as a singleton
   */
  public registerInstance<T>(
    identifier: ServiceIdentifier<T>,
    instance: T
  ): Container {
    this.services.set(identifier, {
      lifetime: ServiceLifetime.Singleton,
      factory: () => instance,
      instance,
    });
    return this;
  }

  /**
   * Resolve a service from the container
   */
  public resolve<T>(identifier: ServiceIdentifier<T>): T {
    const registration = this.services.get(identifier);
    if (!registration) {
      throw new Error(`Service not registered: ${String(identifier)}`);
    }

    switch (registration.lifetime) {
      case ServiceLifetime.Transient:
        return registration.factory() as T;

      case ServiceLifetime.Singleton:
        if (!registration.instance) {
          registration.instance = registration.factory();
        }
        return registration.instance as T;

      case ServiceLifetime.Scoped:
        let scopedInstance = this.scopedInstances.get(identifier);
        if (!scopedInstance) {
          scopedInstance = registration.factory();
          this.scopedInstances.set(identifier, scopedInstance);
        }
        return scopedInstance as T;

      default:
        throw new Error(`Unknown service lifetime: ${registration.lifetime}`);
    }
  }

  /**
   * Check if a service is registered
   */
  public isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.services.has(identifier);
  }

  /**
   * Clear all scoped instances (useful for request boundaries)
   */
  public clearScope(): void {
    this.scopedInstances.clear();
  }

  /**
   * Create a child container that inherits from this container
   */
  public createChild(): Container {
    const child = new Container();
    // Copy parent services to child
    for (const [identifier, registration] of this.services) {
      child.services.set(identifier, registration);
    }
    return child;
  }

  /**
   * Dispose of the container and clean up resources
   */
  public dispose(): void {
    this.services.clear();
    this.scopedInstances.clear();
  }
}
