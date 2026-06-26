import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Switch({ className, label, description, size = 'md', id, ...props }: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;

  const sizes = {
    sm: 'w-8 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-8',
  };

  const thumbSizes = {
    sm: 'w-4 h-4 translate-x-1',
    md: 'w-5 h-5 translate-x-1',
    lg: 'w-6 h-6 translate-x-1',
  };

  const thumbTranslate = {
    sm: 'peer-checked:translate-x-4',
    md: 'peer-checked:translate-x-5',
    lg: 'peer-checked:translate-x-7',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          role="switch"
          id={switchId}
          className={cn(
            'peer appearance-none rounded-full border-2 border-border',
            'bg-bg-tertiary transition-all duration-200 ease-out',
            'checked:bg-accent checked:border-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizes[size],
            thumbSizes[size],
            thumbTranslate[size],
            className
          )}
          aria-describedby={description ? `${switchId}-desc` : undefined}
          {...props}
        />
        <span
          className={cn(
            'absolute top-0.5 left-0.5 rounded-full bg-white shadow-lg transition-transform duration-200',
            sizes[size],
            thumbSizes[size],
            thumbTranslate[size]
          )}
          aria-hidden="true"
        />
      </div>
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium cursor-pointer',
                props.disabled ? 'text-fg-muted' : 'text-fg'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={`${switchId}-desc`} className="text-xs text-fg-muted mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}