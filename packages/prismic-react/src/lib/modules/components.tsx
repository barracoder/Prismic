import React from 'react';
import { 
  SidebarContribution, 
  MenuItemContribution, 
  ToolbarItemContribution,
  StatusBarItemContribution
} from './interfaces';
import { useUIContributions, useCommandExecutor } from './hooks';

/**
 * Dynamic sidebar renderer that displays module contributions
 */
interface DynamicSidebarProps {
  position: 'left' | 'right';
  className?: string;
}

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({ position, className }) => {
  const contributions = useUIContributions();
  
  const sidebars = contributions.sidebars?.filter(sidebar => sidebar.position === position) || [];
  
  if (sidebars.length === 0) {
    return null;
  }
  
  return (
    <div className={`dynamic-sidebar dynamic-sidebar-${position} ${className || ''}`}>
      {sidebars.map(sidebar => (
        <SidebarPanel key={sidebar.id} contribution={sidebar} />
      ))}
    </div>
  );
};

/**
 * Individual sidebar panel component
 */
interface SidebarPanelProps {
  contribution: SidebarContribution;
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({ contribution }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(!contribution.defaultVisible);
  
  const toggleCollapsed = () => {
    if (contribution.collapsible !== false) {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  const IconComponent = contribution.icon;
  
  return (
    <div className={`sidebar-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-panel-header" onClick={toggleCollapsed}>
        {IconComponent && (
          typeof IconComponent === 'string' ? 
            <span className={`icon ${IconComponent}`} /> :
            <IconComponent />
        )}
        <span className="sidebar-panel-title">{contribution.title}</span>
        {contribution.collapsible !== false && (
          <span className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="sidebar-panel-content">
          <contribution.component />
        </div>
      )}
    </div>
  );
};

/**
 * Dynamic menu bar renderer
 */
interface DynamicMenuBarProps {
  className?: string;
}

export const DynamicMenuBar: React.FC<DynamicMenuBarProps> = ({ className }) => {
  const contributions = useUIContributions();
  const { executeCommand, canExecuteCommand } = useCommandExecutor();
  
  const menuItems = contributions.menuItems || [];
  
  // Group menu items by group
  const groupedItems = menuItems.reduce((groups, item) => {
    const group = item.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, MenuItemContribution[]>);
  
  const handleMenuClick = async (item: MenuItemContribution) => {
    if (item.command && canExecuteCommand(item.command)) {
      try {
        await executeCommand(item.command);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error executing command ${item.command}:`, error);
      }
    }
  };
  
  return (
    <div className={`dynamic-menu-bar ${className || ''}`}>
      {Object.entries(groupedItems).map(([groupName, items]) => (
        <div key={groupName} className="menu-group">
          {items.map(item => (
            <MenuItem key={item.id} contribution={item} onClick={() => handleMenuClick(item)} />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Individual menu item component
 */
interface MenuItemProps {
  contribution: MenuItemContribution;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ contribution, onClick }) => {
  const { canExecuteCommand } = useCommandExecutor();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const isEnabled = contribution.command ? canExecuteCommand(contribution.command) : true;
  const IconComponent = contribution.icon;
  
  const handleClick = () => {
    if (contribution.submenu) {
      setIsOpen(!isOpen);
    } else {
      onClick();
    }
  };
  
  if (contribution.separator) {
    return <div className="menu-separator" />;
  }
  
  return (
    <div className={`menu-item ${!isEnabled ? 'disabled' : ''}`}>
      <div className="menu-item-content" onClick={handleClick}>
        {IconComponent && (
          typeof IconComponent === 'string' ? 
            <span className={`icon ${IconComponent}`} /> :
            <IconComponent />
        )}
        <span className="menu-item-label">{contribution.label}</span>
        {contribution.shortcut && (
          <span className="menu-item-shortcut">{contribution.shortcut}</span>
        )}
        {contribution.submenu && (
          <span className="menu-item-arrow">▶</span>
        )}
      </div>
      
      {contribution.submenu && isOpen && (
        <div className="submenu">
          {contribution.submenu.map(subItem => (
            <MenuItem key={subItem.id} contribution={subItem} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Dynamic toolbar renderer
 */
interface DynamicToolbarProps {
  className?: string;
}

export const DynamicToolbar: React.FC<DynamicToolbarProps> = ({ className }) => {
  const contributions = useUIContributions();
  const { executeCommand, canExecuteCommand } = useCommandExecutor();
  
  const toolbarItems = contributions.toolbarItems || [];
  
  // Group toolbar items by group
  const groupedItems = toolbarItems.reduce((groups, item) => {
    const group = item.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, ToolbarItemContribution[]>);
  
  const handleToolbarClick = async (item: ToolbarItemContribution) => {
    if (item.command && canExecuteCommand(item.command)) {
      try {
        await executeCommand(item.command);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error executing command ${item.command}:`, error);
      }
    }
  };
  
  return (
    <div className={`dynamic-toolbar ${className || ''}`}>
      {Object.entries(groupedItems).map(([groupName, items]) => (
        <div key={groupName} className="toolbar-group">
          {items.map(item => (
            <ToolbarItem key={item.id} contribution={item} onClick={() => handleToolbarClick(item)} />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Individual toolbar item component
 */
interface ToolbarItemProps {
  contribution: ToolbarItemContribution;
  onClick: () => void;
}

const ToolbarItem: React.FC<ToolbarItemProps> = ({ contribution, onClick }) => {
  const { canExecuteCommand } = useCommandExecutor();
  
  const isEnabled = contribution.command ? canExecuteCommand(contribution.command) : true;
  const IconComponent = contribution.icon;
  
  if (contribution.type === 'separator') {
    return <div className="toolbar-separator" />;
  }
  
  return (
    <button
      className={`toolbar-item ${!isEnabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={!isEnabled}
      title={contribution.tooltip}
    >
      {IconComponent && (
        typeof IconComponent === 'string' ? 
          <span className={`icon ${IconComponent}`} /> :
          <IconComponent />
      )}
      {contribution.text && (
        <span className="toolbar-item-text">{contribution.text}</span>
      )}
    </button>
  );
};

/**
 * Dynamic status bar renderer
 */
interface DynamicStatusBarProps {
  className?: string;
}

export const DynamicStatusBar: React.FC<DynamicStatusBarProps> = ({ className }) => {
  const contributions = useUIContributions();
  const { executeCommand, canExecuteCommand } = useCommandExecutor();
  
  const statusItems = contributions.statusBarItems || [];
  const leftItems = statusItems.filter(item => item.alignment === 'left');
  const rightItems = statusItems.filter(item => item.alignment === 'right');
  
  const handleStatusClick = async (item: StatusBarItemContribution) => {
    if (item.command && canExecuteCommand(item.command)) {
      try {
        await executeCommand(item.command);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error executing command ${item.command}:`, error);
      }
    }
  };
  
  return (
    <div className={`dynamic-status-bar ${className || ''}`}>
      <div className="status-bar-left">
        {leftItems.map(item => (
          <StatusBarItem key={item.id} contribution={item} onClick={() => handleStatusClick(item)} />
        ))}
      </div>
      
      <div className="status-bar-right">
        {rightItems.map(item => (
          <StatusBarItem key={item.id} contribution={item} onClick={() => handleStatusClick(item)} />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual status bar item component
 */
interface StatusBarItemProps {
  contribution: StatusBarItemContribution;
  onClick: () => void;
}

const StatusBarItem: React.FC<StatusBarItemProps> = ({ contribution, onClick }) => {
  const { canExecuteCommand } = useCommandExecutor();
  
  const isEnabled = contribution.command ? canExecuteCommand(contribution.command) : true;
  const isClickable = !!contribution.command;
  
  return (
    <div
      className={`status-bar-item ${!isEnabled ? 'disabled' : ''} ${isClickable ? 'clickable' : ''}`}
      onClick={isClickable ? onClick : undefined}
      title={contribution.tooltip}
    >
      {contribution.text}
    </div>
  );
};

/**
 * Dashboard shell component that combines all dynamic UI elements
 */
interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, className }) => {
  return (
    <div className={`dashboard-shell ${className || ''}`}>
      <div className="dashboard-header">
        <DynamicMenuBar className="main-menu" />
        <DynamicToolbar className="main-toolbar" />
      </div>
      
      <div className="dashboard-body">
        <DynamicSidebar position="left" className="left-sidebar" />
        
        <div className="dashboard-content">
          {children}
        </div>
        
        <DynamicSidebar position="right" className="right-sidebar" />
      </div>
      
      <div className="dashboard-footer">
        <DynamicStatusBar className="main-status-bar" />
      </div>
    </div>
  );
};
