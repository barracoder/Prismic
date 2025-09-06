import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContainer, useEventAggregator, useRegionManager, useRegion } from '../../../src/lib/react/hooks';
import { PrismicFrameworkProvider } from '../../../src/lib/react/RegionComponents';
import { Container } from '../../../src/lib/core/container';
import { EventAggregator } from '../../../src/lib/core/event-aggregator';
import { RegionManager, SingleComponentRegion } from '../../../src/lib/core/regions';

describe('React Hooks', () => {
  let container: Container;
  let eventAggregator: EventAggregator;
  let regionManager: RegionManager;
  let wrapper: ({ children }: { children: ReactNode }) => React.JSX.Element;

  beforeEach(() => {
    container = new Container();
    eventAggregator = new EventAggregator();
    regionManager = new RegionManager();

    // Create a wrapper component with providers
    wrapper = ({ children }: { children: ReactNode }) => (
      <PrismicFrameworkProvider
        container={container}
        eventAggregator={eventAggregator}
        regionManager={regionManager}
      >
        {children}
      </PrismicFrameworkProvider>
    );
  });

  describe('useContainer', () => {
    it('should return the container instance from context', () => {
      const { result } = renderHook(() => useContainer(), { wrapper });
      expect(result.current).toBe(container);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useContainer());
      }).toThrow('useContainer must be used within a ContainerProvider');
    });
  });

  describe('useEventAggregator', () => {
    it('should return the event aggregator instance from context', () => {
      const { result } = renderHook(() => useEventAggregator(), { wrapper });
      expect(result.current).toBe(eventAggregator);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useEventAggregator());
      }).toThrow('useEventAggregator must be used within an EventAggregatorProvider');
    });
  });

  describe('useRegionManager', () => {
    it('should return the region manager instance from context', () => {
      const { result } = renderHook(() => useRegionManager(), { wrapper });
      expect(result.current).toBe(regionManager);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useRegionManager());
      }).toThrow('useRegionManager must be used within a RegionProvider');
    });
  });

  describe('useRegion', () => {
    it('should return undefined for non-existent region', () => {
      const { result } = renderHook(() => useRegion('non-existent'), { wrapper });
      expect(result.current).toBeUndefined();
    });

    it('should return the region when it exists', () => {
      // Create a mock DOM element
      const element = document.createElement('div');
      const region = new SingleComponentRegion('test-region', element);
      regionManager.registerRegion(region);

      const { result } = renderHook(() => useRegion('test-region'), { wrapper });
      expect(result.current).toBe(region);
    });

    it('should update when region is registered after hook initialization', () => {
      const { result, rerender } = renderHook(() => useRegion('dynamic-region'), { wrapper });
      expect(result.current).toBeUndefined();

      // Register region after hook initialization
      const element = document.createElement('div');
      const region = new SingleComponentRegion('dynamic-region', element);
      regionManager.registerRegion(region);

      rerender();
      expect(result.current).toBe(region);
    });
  });
});
