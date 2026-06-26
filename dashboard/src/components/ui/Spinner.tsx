import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'accent' | 'fg' | 'fg-muted' | 'white';
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'accent', ...props }, ref) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    };

    const colors = {
      accent: 'text-accent',
      fg: 'text-fg',
      'fg-muted': 'text-fg-muted',
      white: 'text-white',
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex', sizes[size], colors[color], className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <svg
          className="animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, lines = 1, ...props }, ref) => {
    const baseStyle = {
      width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    } as React.CSSProperties;

    if (variant === 'circular') {
      return (
        <div
          ref={ref}
          className={cn(
            'animate-pulse rounded-full bg-bg-tertiary',
            className
          )}
          style={{ ...baseStyle, width: width || '1rem', height: height || '1rem' }}
          {...props}
        />
      );
    }

    if (variant === 'rectangular') {
      return (
        <div
          ref={ref}
          className={cn('animate-pulse rounded-lg bg-bg-tertiary', className)}
          style={baseStyle}
          {...props}
        />
      );
    }

    // Text variant - multiple lines
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-4 bg-bg-tertiary rounded"
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              ...baseStyle,
            }}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';