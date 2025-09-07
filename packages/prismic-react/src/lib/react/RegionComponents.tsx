import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Container, EventAggregator, RegionManager } from 'prismic';
import { ContainerContext, EventAggregatorContext, RegionManagerContext } from './contexts';

// Type for component configuration (may need to be defined in React-specific way)
interface ComponentConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  isActive: boolean;
}

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
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!regionManager) return;

    const currentRegion = regionManager.getRegion(regionName);
    
    if (currentRegion) {
      // Get the element from the region
      const element = (currentRegion as any).element;
      setTargetElement(element);
      
      // Note: This may need to be adapted based on the actual RegionManager interface
      const regionComponents = (currentRegion as any).getComponents?.() || [];
      setComponents(regionComponents);
      
      // Set up update callback if available
      if (typeof (currentRegion as any).setUpdateCallback === 'function') {
        (currentRegion as any).setUpdateCallback(() => {
          const updatedComponents = (currentRegion as any).getComponents?.() || [];
          setComponents([...updatedComponents]);
        });
      }
    }
  }, [regionManager, regionName]);

  if (!targetElement) {
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
          targetElement
        )
      )}
    </>
  );
}
