import * as React from 'react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../ui/Tooltip';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  dropdownItems?: Array<{ label: string; href: string; onClick?: () => void }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

export function Breadcrumbs({ items, separator = <span className="mx-2 text-fg-subtle">/</span>, maxItems = 5 }: BreadcrumbsProps) {
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const visibleItems = items.length > maxItems
    ? [items[0], { label: '...', href: '#' }, ...items.slice(-maxItems + 2)]
    : items;

  return (
    <nav ref={dropdownRef} className="flex items-center gap-1 flex-wrap" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1" role="list">
        {visibleItems.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && <span className="text-fg-subtle">{separator}</span>}
            {item.dropdownItems && item.dropdownItems.length > 0 ? (
              <Tooltip content="Select sibling" position="bottom">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-sm',
                      'text-fg-muted hover:text-fg hover:bg-bg-hover',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
                    )}
                    aria-haspopup="listbox"
                  >
                    <span className="truncate max-w-[150px]">{item.label}</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 5l3 4-3 4" />
                    </svg>
                  </button>
                  {openDropdown === item.label && (
                    <div className="fixed z-[1400] min-w-[200px] bg-card-bg border border-card-border rounded-lg shadow-lg py-1" role="listbox">
                      {item.dropdownItems.map((subItem, subIndex) => (
                        <a
                          key={subItem.href}
                          href={subItem.href}
                          onClick={(e) => { e.preventDefault(); subItem.onClick?.(); setOpenDropdown(null); }}
                          className="block px-3 py-2 text-sm text-fg hover:bg-bg-hover first:rounded-t-lg last:rounded-b-lg"
                          role="option"
                        >
                          {subItem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </Tooltip>
            ) : item.href || item.onClick ? (
              <a
                href={item.href}
                onClick={item.onClick}
                className={cn(
                  'px-2 py-1 rounded-lg text-sm font-medium transition-colors duration-150',
                  index === items.length - 1
                    ? 'text-fg font-medium'
                    : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
                )}
              >
                {item.label}
              </a>
            ) : (
              <span className={cn('px-2 py-1 rounded-lg text-sm font-medium', index === items.length - 1 ? 'text-fg' : 'text-fg-muted')}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}