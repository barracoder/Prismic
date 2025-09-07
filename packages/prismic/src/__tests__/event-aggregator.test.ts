import { vi } from 'vitest';
import { EventAggregator, BaseEvent } from '../core/event-aggregator';

class TestEvent extends BaseEvent {
  static readonly TYPE = 'test-event';
  
  constructor(public readonly data: string) {
    super(TestEvent.TYPE);
  }
}

class AnotherEvent extends BaseEvent {
  static readonly TYPE = 'another-event';
  
  constructor(public readonly value: number) {
    super(AnotherEvent.TYPE);
  }
}

describe('EventAggregator', () => {
  let eventAggregator: EventAggregator;

  beforeEach(() => {
    eventAggregator = new EventAggregator();
  });

  afterEach(() => {
    eventAggregator.clear();
  });

  describe('Subscribe and Publish', () => {
    it('should subscribe to events and receive notifications', async () => {
      // Arrange
      const handler = vi.fn();
      eventAggregator.subscribe(TestEvent.TYPE, handler);
      const event = new TestEvent('test data');

      // Act
      await eventAggregator.publish(event);

      // Assert
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle multiple subscribers for the same event', async () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventAggregator.subscribe(TestEvent.TYPE, handler1);
      eventAggregator.subscribe(TestEvent.TYPE, handler2);
      const event = new TestEvent('test data');

      // Act
      await eventAggregator.publish(event);

      // Assert
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should not notify unsubscribed handlers', async () => {
      // Arrange
      const handler = vi.fn();
      const subscription = eventAggregator.subscribe(TestEvent.TYPE, handler);
      subscription.unsubscribe();
      const event = new TestEvent('test data');

      // Act
      await eventAggregator.publish(event);

      // Assert
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle async event handlers', async () => {
      // Arrange
      const asyncHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      eventAggregator.subscribe(TestEvent.TYPE, asyncHandler);
      const event = new TestEvent('test data');

      // Act
      await eventAggregator.publish(event);

      // Assert
      expect(asyncHandler).toHaveBeenCalledWith(event);
    });

    it('should handle errors in event handlers gracefully', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();
      
      eventAggregator.subscribe(TestEvent.TYPE, errorHandler);
      eventAggregator.subscribe(TestEvent.TYPE, normalHandler);
      const event = new TestEvent('test data');

      // Act
      await eventAggregator.publish(event);

      // Assert
      expect(errorHandler).toHaveBeenCalledWith(event);
      expect(normalHandler).toHaveBeenCalledWith(event);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error in event handler for ${TestEvent.TYPE}:`,
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Synchronous Publishing', () => {
    it('should publish events synchronously', () => {
      // Arrange
      const handler = vi.fn();
      eventAggregator.subscribe(TestEvent.TYPE, handler);
      const event = new TestEvent('test data');

      // Act
      eventAggregator.publishSync(event);

      // Assert
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should handle errors in sync handlers gracefully', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('Sync handler error');
      });
      const normalHandler = vi.fn();
      
      eventAggregator.subscribe(TestEvent.TYPE, errorHandler);
      eventAggregator.subscribe(TestEvent.TYPE, normalHandler);
      const event = new TestEvent('test data');

      // Act
      eventAggregator.publishSync(event);

      // Assert
      expect(errorHandler).toHaveBeenCalledWith(event);
      expect(normalHandler).toHaveBeenCalledWith(event);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error in event handler for ${TestEvent.TYPE}:`,
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Subscription Management', () => {
    it('should return subscription object with unsubscribe method', () => {
      // Arrange
      const handler = vi.fn();

      // Act
      const subscription = eventAggregator.subscribe(TestEvent.TYPE, handler);

      // Assert
      expect(subscription).toHaveProperty('unsubscribe');
      expect(typeof subscription.unsubscribe).toBe('function');
    });

    it('should clean up event type when all handlers are unsubscribed', () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const subscription1 = eventAggregator.subscribe(TestEvent.TYPE, handler1);
      const subscription2 = eventAggregator.subscribe(TestEvent.TYPE, handler2);

      // Act
      subscription1.unsubscribe();
      expect(eventAggregator.hasSubscribers(TestEvent.TYPE)).toBe(true);
      
      subscription2.unsubscribe();
      
      // Assert
      expect(eventAggregator.hasSubscribers(TestEvent.TYPE)).toBe(false);
    });
  });

  describe('Subscriber Queries', () => {
    it('should check if event type has subscribers', () => {
      // Arrange
      const handler = vi.fn();

      // Act & Assert
      expect(eventAggregator.hasSubscribers(TestEvent.TYPE)).toBe(false);
      
      eventAggregator.subscribe(TestEvent.TYPE, handler);
      expect(eventAggregator.hasSubscribers(TestEvent.TYPE)).toBe(true);
    });

    it('should return correct subscriber count', () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // Act & Assert
      expect(eventAggregator.getSubscriberCount(TestEvent.TYPE)).toBe(0);
      
      eventAggregator.subscribe(TestEvent.TYPE, handler1);
      expect(eventAggregator.getSubscriberCount(TestEvent.TYPE)).toBe(1);
      
      eventAggregator.subscribe(TestEvent.TYPE, handler2);
      expect(eventAggregator.getSubscriberCount(TestEvent.TYPE)).toBe(2);
    });
  });

  describe('Event Type Isolation', () => {
    it('should only notify handlers for specific event types', async () => {
      // Arrange
      const testHandler = vi.fn();
      const anotherHandler = vi.fn();
      
      eventAggregator.subscribe(TestEvent.TYPE, testHandler);
      eventAggregator.subscribe(AnotherEvent.TYPE, anotherHandler);
      
      const testEvent = new TestEvent('test data');
      const anotherEvent = new AnotherEvent(42);

      // Act
      await eventAggregator.publish(testEvent);
      await eventAggregator.publish(anotherEvent);

      // Assert
      expect(testHandler).toHaveBeenCalledWith(testEvent);
      expect(testHandler).not.toHaveBeenCalledWith(anotherEvent);
      expect(anotherHandler).toHaveBeenCalledWith(anotherEvent);
      expect(anotherHandler).not.toHaveBeenCalledWith(testEvent);
    });
  });

  describe('Cleanup', () => {
    it('should clear all subscriptions', () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventAggregator.subscribe(TestEvent.TYPE, handler1);
      eventAggregator.subscribe(AnotherEvent.TYPE, handler2);

      // Act
      eventAggregator.clear();

      // Assert
      expect(eventAggregator.hasSubscribers(TestEvent.TYPE)).toBe(false);
      expect(eventAggregator.hasSubscribers(AnotherEvent.TYPE)).toBe(false);
    });

    it('should clear subscriptions for specific event type', () => {
      // Arrange
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventAggregator.subscribe(TestEvent.TYPE, handler1);
      eventAggregator.subscribe(AnotherEvent.TYPE, handler2);

      // Act
      eventAggregator.clearEventType(TestEvent.TYPE);

      // Assert
      expect(eventAggregator.hasSubscribers(TestEvent.TYPE)).toBe(false);
      expect(eventAggregator.hasSubscribers(AnotherEvent.TYPE)).toBe(true);
    });
  });

  describe('BaseEvent', () => {
    it('should have correct type and timestamp', () => {
      // Arrange
      const beforeTime = new Date();
      
      // Act
      const event = new TestEvent('test data');
      const afterTime = new Date();

      // Assert
      expect(event.type).toBe(TestEvent.TYPE);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
