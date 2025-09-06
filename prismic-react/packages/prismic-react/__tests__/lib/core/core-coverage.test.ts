import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from '../../../src/lib/core/container';
import { EventAggregator, BaseEvent } from '../../../src/lib/core/event-aggregator';
import { RegionManager, SingleComponentRegion, MultiComponentRegion } from '../../../src/lib/core/regions';

// Test event classes
class TestEvent extends BaseEvent {
  constructor(type: string, public data?: unknown) {
    super(type);
  }
}

class SyncTestEvent extends BaseEvent {
  constructor(public value: number) {
    super('sync-test');
  }
}

describe('Core Framework Coverage Tests', () => {
  describe('Container Additional Coverage', () => {
    let container: Container;

    beforeEach(() => {
      container = new Container();
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

    it('should handle transient services', () => {
      container.registerTransient('transient-service', () => ({ created: Date.now() }));
      
      const service1 = container.resolve('transient-service');
      const service2 = container.resolve('transient-service');
      
      expect(service1).not.toBe(service2); // Different instances
    });
  });

  describe('EventAggregator Additional Coverage', () => {
    let eventAggregator: EventAggregator;

    beforeEach(() => {
      eventAggregator = new EventAggregator();
    });

    it('should report if event type has subscribers', () => {
      expect(eventAggregator.hasSubscribers('test')).toBe(false);
      
      eventAggregator.subscribe('test', vi.fn());
      expect(eventAggregator.hasSubscribers('test')).toBe(true);
    });

    it('should return subscriber count', () => {
      expect(eventAggregator.getSubscriberCount('test')).toBe(0);
      
      eventAggregator.subscribe('test', vi.fn());
      eventAggregator.subscribe('test', vi.fn());
      
      expect(eventAggregator.getSubscriberCount('test')).toBe(2);
    });

    it('should clear all subscriptions', () => {
      eventAggregator.subscribe('test1', vi.fn());
      eventAggregator.subscribe('test2', vi.fn());
      
      expect(eventAggregator.hasSubscribers('test1')).toBe(true);
      expect(eventAggregator.hasSubscribers('test2')).toBe(true);
      
      eventAggregator.clear();
      
      expect(eventAggregator.hasSubscribers('test1')).toBe(false);
      expect(eventAggregator.hasSubscribers('test2')).toBe(false);
    });

    it('should clear specific event type subscriptions', () => {
      eventAggregator.subscribe('test1', vi.fn());
      eventAggregator.subscribe('test2', vi.fn());
      
      expect(eventAggregator.hasSubscribers('test1')).toBe(true);
      expect(eventAggregator.hasSubscribers('test2')).toBe(true);
      
      eventAggregator.clearEventType('test1');
      
      expect(eventAggregator.hasSubscribers('test1')).toBe(false);
      expect(eventAggregator.hasSubscribers('test2')).toBe(true);
    });

    it('should handle publishSync with multiple subscribers', () => {
      const results: number[] = [];
      
      eventAggregator.subscribe('sync-test', (event) => {
        results.push((event as unknown as SyncTestEvent).value * 2);
      });
      
      eventAggregator.subscribe('sync-test', (event) => {
        results.push((event as unknown as SyncTestEvent).value * 3);
      });
      
      eventAggregator.publishSync(new SyncTestEvent(5));
      
      expect(results).toEqual([10, 15]);
    });

    it('should handle errors in publishSync', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventAggregator.subscribe('error-test', () => {
        throw new Error('Handler error');
      });
      
      expect(() => eventAggregator.publishSync(new TestEvent('error-test'))).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('RegionManager Additional Coverage', () => {
    let regionManager: RegionManager;

    beforeEach(() => {
      regionManager = new RegionManager();
    });

    it('should handle region names retrieval', () => {
      expect(regionManager.getRegionNames()).toEqual([]);
      
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const region1 = new SingleComponentRegion('test1', element1);
      const region2 = new MultiComponentRegion('test2', element2);
      
      regionManager.registerRegion(region1);
      regionManager.registerRegion(region2);
      
      const names = regionManager.getRegionNames();
      expect(names).toContain('test1');
      expect(names).toContain('test2');
      expect(names).toHaveLength(2);
    });

    it('should clear all regions', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const region1 = new SingleComponentRegion('test1', element1);
      const region2 = new MultiComponentRegion('test2', element2);
      
      regionManager.registerRegion(region1);
      regionManager.registerRegion(region2);
      
      expect(regionManager.hasRegion('test1')).toBe(true);
      expect(regionManager.hasRegion('test2')).toBe(true);
      
      regionManager.clearAll();
      
      expect(regionManager.hasRegion('test1')).toBe(false);
      expect(regionManager.hasRegion('test2')).toBe(false);
    });

    it('should handle unregistering regions', () => {
      const element = document.createElement('div');
      const region = new SingleComponentRegion('test', element);
      regionManager.registerRegion(region);
      
      expect(regionManager.hasRegion('test')).toBe(true);
      
      regionManager.unregisterRegion('test');
      
      expect(regionManager.hasRegion('test')).toBe(false);
    });

    it('should handle components in single component regions', () => {
      const element = document.createElement('div');
      const region = new SingleComponentRegion('test', element);
      regionManager.registerRegion(region);
      
      const mockComponent = () => 'Test Component';
      const component1 = {
        id: 'comp1',
        component: mockComponent,
        props: {},
        isActive: false
      };
      
      region.addComponent(component1);
      expect(region.activeComponent?.id).toBe('comp1');
      expect(region.getComponents()).toHaveLength(1);
      
      // Adding another component to a single region allows both (current implementation)
      const mockComponent2 = () => 'Test Component 2';
      const component2 = {
        id: 'comp2',
        component: mockComponent2,
        props: {},
        isActive: false
      };
      region.addComponent(component2);
      expect(region.activeComponent?.id).toBe('comp1'); // First component stays active
      expect(region.getComponents()).toHaveLength(2); // Both components exist
    });

    it('should handle multi-component regions', () => {
      const element = document.createElement('div');
      const region = new MultiComponentRegion('multi-test', element);
      regionManager.registerRegion(region);
      
      const comp1 = () => 'Component 1';
      const comp2 = () => 'Component 2';
      
      const component1 = {
        id: 'comp1',
        component: comp1,
        props: {},
        isActive: false
      };
      
      const component2 = {
        id: 'comp2',
        component: comp2,
        props: {},
        isActive: false
      };
      
      region.addComponent(component1);
      region.addComponent(component2);
      
      expect(region.getComponents()).toHaveLength(2);
      expect(region.getComponents().map(c => c.id)).toContain('comp1');
      expect(region.getComponents().map(c => c.id)).toContain('comp2');
      
      region.removeComponent('comp1');
      expect(region.getComponents()).toHaveLength(1);
      expect(region.getComponents().map(c => c.id)).toContain('comp2');
      expect(region.getComponents().map(c => c.id)).not.toContain('comp1');
    });

    it('should handle component activation in single component regions', () => {
      const element = document.createElement('div');
      const region = new SingleComponentRegion('activation-test', element);
      regionManager.registerRegion(region);
      
      const comp1 = () => 'Component 1';
      const comp2 = () => 'Component 2';
      
      const component1 = {
        id: 'comp1',
        component: comp1,
        props: {},
        isActive: false
      };
      
      const component2 = {
        id: 'comp2',
        component: comp2,
        props: {},
        isActive: false
      };
      
      region.addComponent(component1);
      region.addComponent(component2);
      
      // Should have comp1 active (first added in SingleComponentRegion)
      expect(region.activeComponent?.id).toBe('comp1');
      
      // Activate comp2
      region.activateComponent('comp2');
      expect(region.activeComponent?.id).toBe('comp2');
    });

    it('should handle region update callbacks', () => {
      const element = document.createElement('div');
      const region = new SingleComponentRegion('callback-test', element);
      const updateSpy = vi.fn();
      
      region.setUpdateCallback(updateSpy);
      regionManager.registerRegion(region);
      
      const component = {
        id: 'comp1',
        component: () => 'Test Component',
        props: {},
        isActive: false
      };
      region.addComponent(component);
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});
