import { 
  createApplication, 
  BaseModule, 
  BaseViewModel, 
  DelegateCommand, 
  SingleViewRegion,
  BaseView,
  type ModuleContext 
} from '../src/index';

// Example User Service
class UserService {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  public async getUsers(): Promise<Array<{ id: number; name: string; email: string }>> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.users];
  }

  public async saveUser(user: { id?: number; name: string; email: string }): Promise<{ id: number; name: string; email: string }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (user.id) {
      const index = this.users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        this.users[index] = { ...user, id: user.id };
        return this.users[index];
      }
    }
    
    const newUser = { ...user, id: Math.max(...this.users.map(u => u.id)) + 1 };
    this.users.push(newUser);
    return newUser;
  }
}

// Example View Model
class UserListViewModel extends BaseViewModel {
  private _users: Array<{ id: number; name: string; email: string }> = [];
  private _isLoading = false;
  private _selectedUser: { id: number; name: string; email: string } | null = null;

  constructor(private userService: UserService) {
    super();
    this.loadUsersCommand = new DelegateCommand(
      async () => await this.loadUsers(),
      () => !this.isLoading
    );
  }

  public get users(): Array<{ id: number; name: string; email: string }> {
    return this.getProperty('users', this._users);
  }

  public set users(value: Array<{ id: number; name: string; email: string }>) {
    if (this.setProperty('users', value)) {
      this._users = value;
    }
  }

  public get isLoading(): boolean {
    return this.getProperty('isLoading', this._isLoading);
  }

  public set isLoading(value: boolean) {
    if (this.setProperty('isLoading', value)) {
      this._isLoading = value;
      this.loadUsersCommand.raiseCanExecuteChanged();
    }
  }

  public get selectedUser(): { id: number; name: string; email: string } | null {
    return this.getProperty('selectedUser', this._selectedUser);
  }

  public set selectedUser(value: { id: number; name: string; email: string } | null) {
    if (this.setProperty('selectedUser', value)) {
      this._selectedUser = value;
    }
  }

  public readonly loadUsersCommand: DelegateCommand;

  private async loadUsers(): Promise<void> {
    this.isLoading = true;
    try {
      const users = await this.userService.getUsers();
      this.users = users;
    } finally {
      this.isLoading = false;
    }
  }
}

// Example View
class UserListView extends BaseView {
  private viewModel: UserListViewModel | null = null;

  constructor() {
    super(document.createElement('div'));
    this.setupView();
  }

  public setViewModel(viewModel: UserListViewModel): void {
    this.viewModel = viewModel;
    this.bindEvents();
    this.render();
  }

  public async render(): Promise<void> {
    if (!this.viewModel) return;

    this.element.innerHTML = `
      <div class="user-list">
        <h2>Users</h2>
        <button id="load-users" ${this.viewModel.isLoading ? 'disabled' : ''}>
          ${this.viewModel.isLoading ? 'Loading...' : 'Load Users'}
        </button>
        <ul id="user-list">
          ${this.viewModel.users.map(user => 
            `<li data-user-id="${user.id}">
              <strong>${user.name}</strong> - ${user.email}
            </li>`
          ).join('')}
        </ul>
      </div>
    `;

    // Rebind events after render
    this.bindEvents();
  }

  private setupView(): void {
    this.element.className = 'user-list-view';
    this.element.style.padding = '20px';
    this.element.style.backgroundColor = '#f5f5f5';
    this.element.style.borderRadius = '8px';
    this.element.style.margin = '10px';
  }

  private bindEvents(): void {
    if (!this.viewModel) return;

    const loadButton = this.element.querySelector('#load-users') as HTMLButtonElement;
    if (loadButton) {
      loadButton.onclick = async () => {
        await this.viewModel!.loadUsersCommand.execute();
      };
    }

    const userItems = this.element.querySelectorAll('[data-user-id]');
    userItems.forEach(item => {
      item.addEventListener('click', () => {
        const userId = parseInt((item as HTMLElement).dataset.userId || '0');
        const user = this.viewModel!.users.find(u => u.id === userId);
        if (user) {
          this.viewModel!.selectedUser = user;
          console.log('Selected user:', user);
        }
      });
    });

    // Subscribe to property changes
    this.viewModel.propertyChanged.subscribe('property-changed', (event: any) => {
      if (event.propertyName === 'users' || event.propertyName === 'isLoading') {
        this.render();
      }
    });
  }
}

// Example Module
class UserModule extends BaseModule {
  public readonly name = 'UserModule';
  public readonly priority = 100;

  public async initialize(context: ModuleContext): Promise<void> {
    // Register services
    context.container.registerSingleton('userService', () => new UserService());
    
    // Create and register the main region
    const appContainer = document.getElementById('app') || document.body;
    const mainRegion = new SingleViewRegion('main', appContainer);
    context.regionManager.registerRegion(mainRegion);

    // Create view and view model
    const userService = context.container.resolve<UserService>('userService');
    const viewModel = new UserListViewModel(userService);
    const view = new UserListView();
    view.setViewModel(viewModel);

    // Add view to region
    await mainRegion.addView(view);
    await mainRegion.activateView(view);

    console.log('UserModule initialized successfully');
  }
}

// Example application setup
export async function runExample(): Promise<void> {
  console.log('Starting Web Prism Example Application...');

  try {
    // Create the application
    const app = createApplication()
      .configureAutoLoadModules(true)
      .build();

    // Register modules
    app.registerModule(new UserModule());

    // Start the application
    await app.start();

    console.log('Application started successfully!');
    console.log('Available services:', app.container.isRegistered('userService'));
    console.log('Registered regions:', app.regionManager.getRegionNames());

  } catch (error) {
    console.error('Failed to start application:', error);
  }
}

// Auto-run example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', () => {
    runExample();
  });
} else {
  // Node environment (for testing)
  console.log('Example would run in browser environment');
}
