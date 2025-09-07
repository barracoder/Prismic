// Re-export core functionality from prismic
export { 
  Container, 
  ServiceLifetime,
  EventAggregator, 
  BaseEvent,
  RegionManager,
  SingleViewRegion,
  MultiViewRegion,
  ApplicationBuilder,
  createApplication,
  createContainer,
  createEventAggregator,
  createRegionManager,
  type IRegion,
  type IView
} from 'prismic';

// Export React-specific functionality
export { ContainerContext, EventAggregatorContext, RegionManagerContext } from './lib/react/contexts';
export { useContainer, useEventAggregator, useRegionManager } from './lib/react/hooks';
export { RegionRenderer, PrismicFrameworkProvider } from './lib/react/RegionComponents';
export { SingleComponentRegion, type ComponentConfig } from './lib/react/ReactRegions';

// Export module system
export * from './lib/modules';
