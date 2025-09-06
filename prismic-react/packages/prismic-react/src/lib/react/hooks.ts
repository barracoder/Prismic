import { useContext, useEffect, useState } from 'react';
import { ContainerContext, EventAggregatorContext, RegionManagerContext } from './contexts';
import { Container } from '../core/container';
import { EventAggregator } from '../core/event-aggregator';
import { RegionManager, IRegion } from '../core/regions';

/**
 * Hook to access the Container from context
 */
export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within a PrismicFrameworkProvider');
  }
  return container;
}

/**
 * Hook to access the EventAggregator from context
 */
export function useEventAggregator(): EventAggregator {
  const eventAggregator = useContext(EventAggregatorContext);
  if (!eventAggregator) {
    throw new Error('useEventAggregator must be used within a PrismicFrameworkProvider');
  }
  return eventAggregator;
}

/**
 * Hook to access the RegionManager from context
 */
export function useRegionManager(): RegionManager {
  const regionManager = useContext(RegionManagerContext);
  if (!regionManager) {
    throw new Error('useRegionManager must be used within a PrismicFrameworkProvider');
  }
  return regionManager;
}

/**
 * Hook to access a specific region
 */
export function useRegion(regionName: string): IRegion | undefined {
  const regionManager = useRegionManager();
  const [region, setRegion] = useState<IRegion | undefined>(() => 
    regionManager.getRegion(regionName)
  );

  useEffect(() => {
    // Check if region exists when the effect runs
    const currentRegion = regionManager.getRegion(regionName);
    setRegion(currentRegion);
  }, [regionManager, regionName]);

  return region;
}
