import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from '../../../src/lib/core/container';
import { EventAggregator, BaseEvent } from '../../../src/lib/core/event-aggregator';
import { RegionManager, SingleComponentRegion, MultiComponentRegion } from '../../../src/lib/core/regions';

// Test event classes for EventAggregator tests
class TestEvent extends BaseEvent {
  constructor(public data?: unknown) {
    super('test-event');
  }
}

class MultiTestEvent extends BaseEvent {
  constructor(public value: number) {
    super('multi-test');
  }
}

class CleanupTestEvent extends BaseEvent {
  constructor() {
    super('cleanup-test');
  }
}

class AsyncTestEvent extends BaseEvent {
  constructor() {
    super('async-test');
  }
}

class ErrorTestEvent extends BaseEvent {
  constructor() {
    super('error-test');
  }
}

class SyncTestEvent extends BaseEvent {
  constructor() {
    super('sync-test');
  }
}

describe('Prismic React Framework', () => {
  describe('Container', () => {
    let container: Container;

    beforeEach(() => {
      container = new Container();
    });

    it('should register and resolve services', () => {
      // Register a simple service
      container.registerSingleton('test-service', () => ({ value: 42 }));
      
      // Resolve the service
      const service = container.resolve<{ value: number }>('test-service');
      
      expect(service.value).toBe(42);
    });

    it('should respect service lifetimes', () => {
      // Register singleton
      container.registerSingleton('singleton', () => ({ id: Math.random() }));
      
      // Register transient
      container.registerTransient('transient', () => ({ id: Math.random() }));
      
      const singleton1 = container.resolve<{ id: number }>('singleton');
      const singleton2 = container.resolve<{ id: number }>('singleton');
      
      const transient1 = container.resolve<{ id: number }>('transient');
      const transient2 = container.resolve<{ id: number }>('transient');
      
      expect(singleton1.id).toBe(singleton2.id); // Same instance
      expect(transient1.id).not.toBe(transient2.id); // Different instances
    });

    it('should register services with explicit lifetime', () => {
      container.registerSingleton('scoped-service', () => ({ created: Date.now() }));
      
      const service1 = container.resolve('scoped-service');
      const service2 = container.resolve('scoped-service');
      
      expect(service1).toBe(service2);
    });

    it('should throw error for unregistered service', () => {
      expect(() => {
        container.resolve('non-existent');
      }).toThrow("Service not registered: non-existent");
    });

    it('should check if service is registered', () => {
      expect(container.isRegistered('test')).toBe(false);
      
      container.registerSingleton('test', () => ({}));
      
      expect(container.isRegistered('test')).toBe(true);
    });

    it('should handle dependency injection', () => {
      container.registerSingleton('dependency', () => ({ name: 'dep' }));
      container.registerSingleton('service', (c) => {
        const dep = c?.resolve<{ name: string }>('dependency');
        return { dependency: dep };
      });
      
      const service = container.resolve<{ dependency: { name: string } }>('service');
      expect(service.dependency.name).toBe('dep');
    });

    it('should handle tryResolve for existing services', () => {
      container.registerSingleton('test-service', () => ({ value: 42 }));
      
      const result = container.tryResolve<{ value: number }>('test-service');
      expect(result).toBeDefined();
      expect(result?.value).toBe(42);
    });

    it('should handle tryResolve for non-existing services', () => {
      const result = container.tryResolve('non-existent');
      expect(result).toBeUndefined();
    });

    it('should register scoped services', () => {
      container.registerScoped('scoped-service', () => ({ created: Date.now() }));
      
      const service1 = container.resolve('scoped-service');
      const service2 = container.resolve('scoped-service');
      
      expect(service1).toBe(service2); // Same within scope
    });

    it('should clear scoped instances', () => {
      container.registerScoped('scoped-service', () => ({ created: Date.now() }));
      
      const service1 = container.resolve('scoped-service');
      container.clearScope();
      const service2 = container.resolve('scoped-service');
      
      expect(service1).not.toBe(service2); // Different after scope clear
    });

    it('should create child containers', () => {
      container.registerSingleton('parent-service', () => ({ type: 'parent' }));
      
      const child = container.createChild();
      child.registerSingleton('child-service', () => ({ type: 'child' }));
      
      // Child can resolve parent services
      expect(child.resolve<{ type: string }>('parent-service').type).toBe('parent');
      
      // Child can resolve its own services
      expect(child.resolve<{ type: string }>('child-service').type).toBe('child');
      
      // Parent cannot resolve child services
      expect(() => container.resolve('child-service')).toThrow();
    });

    it('should register instances', () => {
      const instance = { value: 'test-instance' };
      container.registerInstance('test-instance', instance);
      
      const resolved = container.resolve<{ value: string }>('test-instance');
      expect(resolved).toBe(instance);
    });

    it('should dispose container', () => {
      container.registerSingleton('disposable', () => ({ disposed: false }));
      
      expect(() => container.dispose()).not.toThrow();
    });
  });

  describe('EventAggregator', () => {
    let eventAggregator: EventAggregator;

    beforeEach(() => {
      eventAggregator = new EventAggregator();
    });

    it('should publish and subscribe to events', async () => {
      let receivedEvent: TestEvent | null = null;
      
      // Subscribe to events
      eventAggregator.subscribe('test-event', (event: BaseEvent) => {
        receivedEvent = event as TestEvent;
      });
      
      // Publish an event
      const testEvent = new TestEvent('hello world');
      await eventAggregator.publish(testEvent);
      
      expect(receivedEvent).toBe(testEvent);
      expect(receivedEvent).not.toBeNull();
      if (receivedEvent) {
        expect((receivedEvent as TestEvent).data).toBe('hello world');
      }
    });

    it('should handle multiple subscribers', async () => {
      const results: number[] = [];
      
      eventAggregator.subscribe('multi-test', (event) => {
        results.push((event as MultiTestEvent).value * 2);
      });
      
      eventAggregator.subscribe('multi-test', (event) => {
        results.push((event as MultiTestEvent).value * 3);
      });
      
      await eventAggregator.publish(new MultiTestEvent(5));
      
      expect(results).toContain(10); // 5 * 2
      expect(results).toContain(15); // 5 * 3
    });

    it('should handle subscription cleanup', async () => {
      let callCount = 0;
      
      const subscription = eventAggregator.subscribe('cleanup-test', () => {
        callCount++;
      });
      
      await eventAggregator.publish(new CleanupTestEvent());
      expect(callCount).toBe(1);
      
      subscription.unsubscribe();
      
      await eventAggregator.publish(new CleanupTestEvent());
      expect(callCount).toBe(1); // Should not increase
    });

    it('should handle async event handlers', async () => {
      let asyncResult = '';
      
      eventAggregator.subscribe('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        asyncResult = 'async-completed';
      });
      
      await eventAggregator.publish(new AsyncTestEvent());
      expect(asyncResult).toBe('async-completed');
    });

    it('should handle errors in event handlers gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventAggregator.subscribe('error-test', () => {
        throw new Error('Handler error');
      });
      
      // Should not throw
      await expect(eventAggregator.publish(new ErrorTestEvent())).resolves.toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event handler'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should support publishSync for synchronous publishing', () => {
      let received = false;
      
      eventAggregator.subscribe('sync-test', () => {
        received = true;
      });
      
      eventAggregator.publishSync(new SyncTestEvent());
      expect(received).toBe(true);
    });
  });

  describe('RegionManager', () => {
    let regionManager: RegionManager;
    let mockElement: HTMLDivElement;

    beforeEach(() => {
      regionManager = new RegionManager();
      mockElement = document.createElement('div');
    });

    it('should register and manage regions', () => {
      const region = new SingleComponentRegion('test-region', mockElement);
      
      // Register region
      regionManager.registerRegion(region);
      
      // Check if region is registered
      expect(regionManager.hasRegion('test-region')).toBe(true);
      expect(regionManager.getRegion('test-region')).toBe(region);
      expect(regionManager.getRegionNames()).toContain('test-region');
    });

    it('should prevent duplicate region registration', () => {
      const region1 = new SingleComponentRegion('duplicate', mockElement);
      const region2 = new SingleComponentRegion('duplicate', mockElement);
      
      regionManager.registerRegion(region1);
      
      expect(() => {
        regionManager.registerRegion(region2);
      }).toThrow("Region 'duplicate' is already registered");
    });

    it('should unregister regions', () => {
      const region = new SingleComponentRegion('temp-region', mockElement);
      regionManager.registerRegion(region);
      
      expect(regionManager.hasRegion('temp-region')).toBe(true);
      
      regionManager.unregisterRegion('temp-region');
      
      expect(regionManager.hasRegion('temp-region')).toBe(false);
      expect(regionManager.getRegion('temp-region')).toBeUndefined();
    });

    it('should clear all regions', () => {
      const region1 = new SingleComponentRegion('region1', mockElement);
      const region2 = new SingleComponentRegion('region2', mockElement);
      
      regionManager.registerRegion(region1);
      regionManager.registerRegion(region2);
      
      expect(regionManager.getRegionNames()).toHaveLength(2);
      
      regionManager.clearAll();
      
      expect(regionManager.getRegionNames()).toHaveLength(0);
    });

    it('should manage components in single component regions', () => {
      const region = new SingleComponentRegion('test-region', mockElement);
      
      const mockComponent = {
        id: 'test-component',
        component: () => null,
        props: { title: 'Test' },
        isActive: false
      };
      
      // Add component
      region.addComponent(mockComponent);
      
      expect(region.components).toHaveLength(1);
      expect(region.components[0]).toBe(mockComponent);
      expect(region.activeComponent).toBe(mockComponent); // Auto-activated
      expect(mockComponent.isActive).toBe(true);
    });

    it('should handle multiple components in single component region', () => {
      const region = new SingleComponentRegion('multi-test', mockElement);
      
      const component1 = {
        id: 'comp1',
        component: () => null,
        props: {},
        isActive: false
      };
      
      const component2 = {
        id: 'comp2',
        component: () => null,
        props: {},
        isActive: false
      };
      
      region.addComponent(component1);
      expect(region.activeComponent).toBe(component1);
      
      region.addComponent(component2);
      expect(region.activeComponent).toBe(component1); // Still first one
      expect(component2.isActive).toBe(false);
      
      region.activateComponent('comp2');
      expect(region.activeComponent).toBe(component2);
      expect(component1.isActive).toBe(false);
      expect(component2.isActive).toBe(true);
    });

    it('should support multi-component regions', () => {
      const region = new MultiComponentRegion('multi-region', mockElement);
      
      const component1 = {
        id: 'comp1',
        component: () => null,
        props: {},
        isActive: false
      };
      
      const component2 = {
        id: 'comp2',
        component: () => null,
        props: {},
        isActive: false
      };
      
      region.addComponent(component1);
      region.addComponent(component2);
      
      region.activateComponent('comp1');
      region.activateComponent('comp2');
      
      expect(region.activeComponents).toHaveLength(2);
      expect(component1.isActive).toBe(true);
      expect(component2.isActive).toBe(true);
    });

    it('should remove components from regions', () => {
      const region = new SingleComponentRegion('remove-test', mockElement);
      
      const component = {
        id: 'removable',
        component: () => null,
        props: {},
        isActive: false
      };
      
      region.addComponent(component);
      expect(region.components).toHaveLength(1);
      
      region.removeComponent('removable');
      expect(region.components).toHaveLength(0);
      expect(region.activeComponent).toBeNull();
    });

    it('should handle component activation errors', () => {
      const region = new SingleComponentRegion('error-test', mockElement);
      
      expect(() => {
        region.activateComponent('non-existent');
      }).toThrow("Component 'non-existent' is not part of this region");
    });
  });
});
