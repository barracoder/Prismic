import { EventAggregator, BaseEvent } from '../core/event-aggregator';

/**
 * Property changed event
 */
export class PropertyChangedEvent extends BaseEvent {
  static readonly TYPE = 'property-changed';

  constructor(
    public readonly propertyName: string,
    public readonly oldValue: unknown,
    public readonly newValue: unknown,
    public readonly target: object
  ) {
    super(PropertyChangedEvent.TYPE);
  }
}

/**
 * Interface for objects that notify when properties change
 */
export interface INotifyPropertyChanged {
  propertyChanged: EventAggregator;
}

/**
 * Base class for view models with property change notification
 */
export abstract class BaseViewModel implements INotifyPropertyChanged {
  public readonly propertyChanged = new EventAggregator();
  private propertyValues = new Map<string, unknown>();

  /**
   * Set a property value with change notification
   */
  protected setProperty<T>(propertyName: string, value: T): boolean {
    const oldValue = this.propertyValues.get(propertyName);
    
    if (oldValue === value) {
      return false;
    }

    this.propertyValues.set(propertyName, value);
    this.onPropertyChanged(propertyName, oldValue, value);
    return true;
  }

  /**
   * Get a property value
   */
  protected getProperty<T>(propertyName: string, defaultValue: T): T {
    return this.propertyValues.has(propertyName) 
      ? (this.propertyValues.get(propertyName) as T) 
      : defaultValue;
  }

  /**
   * Called when a property changes
   */
  protected onPropertyChanged(propertyName: string, oldValue: unknown, newValue: unknown): void {
    const event = new PropertyChangedEvent(propertyName, oldValue, newValue, this);
    this.propertyChanged.publishSync(event);
  }

  /**
   * Dispose of the view model and clean up resources
   */
  public dispose(): void {
    this.propertyChanged.clear();
    this.propertyValues.clear();
    this.onDispose();
  }

  /**
   * Override in derived classes for custom disposal logic
   */
  protected onDispose(): void {
    // Override in derived classes
  }
}

/**
 * Command interface for MVVM pattern
 */
export interface ICommand {
  readonly canExecute: boolean;
  execute(parameter?: unknown): void | Promise<void>;
  canExecuteChanged: EventAggregator;
}

/**
 * Command can execute changed event
 */
export class CommandCanExecuteChangedEvent extends BaseEvent {
  static readonly TYPE = 'command-can-execute-changed';

  constructor(public readonly command: ICommand) {
    super(CommandCanExecuteChangedEvent.TYPE);
  }
}

/**
 * Delegate command implementation
 */
export class DelegateCommand implements ICommand {
  public readonly canExecuteChanged = new EventAggregator();
  
  private _canExecute = true;

  constructor(
    private executeAction: (parameter?: unknown) => void | Promise<void>,
    private canExecuteFunc?: (parameter?: unknown) => boolean
  ) {}

  public get canExecute(): boolean {
    if (this.canExecuteFunc) {
      return this.canExecuteFunc();
    }
    return this._canExecute;
  }

  public async execute(parameter?: unknown): Promise<void> {
    if (!this.canExecute) {
      return;
    }

    await this.executeAction(parameter);
  }

  /**
   * Manually set can execute state (when not using canExecuteFunc)
   */
  public setCanExecute(canExecute: boolean): void {
    if (this.canExecuteFunc) {
      throw new Error('Cannot manually set canExecute when canExecuteFunc is provided');
    }

    if (this._canExecute !== canExecute) {
      this._canExecute = canExecute;
      this.raiseCanExecuteChanged();
    }
  }

  /**
   * Raise can execute changed event
   */
  public raiseCanExecuteChanged(): void {
    const event = new CommandCanExecuteChangedEvent(this);
    this.canExecuteChanged.publishSync(event);
  }
}

/**
 * Async command implementation
 */
export class AsyncCommand implements ICommand {
  public readonly canExecuteChanged = new EventAggregator();
  
  private _isExecuting = false;
  private _canExecute = true;

  constructor(
    private executeAction: (parameter?: unknown) => Promise<void>,
    private canExecuteFunc?: (parameter?: unknown) => boolean
  ) {}

  public get canExecute(): boolean {
    if (this._isExecuting) {
      return false;
    }

    if (this.canExecuteFunc) {
      return this.canExecuteFunc();
    }
    
    return this._canExecute;
  }

  public get isExecuting(): boolean {
    return this._isExecuting;
  }

  public async execute(parameter?: unknown): Promise<void> {
    if (!this.canExecute) {
      return;
    }

    this._isExecuting = true;
    this.raiseCanExecuteChanged();

    try {
      await this.executeAction(parameter);
    } finally {
      this._isExecuting = false;
      this.raiseCanExecuteChanged();
    }
  }

  /**
   * Manually set can execute state (when not using canExecuteFunc)
   */
  public setCanExecute(canExecute: boolean): void {
    if (this.canExecuteFunc) {
      throw new Error('Cannot manually set canExecute when canExecuteFunc is provided');
    }

    if (this._canExecute !== canExecute) {
      this._canExecute = canExecute;
      this.raiseCanExecuteChanged();
    }
  }

  /**
   * Raise can execute changed event
   */
  public raiseCanExecuteChanged(): void {
    const event = new CommandCanExecuteChangedEvent(this);
    this.canExecuteChanged.publishSync(event);
  }
}

/**
 * Base class for views with MVVM support
 */
export abstract class BaseViewWithViewModel<TViewModel extends BaseViewModel> {
  protected _viewModel: TViewModel | null = null;

  constructor(public readonly element: HTMLElement) {}

  public get viewModel(): TViewModel | null {
    return this._viewModel;
  }

  public setViewModel(viewModel: TViewModel): void {
    if (this._viewModel) {
      this.onViewModelChanging(this._viewModel);
    }

    this._viewModel = viewModel;
    this.onViewModelChanged(viewModel);
    this.bindViewModel();
  }

  /**
   * Called when the view model is about to change
   */
  protected onViewModelChanging(_oldViewModel: TViewModel): void {
    // Override in derived classes
  }

  /**
   * Called when the view model has changed
   */
  protected onViewModelChanged(_newViewModel: TViewModel): void {
    // Override in derived classes
  }

  /**
   * Bind the view model to the view
   */
  protected abstract bindViewModel(): void;

  /**
   * Dispose of the view and view model
   */
  public dispose(): void {
    if (this._viewModel) {
      this._viewModel.dispose();
      this._viewModel = null;
    }
    this.onDispose();
  }

  /**
   * Override in derived classes for custom disposal logic
   */
  protected onDispose(): void {
    // Override in derived classes
  }
}
