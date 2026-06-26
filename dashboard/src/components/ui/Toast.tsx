import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Portal } from './Portal';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
  duration?: number;
  onClose: () => void;
}

export function Toast({ title, description, variant = 'default', action, duration = 5000, onClose }: ToastProps) {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  React.useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  if (!open) return null;

  const variants = {
    default: 'bg-card-bg border border-card-border',
    success: 'bg-success/10 border border-success/30',
    warning: 'bg-warning/10 border border-warning/30',
    error: 'bg-error/10 border border-error/30',
    info: 'bg-accent/10 border border-accent/30',
  };

  const icons = {
    default: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M10 16h.01"/></svg>,
    success: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 10l4 4 8-8"/></svg>,
    warning: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3v14M10 18h.01"/></svg>,
    error: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M10 16h.01"/></svg>,
    info: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M10 16h.01"/></svg>,
  };

  return (
    <Portal>
      <div
        className={cn(
          'fixed bottom-4 right-4 z-[1500] w-[360px] rounded-xl p-4 gap-3',
          'animate-slide-in',
          variants[variant]
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex gap-3">
          <div className={cn('flex-shrink-0 text-lg', variant === 'default' && 'text-fg-muted', variant === 'success' && 'text-success', variant === 'warning' && 'text-warning', variant === 'error' && 'text-error', variant === 'info' && 'text-accent')}>
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            {title && <h4 className="font-semibold text-fg">{title}</h4>}
            {description && <p className="text-sm text-fg-muted mt-0.5">{description}</p>}
            {action && (
              <Button variant="ghost" size="sm" onClick={action.onClick} className="mt-2">
                {action.label}
              </Button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-shrink-0 p-1 rounded-lg text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5l-6 6M5 5l6 6" />
            </svg>
          </button>
        </div>
      </div>
    </Portal>
  );
}

const icons = {
  default: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M10 16h.01"/></svg>,
  success: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 10l4 4 8-8"/></svg>,
  warning: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3v14M10 18h.01"/></svg>,
  error: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M10 16h.01"/></svg>,
  info: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v6M10 16h.01"/></svg>,
};

interface ToastContextValue {
  toast: (props: Omit<ToastProps, 'onClose'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<{ id: string; props: Omit<ToastProps, 'onClose'> }>>([]);

  const toast = (props: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, props }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.map(({ id, props }) => (
        <Toast key={id} {...props} onClose={() => removeToast(id)} />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}