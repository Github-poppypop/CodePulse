import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-border',
              'bg-bg-tertiary transition-all duration-150',
              'checked:bg-accent checked:border-accent checked:text-accent-fg',
              'indeterminate:bg-accent indeterminate:border-accent indeterminate:text-accent-fg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            aria-describedby={description ? `${checkboxId}-desc` : undefined}
            {...props}
          />
          {(props.checked || indeterminate) && (
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-current pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {indeterminate ? (
                <line x1="4" y1="8" x2="12" y2="8" />
              ) : (
                <polyline points="3 8 7 12 13 4" />
              )}
            </svg>
          )}
        </div>
        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  props.disabled ? 'text-fg-muted' : 'text-fg'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={`${checkboxId}-desc`} className="text-xs text-fg-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              'peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-border',
              'bg-bg-tertiary transition-all duration-150',
              'checked:bg-accent checked:border-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            aria-describedby={description ? `${radioId}-desc` : undefined}
            {...props}
          />
          <span
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent opacity-0',
              'peer-checked:opacity-100 transition-opacity duration-100'
            )}
          />
        </div>
        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  props.disabled ? 'text-fg-muted' : 'text-fg'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={`${radioId}-desc`} className="text-xs text-fg-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';