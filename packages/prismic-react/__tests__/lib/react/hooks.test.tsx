import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useContainer, useEventAggregator, useRegionManager, useRegion } from '../../../src/lib/react/hooks';
import { PrismicFrameworkProvider } from '../../../src/lib/react/RegionComponents';
import { Container, EventAggregator, RegionManager } from 'prismic';
import { SingleComponentRegion } from '../../../src/lib/react/ReactRegions';

describe('React Hooks', () => {
  let container: Container;
  let eventAggregator: EventAggregator;
  let regionManager: RegionManager;
  let wrapper: any;

  beforeEach(() => {
    container = new Container();
    eventAggregator = new EventAggregator();
    regionManager = new RegionManager();

    // Create a wrapper component with providers
    wrapper = ({ children }: { children: React.ReactNode }) => (
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
      }).toThrow('useContainer must be used within a PrismicFrameworkProvider');
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
      }).toThrow('useEventAggregator must be used within a PrismicFrameworkProvider');
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
      }).toThrow('useRegionManager must be used within a PrismicFrameworkProvider');
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

    it('should update when region name changes', () => {
      const element1 = document.createElement('div');
      const region1 = new SingleComponentRegion('region-1', element1);
      regionManager.registerRegion(region1);

      const element2 = document.createElement('div');
      const region2 = new SingleComponentRegion('region-2', element2);
      regionManager.registerRegion(region2);

      let regionName = 'region-1';
      const { result, rerender } = renderHook(() => useRegion(regionName), { wrapper });
      expect(result.current).toBe(region1);

      // Change region name and rerender
      regionName = 'region-2';
      rerender();
      expect(result.current).toBe(region2);
    });
  });
});
