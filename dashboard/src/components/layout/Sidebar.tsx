import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Divider } from '../ui/Divider';
import { Tooltip } from '../ui/Tooltip';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string | number;
  children?: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  navigation: NavItem[];
  footer?: React.ReactNode;
}

export function Sidebar({ collapsed = false, onToggle, navigation, footer }: SidebarProps) {
  const [hovered, setHovered] = React.useState(false);
  const isOpen = collapsed ? hovered : true;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-[1100] h-full bg-bg-secondary border-r border-card-border',
        'transition-all duration-300 ease-out flex flex-col',
        isOpen ? 'w-64' : 'w-20'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-card-border">
          {isOpen && (
            <span className="font-bold text-lg text-accent">CodePulse</span>
          )}
          <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle?.(!collapsed)}
              className="flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                {collapsed ? (
                  <path d="M9 5l6 5-6 5" />
                ) : (
                  <path d="M11 5l-6 5 6 5" />
                )}
              </svg>
            </Button>
          </Tooltip>
        </div>

        <nav className="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
          {navigation.map((item, index) => (
            <div key={`${item.label}-${index}`} className="mb-1">
              {item.children && item.children.length > 0 ? (
                <CollapsibleNavItem item={item} isOpen={isOpen} collapsed={collapsed} index={index} />
              ) : (
                <NavLink item={item} isOpen={isOpen} collapsed={collapsed} />
              )}
            </div>
          ))}
        </nav>

        <Divider className="mx-2" />

        <div className="p-2">
          {isOpen && footer ? (
            footer
          ) : !isOpen && footer && (
            <Tooltip content="Footer" position="top">
              <div className="flex justify-center">{footer}</div>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, isOpen, collapsed }: { item: NavItem; isOpen: boolean; collapsed: boolean }) {
  const content = (
    <a
      href={item.href || '#'}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-fg-muted hover:text-fg hover:bg-bg-hover',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
      )}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
      {isOpen && <span className="flex-1 truncate font-medium">{item.label}</span>}
      {item.badge && isOpen && (
        <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full">
          {item.badge}
        </span>
      )}
    </a>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} position="right">
        <a
          href={item.href || '#'}
          className={cn(
            'flex items-center justify-center w-10 h-10 mx-auto rounded-lg',
            'text-fg-muted hover:text-fg hover:bg-bg-hover',
            'transition-colors duration-150'
          )}
        >
          <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
        </a>
      </Tooltip>
    );
  }

  return content;
}

function CollapsibleNavItem({ item, isOpen, collapsed, index }: { item: NavItem; isOpen: boolean; collapsed: boolean; index: number }) {
  const [open, setOpen] = React.useState(false);

  if (collapsed) {
    return (
      <Tooltip content={item.label} position="right">
        <button
          className={cn(
            'flex items-center justify-center w-10 h-10 mx-auto rounded-lg',
            'text-fg-muted hover:text-fg hover:bg-bg-hover',
            'transition-colors duration-150'
          )}
        >
          <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="group">
      <button
        type="button"
        className={cn(
          'flex items-center justify-between w-full px-3 py-2.5 rounded-lg',
          'text-fg-muted hover:text-fg hover:bg-bg-hover',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
        )}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
          <span className="flex-1 truncate font-medium">{item.label}</span>
        </span>
        {item.badge && (
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full">
            {item.badge}
          </span>
        )}
        <svg
          className={cn(
            'w-4 h-4 flex-shrink-0 transition-transform duration-200',
            'text-fg-muted',
            open && 'rotate-90'
          )}
        >
          <path d="M9 5l6 5-6 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && item.children && (
        <ul className="mt-1 ml-8 space-y-1 border-l border-border/50 pl-2">
          {item.children.map((child, i) => (
            <li key={child.href}>
              <a
                href={child.href}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
                  'text-fg-muted hover:text-fg hover:bg-bg-hover',
                  'transition-colors duration-150'
                )}
              >
                {child.icon && <span className="w-4 h-4 flex-shrink-0">{child.icon}</span>}
                <span className="truncate">{child.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}