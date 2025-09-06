/**
 * Service lifetime enumeration
 */
export enum ServiceLifetime {
  /** A new instance is created every time the service is requested */
  Transient = 'transient',
  /** A single instance is created and shared for the entire application lifetime */
  Singleton = 'singleton',
  /** A single instance is created and shared within a scope (e.g., per request) */
  Scoped = 'scoped',
}

/**
 * Interface for service registration
 */
export interface ServiceRegistration<T = unknown> {
  lifetime: ServiceLifetime;
  factory: (container?: Container) => T;
  instance?: T;
}

/**
 * Interface for constructor that can be instantiated
 */
export interface Constructor<T = object> {
  new (...args: unknown[]): T;
}

/**
 * Type for service identifier (string or constructor)
 */
export type ServiceIdentifier<T = unknown> = string | Constructor<T>;

/**
 * Dependency Injection Container for React applications
 * Provides service registration, resolution, and lifetime management
 */
export class Container {
  private services = new Map<string, ServiceRegistration>();
  private scopedInstances = new Map<string, unknown>();

  /**
   * Register a transient service
   */
  registerTransient<T>(identifier: ServiceIdentifier<T>, factory: (container?: Container) => T): Container {
    const key = this.getServiceKey(identifier);
    this.services.set(key, {
      lifetime: ServiceLifetime.Transient,
      factory,
    });
    return this;
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: (container?: Container) => T): Container {
    const key = this.getServiceKey(identifier);
    this.services.set(key, {
      lifetime: ServiceLifetime.Singleton,
      factory,
    });
    return this;
  }

  /**
   * Register a scoped service
   */
  registerScoped<T>(identifier: ServiceIdentifier<T>, factory: (container?: Container) => T): Container {
    const key = this.getServiceKey(identifier);
    this.services.set(key, {
      lifetime: ServiceLifetime.Scoped,
      factory,
    });
    return this;
  }

  /**
   * Register a service with explicit lifetime
   */
  register<T>(identifier: ServiceIdentifier<T>, factory: (container?: Container) => T, lifetime: ServiceLifetime): Container {
    const key = this.getServiceKey(identifier);
    this.services.set(key, {
      lifetime,
      factory,
    });
    return this;
  }

  /**
   * Register an existing instance as a singleton
   */
  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): Container {
    const key = this.getServiceKey(identifier);
    this.services.set(key, {
      lifetime: ServiceLifetime.Singleton,
      factory: () => instance,
      instance,
    });
    return this;
  }

  /**
   * Resolve a service
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const key = this.getServiceKey(identifier);
    const registration = this.services.get(key);

    if (!registration) {
      throw new Error(`Service not registered: ${key}`);
    }

    switch (registration.lifetime) {
      case ServiceLifetime.Singleton:
        if (!registration.instance) {
          registration.instance = registration.factory(this);
        }
        return registration.instance as T;

      case ServiceLifetime.Scoped:
        if (!this.scopedInstances.has(key)) {
          this.scopedInstances.set(key, registration.factory(this));
        }
        return this.scopedInstances.get(key) as T;

      case ServiceLifetime.Transient:
        return registration.factory(this) as T;

      default:
        throw new Error(`Unknown service lifetime: ${registration.lifetime}`);
    }
  }

  /**
   * Try to resolve a service, returning undefined if not found
   */
  tryResolve<T>(identifier: ServiceIdentifier<T>): T | undefined {
    try {
      return this.resolve(identifier);
    } catch {
      return undefined;
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    const key = this.getServiceKey(identifier);
    return this.services.has(key);
  }

  /**
   * Create a child container with access to parent services
   */
  createChild(): Container {
    const child = new Container();
    // Copy parent services to child
    this.services.forEach((registration, key) => {
      child.services.set(key, registration);
    });
    return child;
  }

  /**
   * Clear all scoped instances
   */
  clearScope(): void {
    this.scopedInstances.clear();
  }

  /**
   * Dispose the container and clean up resources
   */
  dispose(): void {
    this.services.clear();
    this.scopedInstances.clear();
  }

  /**
   * Get string key for service identifier
   */
  private getServiceKey<T>(identifier: ServiceIdentifier<T>): string {
    return typeof identifier === 'string' ? identifier : identifier.name;
  }
}
