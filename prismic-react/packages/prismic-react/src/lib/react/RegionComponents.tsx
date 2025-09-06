import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Container } from '../core/container';
import { EventAggregator } from '../core/event-aggregator';
import { RegionManager, IRegion, ComponentConfig } from '../core/regions';
import { ContainerContext, EventAggregatorContext, RegionManagerContext } from './contexts';

/**
 * Props for the PrismicFrameworkProvider
 */
export interface PrismicFrameworkProviderProps {
  children: ReactNode;
  regionManager: RegionManager;
  container: Container;
  eventAggregator: EventAggregator;
}

/**
 * Provider component for the Prismic React framework
 */
export function PrismicFrameworkProvider({
  children,
  regionManager,
  container,
  eventAggregator,
}: PrismicFrameworkProviderProps): React.JSX.Element {
  return (
    <ContainerContext.Provider value={container}>
      <EventAggregatorContext.Provider value={eventAggregator}>
        <RegionManagerContext.Provider value={regionManager}>
          {children}
        </RegionManagerContext.Provider>
      </EventAggregatorContext.Provider>
    </ContainerContext.Provider>
  );
}

/**
 * Props for the RegionRenderer component
 */
export interface RegionRendererProps {
  regionName: string;
}

/**
 * Component that renders a region's components using React Portal
 */
export function RegionRenderer({ regionName }: RegionRendererProps): React.JSX.Element | null {
  const regionManager = React.useContext(RegionManagerContext);
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [region, setRegion] = useState<IRegion | undefined>();

  useEffect(() => {
    if (!regionManager) return;

    const currentRegion = regionManager.getRegion(regionName);
    setRegion(currentRegion);

    if (currentRegion) {
      setComponents(currentRegion.getComponents());
      
      // Set up update callback
      currentRegion.setUpdateCallback(() => {
        setComponents([...currentRegion.getComponents()]);
      });
    }
  }, [regionManager, regionName]);

  if (!region) {
    return null;
  }

  const activeComponents = components.filter(component => component.isActive);

  if (activeComponents.length === 0) {
    return null;
  }

  return (
    <>
      {activeComponents.map(({ component: Component, id, props }) =>
        createPortal(
          <Component key={id} {...props} />,
          region.element
        )
      )}
    </>
  );
}
