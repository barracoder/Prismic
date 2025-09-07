import { vi } from 'vitest';
import { Container } from '../core/container';

interface TestService {
  id: number;
}

interface SourceService {
  source: string;
}

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(() => {
    container.dispose();
  });

  describe('Transient Services', () => {
    it('should register and resolve transient services', () => {
      // Arrange
      const factory = vi.fn((): TestService => ({ id: Math.random() }));
      
      // Act
      container.registerTransient('testService', factory);
      const instance1 = container.resolve<TestService>('testService');
      const instance2 = container.resolve<TestService>('testService');
      
      // Assert
      expect(factory).toHaveBeenCalledTimes(2);
      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it('should return different instances each time for transient services', () => {
      // Arrange
      class TestClass {
        constructor(public value?: number) {
          this.value = value ?? Math.random();
        }
      }
      container.registerTransient('TestClass', () => new TestClass());
      
      // Act
      const instance1 = container.resolve<TestClass>('TestClass');
      const instance2 = container.resolve<TestClass>('TestClass');
      
      // Assert
      expect(instance1).not.toBe(instance2);
      expect(instance1.value).not.toBe(instance2.value);
    });
  });

  describe('Singleton Services', () => {
    it('should register and resolve singleton services', () => {
      // Arrange
      const factory = vi.fn((): TestService => ({ id: Math.random() }));
      
      // Act
      container.registerSingleton('testService', factory);
      const instance1 = container.resolve<TestService>('testService');
      const instance2 = container.resolve<TestService>('testService');
      
      // Assert
      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('should return same instance for singleton services', () => {
      // Arrange
      class TestClass {
        constructor(public value?: number) {
          this.value = value ?? Math.random();
        }
      }
      container.registerSingleton('TestClass', () => new TestClass());
      
      // Act
      const instance1 = container.resolve<TestClass>('TestClass');
      const instance2 = container.resolve<TestClass>('TestClass');
      
      // Assert
      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe(instance2.value);
    });
  });

  describe('Scoped Services', () => {
    it('should register and resolve scoped services', () => {
      // Arrange
      const factory = vi.fn((): TestService => ({ id: Math.random() }));
      
      // Act
      container.registerScoped('testService', factory);
      const instance1 = container.resolve<TestService>('testService');
      const instance2 = container.resolve<TestService>('testService');
      
      // Assert
      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('should create new instances after clearing scope', () => {
      // Arrange
      const factory = vi.fn((): TestService => ({ id: Math.random() }));
      container.registerScoped('testService', factory);
      
      // Act
      const instance1 = container.resolve<TestService>('testService');
      container.clearScope();
      const instance2 = container.resolve<TestService>('testService');
      
      // Assert
      expect(factory).toHaveBeenCalledTimes(2);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Instance Registration', () => {
    it('should register and resolve instances', () => {
      // Arrange
      const instance = { id: 'test-instance' };
      
      // Act
      container.registerInstance('testService', instance);
      const resolved = container.resolve('testService');
      
      // Assert
      expect(resolved).toBe(instance);
    });
  });

  describe('Service Registration Check', () => {
    it('should return true for registered services', () => {
      // Arrange
      container.registerSingleton('testService', () => ({}));
      
      // Act & Assert
      expect(container.isRegistered('testService')).toBe(true);
    });

    it('should return false for unregistered services', () => {
      // Act & Assert
      expect(container.isRegistered('nonExistentService')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when resolving unregistered service', () => {
      // Act & Assert
      expect(() => container.resolve('nonExistentService')).toThrow('Service not registered: nonExistentService');
    });
  });

  describe('Child Container', () => {
    it('should create child container with parent services', () => {
      // Arrange
      container.registerSingleton('parentService', () => ({ type: 'parent' }));
      
      // Act
      const child = container.createChild();
      child.registerSingleton('childService', () => ({ type: 'child' }));
      
      // Assert
      expect(child.isRegistered('parentService')).toBe(true);
      expect(child.isRegistered('childService')).toBe(true);
      expect(container.isRegistered('childService')).toBe(false);
    });

    it('should allow child to override parent services', () => {
      // Arrange
      container.registerSingleton('service', (): SourceService => ({ source: 'parent' }));
      const child = container.createChild();
      child.registerSingleton('service', (): SourceService => ({ source: 'child' }));
      
      // Act
      const parentInstance = container.resolve<SourceService>('service');
      const childInstance = child.resolve<SourceService>('service');
      
      // Assert
      expect(parentInstance.source).toBe('parent');
      expect(childInstance.source).toBe('child');
    });
  });

  describe('Disposal', () => {
    it('should clear services and scoped instances on dispose', () => {
      // Arrange
      container.registerSingleton('service1', () => ({}));
      container.registerScoped('service2', () => ({}));
      container.resolve('service2'); // Create scoped instance
      
      // Act
      container.dispose();
      
      // Assert
      expect(() => container.resolve('service1')).toThrow();
      expect(() => container.resolve('service2')).toThrow();
    });
  });
});
