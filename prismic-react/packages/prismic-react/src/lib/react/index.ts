// React context exports
export * from './contexts';

// React hook exports  
export * from './hooks';

// React component exports
export * from './RegionComponents';

// Re-export core types that are commonly used in React components
export type { ComponentConfig, IRegion } from '../core/regions';
export type { ServiceLifetime, ServiceIdentifier } from '../core/container';
export type { BaseEvent, EventHandler, EventSubscription } from '../core/event-aggregator';
