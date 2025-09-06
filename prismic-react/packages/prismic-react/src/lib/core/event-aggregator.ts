/**
 * Base class for all events in the system
 */
export abstract class BaseEvent {
  public readonly timestamp: Date;

  constructor(
    public readonly eventType: string,
    public readonly source?: string
  ) {
    this.timestamp = new Date();
  }
}

/**
 * Event subscription interface
 */
export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * Event handler function type
 */
export type EventHandler<T extends BaseEvent> = (event: T) => void | Promise<void>;

/**
 * Event Aggregator for pub/sub communication
 */
export class EventAggregator {
  private subscriptions = new Map<string, EventHandler<BaseEvent>[]>();

  /**
   * Subscribe to an event type
   */
  subscribe<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const handlers = this.subscriptions.get(eventType)!;
    handlers.push(handler as EventHandler<BaseEvent>);

    return {
      unsubscribe: () => {
        const index = handlers.indexOf(handler as EventHandler<BaseEvent>);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      },
    };
  }

  /**
   * Publish an event asynchronously
   */
  async publish<T extends BaseEvent>(event: T): Promise<void> {
    // Handle both eventType and type properties for compatibility
    const eventType = (event as any).eventType || (event as any).type;
    const handlers = this.subscriptions.get(eventType);
    if (!handlers || handlers.length === 0) {
      return;
    }

    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Publish an event synchronously
   */
  publishSync<T extends BaseEvent>(event: T): void {
    // Handle both eventType and type properties for compatibility
    const eventType = (event as any).eventType || (event as any).type;
    const handlers = this.subscriptions.get(eventType);
    if (!handlers || handlers.length === 0) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }

  /**
   * Check if there are any subscribers for an event type
   */
  hasSubscribers(eventType: string): boolean {
    const handlers = this.subscriptions.get(eventType);
    return handlers ? handlers.length > 0 : false;
  }

  /**
   * Get the number of subscribers for an event type
   */
  getSubscriberCount(eventType: string): number {
    const handlers = this.subscriptions.get(eventType);
    return handlers ? handlers.length : 0;
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }

  /**
   * Clear subscriptions for a specific event type
   */
  clearEventType(eventType: string): void {
    this.subscriptions.delete(eventType);
  }
}
