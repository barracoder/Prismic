/**
 * Base interface for all events
 */
export interface IEvent {
  readonly type: string;
  readonly timestamp: Date;
}

/**
 * Base event class
 */
export abstract class BaseEvent implements IEvent {
  public readonly timestamp: Date;

  constructor(public readonly type: string) {
    this.timestamp = new Date();
  }
}

/**
 * Event handler function type
 */
export type EventHandler<T extends IEvent = IEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription interface
 */
export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * Event aggregator for publish-subscribe messaging
 * Enables loosely coupled communication between components
 */
export class EventAggregator {
  private eventHandlers = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to an event type
   */
  public subscribe<T extends IEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    return {
      unsubscribe: (): void => {
        handlers.delete(handler as EventHandler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      },
    };
  }

  /**
   * Publish an event to all subscribers
   */
  public async publish<T extends IEvent>(event: T): Promise<void> {
    const handlers = this.eventHandlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Publish an event synchronously to all subscribers
   */
  public publishSync<T extends IEvent>(event: T): void {
    const handlers = this.eventHandlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  /**
   * Check if there are any subscribers for an event type
   */
  public hasSubscribers(eventType: string): boolean {
    const handlers = this.eventHandlers.get(eventType);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Get the number of subscribers for an event type
   */
  public getSubscriberCount(eventType: string): number {
    const handlers = this.eventHandlers.get(eventType);
    return handlers ? handlers.size : 0;
  }

  /**
   * Clear all event subscriptions
   */
  public clear(): void {
    this.eventHandlers.clear();
  }

  /**
   * Clear subscriptions for a specific event type
   */
  public clearEventType(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }
}
