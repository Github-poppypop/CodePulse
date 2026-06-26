import * as React from 'react';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Divider } from '../ui/Divider';
import { Tooltip } from '../ui/Tooltip';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
  }>;
  orgs?: Array<{ name: string; current: boolean; onSelect: () => void }>;
}

export function UserMenu({ user, items, orgs }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const buttonClasses = cn(
    'flex items-center gap-2 p-1.5 rounded-lg',
    'text-fg-muted hover:text-fg hover:bg-bg-hover',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
  );

  return (
    <div ref={ref} className="relative">
      <Tooltip content="User menu" position="bottom">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={buttonClasses}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Avatar size="sm" src={user.avatar} fallback={user.name.slice(0, 2)} />
          <span className="hidden sm:block font-medium text-sm">{user.name}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 5l3 4-3 4" />
          </svg>
        </button>
      </Tooltip>

      {open && (
        <div
          className="fixed right-4 top-full z-[1400] mt-2 w-56 bg-card-bg border border-card-border rounded-xl shadow-lg py-1 animate-fade-in"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-card-border">
            <p className="font-medium text-sm text-fg">{user.name}</p>
            <p className="text-xs text-fg-muted truncate">{user.email}</p>
          </div>

          {orgs && orgs.length > 0 && (
            <div className="py-2">
              <p className="px-3 text-xs font-semibold text-fg-subtle uppercase tracking-wider">Organization</p>
              {orgs.map((org) => (
                <button
                  key={org.name}
                  type="button"
                  onClick={() => { org.onSelect(); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm',
                    'text-fg-muted hover:text-fg hover:bg-bg-hover',
                    'transition-colors duration-150',
                    org.current && 'text-accent font-medium bg-accent/10'
                  )}
                  role="menuitem"
                >
                  {org.current && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  {org.name}
                </button>
              ))}
            </div>
          )}

          <Divider className="my-1" />

          {items.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm',
                'text-fg-muted hover:text-fg hover:bg-bg-hover',
                'transition-colors duration-150',
                item.danger && 'text-error hover:bg-error/10'
              )}
              role="menuitem"
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}

          <Divider className="my-1" />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-bg-hover"
            role="menuitem"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5l4 4-4 4" />
            </svg>
            Close menu
          </button>
        </div>
      )}
    </div>
  );
}