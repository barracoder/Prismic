import { describe, it, expect, vi, afterEach } from 'vitest';
import { 
  ModuleCatalogLoader, 
  DashboardModuleCatalog,
  ModuleCatalog 
} from '../../../src/lib/modules/module-catalog';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Module Catalog', () => {
  describe('ModuleCatalogLoader', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });
    
    it('should load catalog from JSON successfully', async () => {
      const mockCatalog: ModuleCatalog = {
        version: '1.0.0',
        description: 'Test catalog',
        modules: [
          {
            name: 'TestModule',
            path: './test-module',
            autoLoad: true,
            enabled: true,
            priority: 100
          }
        ]
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      });
      
      const result = await ModuleCatalogLoader.loadFromJson('/test/catalog.json');
      
      expect(result).toEqual(mockCatalog);
      expect(global.fetch).toHaveBeenCalledWith('/test/catalog.json');
    });
    
    it('should handle fetch errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(ModuleCatalogLoader.loadFromJson('/test/catalog.json')).rejects.toThrow(
        'Failed to load module catalog: 404 Not Found'
      );
    });
    
    it('should handle JSON parsing errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });
      
      await expect(ModuleCatalogLoader.loadFromJson('/test/catalog.json')).rejects.toThrow(
        'Error loading module catalog from /test/catalog.json: Invalid JSON'
      );
    });
    
    it('should load catalog from static config', () => {
      const config: ModuleCatalog = {
        modules: [
          {
            name: 'TestModule',
            path: './test-module',
            autoLoad: true,
            enabled: true,
            priority: 100
          }
        ]
      };
      
      const result = ModuleCatalogLoader.loadFromConfig(config);
      expect(result).toBe(config);
    });
    
    it('should validate catalog structure', () => {
      const invalidCatalog = {
        modules: 'not-an-array'
      };
      
      expect(() => {
        ModuleCatalogLoader.loadFromConfig(invalidCatalog as any);
      }).toThrow('Invalid module catalog: modules must be an array');
    });
    
    it('should validate module configurations', () => {
      const catalogWithInvalidModule: ModuleCatalog = {
        modules: [
          {
            // Missing required fields
            path: './test-module',
            autoLoad: true,
            enabled: true,
            priority: 100
          } as any
        ]
      };
      
      expect(() => {
        ModuleCatalogLoader.loadFromConfig(catalogWithInvalidModule);
      }).toThrow('Invalid module config at index 0: name is required and must be a string');
    });
    
    it('should validate all required module fields', () => {
      const testCases = [
        {
          config: { name: 'Test' }, // Missing path
          error: 'path is required and must be a string'
        },
        {
          config: { name: 'Test', path: './test' }, // Missing autoLoad
          error: 'autoLoad must be a boolean'
        },
        {
          config: { name: 'Test', path: './test', autoLoad: true }, // Missing enabled
          error: 'enabled must be a boolean'
        },
        {
          config: { name: 'Test', path: './test', autoLoad: true, enabled: true }, // Missing priority
          error: 'priority must be a number'
        }
      ];
      
      testCases.forEach(({ config, error }) => {
        const catalog: ModuleCatalog = {
          modules: [config as any]
        };
        
        expect(() => {
          ModuleCatalogLoader.loadFromConfig(catalog);
        }).toThrow(`Invalid module config at index 0: ${error}`);
      });
    });
    
    it('should validate dependencies array', () => {
      const catalog: ModuleCatalog = {
        modules: [
          {
            name: 'Test',
            path: './test',
            autoLoad: true,
            enabled: true,
            priority: 100,
            dependencies: 'not-an-array' as any
          }
        ]
      };
      
      expect(() => {
        ModuleCatalogLoader.loadFromConfig(catalog);
      }).toThrow('Invalid module config at index 0: dependencies must be an array');
    });
  });
  
  describe('DashboardModuleCatalog', () => {
    it('should create basic catalog with core modules', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      expect(catalog.version).toBe('1.0.0');
      expect(catalog.description).toBe('Basic dashboard module catalog');
      expect(catalog.modules).toHaveLength(6);
      
      const moduleNames = catalog.modules.map(m => m.name);
      expect(moduleNames).toContain('CoreDashboardModule');
      expect(moduleNames).toContain('UploadLogsModule');
      expect(moduleNames).toContain('AnalyticsModule');
      expect(moduleNames).toContain('UserManagementModule');
      expect(moduleNames).toContain('SettingsModule');
      expect(moduleNames).toContain('NotificationsModule');
    });
    
    it('should have proper priority ordering in basic catalog', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const coreDashboard = catalog.modules.find(m => m.name === 'CoreDashboardModule');
      const uploadLogs = catalog.modules.find(m => m.name === 'UploadLogsModule');
      
      expect(coreDashboard?.priority).toBe(1000);
      expect(uploadLogs?.priority).toBe(900);
      expect(coreDashboard?.priority).toBeGreaterThan(uploadLogs?.priority || 0);
    });
    
    it('should have correct dependencies in basic catalog', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const uploadLogs = catalog.modules.find(m => m.name === 'UploadLogsModule');
      const analytics = catalog.modules.find(m => m.name === 'AnalyticsModule');
      
      expect(uploadLogs?.dependencies).toContain('CoreDashboardModule');
      expect(analytics?.dependencies).toContain('UploadLogsModule');
    });
    
    it('should create extended catalog with additional modules', () => {
      const catalog = DashboardModuleCatalog.createExtendedCatalog();
      
      expect(catalog.description).toBe('Extended dashboard module catalog with advanced features');
      expect(catalog.modules.length).toBeGreaterThan(6);
      
      const moduleNames = catalog.modules.map(m => m.name);
      expect(moduleNames).toContain('ReportsModule');
      expect(moduleNames).toContain('AutomationModule');
      expect(moduleNames).toContain('IntegrationsModule');
      expect(moduleNames).toContain('AuditModule');
    });
    
    it('should maintain basic modules in extended catalog', () => {
      const basicCatalog = DashboardModuleCatalog.createBasicCatalog();
      const extendedCatalog = DashboardModuleCatalog.createExtendedCatalog();
      
      const basicModuleNames = basicCatalog.modules.map(m => m.name);
      const extendedModuleNames = extendedCatalog.modules.map(m => m.name);
      
      basicModuleNames.forEach(name => {
        expect(extendedModuleNames).toContain(name);
      });
    });
    
    it('should filter modules by enabled status', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      // All modules should be enabled by default
      const enabledModules = DashboardModuleCatalog.filterModules(catalog, { enabled: true });
      expect(enabledModules).toHaveLength(catalog.modules.length);
      
      const disabledModules = DashboardModuleCatalog.filterModules(catalog, { enabled: false });
      expect(disabledModules).toHaveLength(0);
    });
    
    it('should filter modules by autoLoad status', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const autoLoadModules = DashboardModuleCatalog.filterModules(catalog, { autoLoad: true });
      const manualLoadModules = DashboardModuleCatalog.filterModules(catalog, { autoLoad: false });
      
      expect(autoLoadModules.length + manualLoadModules.length).toBe(catalog.modules.length);
      
      // Check specific modules
      const coreModule = autoLoadModules.find(m => m.name === 'CoreDashboardModule');
      expect(coreModule).toBeDefined();
      
      const analyticsModule = manualLoadModules.find(m => m.name === 'AnalyticsModule');
      expect(analyticsModule).toBeDefined();
    });
    
    it('should filter modules by priority range', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const highPriorityModules = DashboardModuleCatalog.filterModules(catalog, { 
        minPriority: 800 
      });
      
      highPriorityModules.forEach(module => {
        expect(module.priority).toBeGreaterThanOrEqual(800);
      });
      
      const mediumPriorityModules = DashboardModuleCatalog.filterModules(catalog, { 
        minPriority: 600,
        maxPriority: 900 
      });
      
      mediumPriorityModules.forEach(module => {
        expect(module.priority).toBeGreaterThanOrEqual(600);
        expect(module.priority).toBeLessThanOrEqual(900);
      });
    });
    
    it('should filter modules by dependencies', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const modulesWithCoreDependency = DashboardModuleCatalog.filterModules(catalog, {
        dependencies: ['CoreDashboardModule']
      });
      
      modulesWithCoreDependency.forEach(module => {
        expect(module.dependencies).toContain('CoreDashboardModule');
      });
      
      // Should include modules that have at least one of the specified dependencies
      const modulesWithAnyDependency = DashboardModuleCatalog.filterModules(catalog, {
        dependencies: ['CoreDashboardModule', 'UploadLogsModule']
      });
      
      expect(modulesWithAnyDependency.length).toBeGreaterThan(0);
    });
    
    it('should handle complex filtering combinations', () => {
      const catalog = DashboardModuleCatalog.createExtendedCatalog();
      
      const filteredModules = DashboardModuleCatalog.filterModules(catalog, {
        enabled: true,
        autoLoad: false,
        minPriority: 300,
        maxPriority: 800,
        dependencies: ['CoreDashboardModule']
      });
      
      filteredModules.forEach(module => {
        expect(module.enabled).toBe(true);
        expect(module.autoLoad).toBe(false);
        expect(module.priority).toBeGreaterThanOrEqual(300);
        expect(module.priority).toBeLessThanOrEqual(800);
        expect(module.dependencies).toContain('CoreDashboardModule');
      });
    });
    
    it('should return empty array when no modules match criteria', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const noMatches = DashboardModuleCatalog.filterModules(catalog, {
        enabled: false // All modules are enabled in basic catalog
      });
      
      expect(noMatches).toHaveLength(0);
    });
    
    it('should handle modules without dependencies in dependency filtering', () => {
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      const modulesWithSpecificDep = DashboardModuleCatalog.filterModules(catalog, {
        dependencies: ['NonExistentDependency']
      });
      
      expect(modulesWithSpecificDep).toHaveLength(0);
    });
  });
});
