import React from 'react';
import { IRegion, IView } from 'prismic';

/**
 * Configuration for a React component in a region
 */
export interface ComponentConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  isActive: boolean;
}

/**
 * React view wrapper that implements IView
 */
export class ReactComponentView implements IView {
  public isActive = false;
  private componentInstance: HTMLDivElement;

  constructor(
    public readonly config: ComponentConfig,
    public readonly element: HTMLElement
  ) {
    this.componentInstance = document.createElement('div');
    this.componentInstance.setAttribute('data-component-id', config.id);
    this.element.appendChild(this.componentInstance);
  }

  async activate(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;
    this.componentInstance.style.display = '';
  }

  async deactivate(): Promise<void> {
    if (!this.isActive) return;
    this.isActive = false;
    this.componentInstance.style.display = 'none';
  }

  async render(): Promise<void> {
    // React rendering is handled by the RegionRenderer component
  }

  dispose(): void {
    if (this.componentInstance.parentNode) {
      this.componentInstance.parentNode.removeChild(this.componentInstance);
    }
  }
}

/**
 * React-specific single component region
 */
export class SingleComponentRegion implements IRegion {
  private components = new Map<string, ComponentConfig>();
  private componentViews = new Map<string, ReactComponentView>();
  private updateCallback?: () => void;
  private _activeView: IView | null = null;

  constructor(
    public readonly name: string,
    public readonly element: HTMLElement
  ) {}

  public get activeView(): IView | null {
    return this._activeView;
  }

  public get views(): ReadonlyArray<IView> {
    return Array.from(this.componentViews.values());
  }

  async addView(view: IView): Promise<void> {
    // Implementation for core IRegion interface
    if (this._activeView) {
      await this._activeView.deactivate();
    }
    this._activeView = view;
    await view.activate();
  }

  async removeView(view: IView): Promise<void> {
    if (this._activeView === view) {
      await this._activeView.deactivate();
      this._activeView = null;
    }
  }

  async activateView(view: IView): Promise<void> {
    if (this._activeView && this._activeView !== view) {
      await this._activeView.deactivate();
    }
    this._activeView = view;
    await view.activate();
  }

  async deactivateView(view: IView): Promise<void> {
    if (this._activeView === view) {
      await view.deactivate();
      this._activeView = null;
    }
  }

  async clear(): Promise<void> {
    for (const view of this.componentViews.values()) {
      view.dispose();
    }
    this.components.clear();
    this.componentViews.clear();
    this._activeView = null;
  }

  /**
   * React-specific method to add a component
   */
  public addComponent(config: ComponentConfig): void {
    this.components.set(config.id, config);
    
    const view = new ReactComponentView(config, this.element);
    this.componentViews.set(config.id, view);
    
    if (config.isActive) {
      this.activateComponent(config.id);
    }

    this.notifyUpdate();
  }

  /**
   * React-specific method to remove a component
   */
  public removeComponent(id: string): void {
    const view = this.componentViews.get(id);
    if (view) {
      view.dispose();
      this.componentViews.delete(id);
    }
    
    this.components.delete(id);
    this.notifyUpdate();
  }

  /**
   * React-specific method to activate a component
   */
  public async activateComponent(id: string): Promise<void> {
    const config = this.components.get(id);
    const view = this.componentViews.get(id);
    
    if (config && view) {
      config.isActive = true;
      await this.activateView(view);
      this.notifyUpdate();
    }
  }

  /**
   * React-specific method to deactivate a component
   */
  public async deactivateComponent(id: string): Promise<void> {
    const config = this.components.get(id);
    const view = this.componentViews.get(id);
    
    if (config && view) {
      config.isActive = false;
      await this.deactivateView(view);
      this.notifyUpdate();
    }
  }

  /**
   * Get all components in this region
   */
  public getComponents(): ComponentConfig[] {
    return Array.from(this.components.values());
  }

  /**
   * Set a callback for when the region updates
   */
  public setUpdateCallback(callback: () => void): void {
    this.updateCallback = callback;
  }

  private notifyUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }
}
