/**
 * Interface for objects that can be activated/deactivated
 */
export interface IActivatable {
  isActive: boolean;
  activate(): void | Promise<void>;
  deactivate(): void | Promise<void>;
}

/**
 * Interface for views that can be managed by regions
 */
export interface IView extends IActivatable {
  readonly element: HTMLElement;
  render(): void | Promise<void>;
  dispose(): void;
}

/**
 * Region interface for managing views in specific areas of the UI
 */
export interface IRegion {
  readonly name: string;
  readonly element: HTMLElement;
  readonly activeView: IView | null;
  readonly views: ReadonlyArray<IView>;
  
  addView(view: IView): Promise<void>;
  removeView(view: IView): Promise<void>;
  activateView(view: IView): Promise<void>;
  deactivateView(view: IView): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Basic view implementation
 */
export abstract class BaseView implements IView {
  public isActive = false;
  
  constructor(public readonly element: HTMLElement) {}

  public async activate(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    this.element.style.display = '';
    await this.onActivate();
  }

  public async deactivate(): Promise<void> {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.element.style.display = 'none';
    await this.onDeactivate();
  }

  public abstract render(): void | Promise<void>;

  public dispose(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.onDispose();
  }

  protected onActivate(): void | Promise<void> {
    // Override in derived classes
  }

  protected onDeactivate(): void | Promise<void> {
    // Override in derived classes
  }

  protected onDispose(): void {
    // Override in derived classes
  }
}

/**
 * Single-view region that can display one view at a time
 */
export class SingleViewRegion implements IRegion {
  private _activeView: IView | null = null;
  private _views: IView[] = [];

  constructor(
    public readonly name: string,
    public readonly element: HTMLElement
  ) {}

  public get activeView(): IView | null {
    return this._activeView;
  }

  public get views(): ReadonlyArray<IView> {
    return this._views;
  }

  public async addView(view: IView): Promise<void> {
    if (this._views.includes(view)) {
      return;
    }

    this._views.push(view);
    this.element.appendChild(view.element);
    
    // If this is the first view, activate it
    if (this._views.length === 1) {
      await this.activateView(view);
    } else {
      await view.deactivate();
    }
  }

  public async removeView(view: IView): Promise<void> {
    const index = this._views.indexOf(view);
    if (index === -1) {
      return;
    }

    if (this._activeView === view) {
      await this.deactivateView(view);
      this._activeView = null;
    }

    this._views.splice(index, 1);
    if (view.element.parentNode === this.element) {
      this.element.removeChild(view.element);
    }
  }

  public async activateView(view: IView): Promise<void> {
    if (!this._views.includes(view)) {
      throw new Error('View is not part of this region');
    }

    if (this._activeView === view) {
      return;
    }

    // Deactivate current view
    if (this._activeView) {
      await this._activeView.deactivate();
    }

    // Activate new view
    this._activeView = view;
    await view.activate();
    await view.render();
  }

  public async deactivateView(view: IView): Promise<void> {
    if (this._activeView !== view) {
      return;
    }

    await view.deactivate();
    this._activeView = null;
  }

  public async clear(): Promise<void> {
    if (this._activeView) {
      await this._activeView.deactivate();
      this._activeView = null;
    }

    for (const view of this._views) {
      view.dispose();
    }

    this._views = [];
    this.element.innerHTML = '';
  }
}

/**
 * Multi-view region that can display multiple views simultaneously
 */
export class MultiViewRegion implements IRegion {
  private _views: IView[] = [];
  private _activeViews: Set<IView> = new Set();

  constructor(
    public readonly name: string,
    public readonly element: HTMLElement
  ) {}

  public get activeView(): IView | null {
    return this._activeViews.size > 0 ? Array.from(this._activeViews)[0] : null;
  }

  public get views(): ReadonlyArray<IView> {
    return this._views;
  }

  public get activeViews(): ReadonlyArray<IView> {
    return Array.from(this._activeViews);
  }

  public async addView(view: IView): Promise<void> {
    if (this._views.includes(view)) {
      return;
    }

    this._views.push(view);
    this.element.appendChild(view.element);
    await view.render();
  }

  public async removeView(view: IView): Promise<void> {
    const index = this._views.indexOf(view);
    if (index === -1) {
      return;
    }

    if (this._activeViews.has(view)) {
      await this.deactivateView(view);
    }

    this._views.splice(index, 1);
    if (view.element.parentNode === this.element) {
      this.element.removeChild(view.element);
    }
  }

  public async activateView(view: IView): Promise<void> {
    if (!this._views.includes(view)) {
      throw new Error('View is not part of this region');
    }

    if (this._activeViews.has(view)) {
      return;
    }

    this._activeViews.add(view);
    await view.activate();
  }

  public async deactivateView(view: IView): Promise<void> {
    if (!this._activeViews.has(view)) {
      return;
    }

    this._activeViews.delete(view);
    await view.deactivate();
  }

  public async clear(): Promise<void> {
    for (const view of this._activeViews) {
      await view.deactivate();
    }
    this._activeViews.clear();

    for (const view of this._views) {
      view.dispose();
    }

    this._views = [];
    this.element.innerHTML = '';
  }
}

/**
 * Region manager for managing multiple regions
 */
export class RegionManager {
  private regions = new Map<string, IRegion>();

  /**
   * Register a region
   */
  public registerRegion(region: IRegion): void {
    if (this.regions.has(region.name)) {
      throw new Error(`Region '${region.name}' is already registered`);
    }
    this.regions.set(region.name, region);
  }

  /**
   * Get a region by name
   */
  public getRegion(name: string): IRegion | undefined {
    return this.regions.get(name);
  }

  /**
   * Check if a region is registered
   */
  public hasRegion(name: string): boolean {
    return this.regions.has(name);
  }

  /**
   * Unregister a region
   */
  public unregisterRegion(name: string): void {
    const region = this.regions.get(name);
    if (region) {
      region.clear();
      this.regions.delete(name);
    }
  }

  /**
   * Get all registered region names
   */
  public getRegionNames(): string[] {
    return Array.from(this.regions.keys());
  }

  /**
   * Clear all regions
   */
  public async clearAll(): Promise<void> {
    const clearPromises = Array.from(this.regions.values()).map(region => region.clear());
    await Promise.all(clearPromises);
    this.regions.clear();
  }
}
