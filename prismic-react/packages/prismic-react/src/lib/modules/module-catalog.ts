/**
 * Module catalog for configuration-driven module discovery
 */

import { ModuleConfig } from './interfaces';

/**
 * Module catalog interface
 */
export interface ModuleCatalog {
  modules: ModuleConfig[];
  version?: string;
  description?: string;
}

/**
 * Module catalog loader for loading module configurations
 */
export class ModuleCatalogLoader {
  /**
   * Load module catalog from a JSON configuration
   */
  static async loadFromJson(catalogPath: string): Promise<ModuleCatalog> {
    try {
      const response = await fetch(catalogPath);
      if (!response.ok) {
        throw new Error(`Failed to load module catalog: ${response.status} ${response.statusText}`);
      }
      
      const catalog = await response.json() as ModuleCatalog;
      this.validateCatalog(catalog);
      return catalog;
    } catch (error) {
      throw new Error(`Error loading module catalog from ${catalogPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load module catalog from static configuration
   */
  static loadFromConfig(config: ModuleCatalog): ModuleCatalog {
    this.validateCatalog(config);
    return config;
  }
  
  /**
   * Validate module catalog structure
   */
  private static validateCatalog(catalog: ModuleCatalog): void {
    if (!catalog || typeof catalog !== 'object') {
      throw new Error('Invalid module catalog: must be an object');
    }
    
    if (!Array.isArray(catalog.modules)) {
      throw new Error('Invalid module catalog: modules must be an array');
    }
    
    catalog.modules.forEach((module, index) => {
      this.validateModuleConfig(module, index);
    });
  }
  
  /**
   * Validate individual module configuration
   */
  private static validateModuleConfig(config: ModuleConfig, index: number): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new Error(`Invalid module config at index ${index}: name is required and must be a string`);
    }
    
    if (!config.path || typeof config.path !== 'string') {
      throw new Error(`Invalid module config at index ${index}: path is required and must be a string`);
    }
    
    if (typeof config.autoLoad !== 'boolean') {
      throw new Error(`Invalid module config at index ${index}: autoLoad must be a boolean`);
    }
    
    if (typeof config.enabled !== 'boolean') {
      throw new Error(`Invalid module config at index ${index}: enabled must be a boolean`);
    }
    
    if (typeof config.priority !== 'number') {
      throw new Error(`Invalid module config at index ${index}: priority must be a number`);
    }
    
    if (config.dependencies && !Array.isArray(config.dependencies)) {
      throw new Error(`Invalid module config at index ${index}: dependencies must be an array`);
    }
  }
}

/**
 * Built-in module configurations for dashboard functionality
 */
export class DashboardModuleCatalog {
  /**
   * Create a basic dashboard module catalog
   */
  static createBasicCatalog(): ModuleCatalog {
    return {
      version: '1.0.0',
      description: 'Basic dashboard module catalog',
      modules: [
        {
          name: 'CoreDashboardModule',
          path: './modules/core-dashboard-module',
          autoLoad: true,
          enabled: true,
          priority: 1000,
          metadata: {
            description: 'Core dashboard functionality'
          }
        },
        {
          name: 'UploadLogsModule',
          path: './modules/upload-logs-module',
          autoLoad: true,
          enabled: true,
          priority: 900,
          dependencies: ['CoreDashboardModule'],
          metadata: {
            description: 'Upload logs management and display'
          }
        },
        {
          name: 'AnalyticsModule',
          path: './modules/analytics-module',
          autoLoad: false,
          enabled: true,
          priority: 800,
          dependencies: ['UploadLogsModule'],
          metadata: {
            description: 'Analytics and reporting for upload logs'
          }
        },
        {
          name: 'UserManagementModule',
          path: './modules/user-management-module',
          autoLoad: false,
          enabled: true,
          priority: 700,
          dependencies: ['CoreDashboardModule'],
          metadata: {
            description: 'User management and permissions'
          }
        },
        {
          name: 'SettingsModule',
          path: './modules/settings-module',
          autoLoad: false,
          enabled: true,
          priority: 600,
          dependencies: ['CoreDashboardModule'],
          metadata: {
            description: 'Application settings and configuration'
          }
        },
        {
          name: 'NotificationsModule',
          path: './modules/notifications-module',
          autoLoad: true,
          enabled: true,
          priority: 500,
          dependencies: ['CoreDashboardModule'],
          metadata: {
            description: 'Real-time notifications and alerts'
          }
        }
      ]
    };
  }
  
  /**
   * Create an extended dashboard module catalog with more features
   */
  static createExtendedCatalog(): ModuleCatalog {
    const basicCatalog = this.createBasicCatalog();
    
    const extendedModules: ModuleConfig[] = [
      {
        name: 'ReportsModule',
        path: './modules/reports-module',
        autoLoad: false,
        enabled: true,
        priority: 400,
        dependencies: ['UploadLogsModule', 'AnalyticsModule'],
        metadata: {
          description: 'Advanced reporting and data export'
        }
      },
      {
        name: 'AutomationModule',
        path: './modules/automation-module',
        autoLoad: false,
        enabled: true,
        priority: 300,
        dependencies: ['UploadLogsModule'],
        metadata: {
          description: 'Automated workflows and rules'
        }
      },
      {
        name: 'IntegrationsModule',
        path: './modules/integrations-module',
        autoLoad: false,
        enabled: true,
        priority: 200,
        dependencies: ['CoreDashboardModule'],
        metadata: {
          description: 'Third-party integrations and APIs'
        }
      },
      {
        name: 'AuditModule',
        path: './modules/audit-module',
        autoLoad: false,
        enabled: true,
        priority: 100,
        dependencies: ['CoreDashboardModule', 'UserManagementModule'],
        metadata: {
          description: 'Audit trail and compliance tracking'
        }
      }
    ];
    
    return {
      ...basicCatalog,
      description: 'Extended dashboard module catalog with advanced features',
      modules: [...basicCatalog.modules, ...extendedModules]
    };
  }
  
  /**
   * Filter modules by criteria
   */
  static filterModules(
    catalog: ModuleCatalog, 
    criteria: {
      enabled?: boolean;
      autoLoad?: boolean;
      minPriority?: number;
      maxPriority?: number;
      dependencies?: string[];
    }
  ): ModuleConfig[] {
    return catalog.modules.filter(module => {
      if (criteria.enabled !== undefined && module.enabled !== criteria.enabled) {
        return false;
      }
      
      if (criteria.autoLoad !== undefined && module.autoLoad !== criteria.autoLoad) {
        return false;
      }
      
      if (criteria.minPriority !== undefined && module.priority < criteria.minPriority) {
        return false;
      }
      
      if (criteria.maxPriority !== undefined && module.priority > criteria.maxPriority) {
        return false;
      }
      
      if (criteria.dependencies && criteria.dependencies.length > 0) {
        const hasAnyDependency = criteria.dependencies.some(dep => 
          module.dependencies?.includes(dep)
        );
        if (!hasAnyDependency) {
          return false;
        }
      }
      
      return true;
    });
  }
}
