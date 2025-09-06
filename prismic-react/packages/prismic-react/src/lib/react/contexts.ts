import React from 'react';
import { Container } from '../core/container';
import { EventAggregator } from '../core/event-aggregator';
import { RegionManager } from '../core/regions';

/**
 * React context for the Container
 */
export const ContainerContext = React.createContext<Container | null>(null);

/**
 * React context for the EventAggregator
 */
export const EventAggregatorContext = React.createContext<EventAggregator | null>(null);

/**
 * React context for the RegionManager
 */
export const RegionManagerContext = React.createContext<RegionManager | null>(null);
