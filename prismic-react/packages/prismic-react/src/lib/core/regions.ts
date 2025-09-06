import React from 'react';

/**
 * Component configuration for regions
 */
export interface ComponentConfig {
  component: React.ComponentType<any>;
  id: string;
  props: Record<string, unknown>;
  isActive: boolean;
}

/**
 * Base region interface
 */
export interface IRegion {
  name: string;
  element: HTMLElement;
  addComponent(config: ComponentConfig): void;
  removeComponent(id: string): void;
  activateComponent(id: string): void;
  deactivateComponent(id: string): void;
  getComponents(): ComponentConfig[];
  clear(): void;
  setUpdateCallback(callback: () => void): void;
}

/**
 * Base region class
 */
export abstract class BaseRegion implements IRegion {
  protected components: ComponentConfig[] = [];
  protected updateCallback?: () => void;

  constructor(
    public readonly name: string,
    public readonly element: HTMLElement
  ) {}

  abstract addComponent(config: ComponentConfig): void;
  abstract removeComponent(id: string): void;

  activateComponent(id: string): void {
    const component = this.components.find(c => c.id === id);
    if (!component) {
      throw new Error(`Component '${id}' is not part of this region`);
    }
    component.isActive = true;
    this.triggerUpdate();
  }

  deactivateComponent(id: string): void {
    const component = this.components.find(c => c.id === id);
    if (component) {
      component.isActive = false;
      this.triggerUpdate();
    }
  }

  getComponents(): ComponentConfig[] {
    return [...this.components];
  }

  clear(): void {
    this.components = [];
    this.triggerUpdate();
  }

  setUpdateCallback(callback: () => void): void {
    this.updateCallback = callback;
  }

  protected triggerUpdate(): void {
    this.updateCallback?.();
  }
}

/**
 * Single component region - only allows one active component
 */
export class SingleComponentRegion extends BaseRegion {
  addComponent(config: ComponentConfig): void {
    const existingIndex = this.components.findIndex(c => c.id === config.id);
    if (existingIndex > -1) {
      this.components[existingIndex] = config;
    } else {
      this.components.push(config);
    }
    // Auto-activate first component in single component region
    if (this.components.length === 1) {
      config.isActive = true;
    }
    this.triggerUpdate();
  }

  removeComponent(id: string): void {
    const index = this.components.findIndex(c => c.id === id);
    if (index > -1) {
      this.components.splice(index, 1);
      this.triggerUpdate();
    }
  }

  activateComponent(id: string): void {
    const component = this.components.find(c => c.id === id);
    if (!component) {
      throw new Error(`Component '${id}' is not part of this region`);
    }
    // Deactivate all other components first
    this.components.forEach(c => {
      c.isActive = c.id === id;
    });
    this.triggerUpdate();
  }

  get activeComponent(): ComponentConfig | null {
    return this.components.find(c => c.isActive) || null;
  }
}

/**
 * Multi-component region - allows multiple active components
 */
export class MultiComponentRegion extends BaseRegion {
  addComponent(config: ComponentConfig): void {
    const existingIndex = this.components.findIndex(c => c.id === config.id);
    if (existingIndex > -1) {
      this.components[existingIndex] = config;
    } else {
      this.components.push(config);
    }
    this.triggerUpdate();
  }

  removeComponent(id: string): void {
    const index = this.components.findIndex(c => c.id === id);
    if (index > -1) {
      this.components.splice(index, 1);
      this.triggerUpdate();
    }
  }

  get activeComponents(): ComponentConfig[] {
    return this.components.filter(c => c.isActive);
  }

  get activeComponent(): ComponentConfig | null {
    const active = this.activeComponents;
    return active.length > 0 ? active[0] : null;
  }
}

/**
 * Region Manager for handling UI regions
 */
export class RegionManager {
  private regions = new Map<string, IRegion>();

  /**
   * Register a region
   */
  registerRegion(region: IRegion): void {
    if (this.regions.has(region.name)) {
      throw new Error(`Region '${region.name}' is already registered`);
    }
    this.regions.set(region.name, region);
  }

  /**
   * Unregister a region
   */
  unregisterRegion(name: string): void {
    this.regions.delete(name);
  }

  /**
   * Get a region by name
   */
  getRegion(name: string): IRegion | undefined {
    return this.regions.get(name);
  }

  /**
   * Check if a region exists
   */
  hasRegion(name: string): boolean {
    return this.regions.has(name);
  }

  /**
   * Get all region names
   */
  getRegionNames(): string[] {
    return Array.from(this.regions.keys());
  }

  /**
   * Clear all regions
   */
  clearAll(): void {
    this.regions.forEach(region => region.clear());
    this.regions.clear();
  }
}
