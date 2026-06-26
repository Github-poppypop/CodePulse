import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = 'horizontal', label, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          className={cn('h-full w-px bg-border', className)}
          role="separator"
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div className={cn('flex items-center gap-4', className)} role="separator" {...props}>
          <hr className="flex-1 border-border" />
          <span className="text-xs text-fg-subtle font-medium whitespace-nowrap">{label}</span>
          <hr className="flex-1 border-border" />
        </div>
      );
    }

    return (
      <hr ref={ref} className={cn('border-border', className)} {...props} />
    );
  }
);

Divider.displayName = 'Divider';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
        'bg-border',
        className
      )}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';