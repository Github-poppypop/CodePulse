import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ScrollArea } from '../ui/ScrollArea';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category: string;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

export function CommandPalette({ open, onClose, items, placeholder = 'Search commands...' }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredItems = items.filter(item => {
    const searchText = `${item.label} ${item.description || ''} ${item.category} ${item.keywords?.join(' ') || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const categories = new Map<string, CommandItem[]>();
  filteredItems.forEach(item => {
    if (!categories.has(item.category)) categories.set(item.category, []);
    categories.get(item.category)!.push(item);
  });

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].action();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="lg" closeOnOverlayClick closeOnEscape>
      <div className="space-y-4">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          leftIcon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="7"/><path d="M13 13l4 4"/></svg>}
          className="text-lg py-3"
        />
        <ScrollArea className="max-h-[60vh]">
          {categories.size === 0 ? (
            <div className="py-8 text-center text-fg-muted">No commands found</div>
          ) : (
            Array.from(categories.entries()).map(([category, categoryItems]) => (
              <div key={category} className="space-y-1">
                <h4 className="px-3 text-xs font-semibold text-fg-subtle uppercase tracking-wider">{category}</h4>
                {categoryItems.map((item, index) => {
                  const globalIndex = filteredItems.indexOf(item);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { item.action(); onClose(); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                        'transition-colors duration-100',
                        isSelected ? 'bg-accent/10 text-accent' : 'text-fg hover:bg-bg-hover'
                      )}
                    >
                      {item.icon && <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{item.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <span className={cn('font-medium truncate block', isSelected ? '' : 'text-fg-muted')}>{item.label}</span>
                        {item.description && <span className={cn('text-xs truncate block', isSelected ? 'text-accent/70' : 'text-fg-subtle')}>{item.description}</span>}
                      </div>
                      {item.shortcut && (
                        <kbd className={cn('px-2 py-0.5 text-xs rounded bg-bg-tertiary border border-border', isSelected ? 'bg-accent/20 border-accent/30' : '')}>
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </ScrollArea>
      </div>
    </Modal>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  return { open, setOpen, toggle: () => setOpen(p => !p) };
}

export function useGlobalCommandPalette(onClose: () => void) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!internalOpen) setInternalOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [internalOpen]);
}