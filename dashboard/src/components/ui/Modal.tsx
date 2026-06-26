import * as React from 'react';
import { cn } from '../../utils/cn';
import { Portal } from './Portal';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, size = 'md', closeOnOverlayClick = true, closeOnEscape = true, children }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const titleId = title ? `modal-title-${Math.random().toString(36).slice(2, 9)}` : undefined;
  const descId = description ? `modal-desc-${Math.random().toString(36).slice(2, 9)}` : undefined;

  React.useEffect(() => {
    setMounted(true);
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  React.useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  if (!mounted || !open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div
          className="fixed inset-0 bg-overlay animate-fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          className={cn(
            'relative w-full bg-card-bg border border-card-border rounded-xl shadow-xl',
            'animate-slide-up',
            sizes[size],
            'max-h-[90vh] overflow-hidden flex flex-col'
          )}
        >
          {(title || description) && (
            <div className="flex items-start justify-between p-6 border-b border-card-border">
              <div>
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold text-fg">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="text-sm text-fg-muted mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 5l-10 10M5 5l10 10" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}