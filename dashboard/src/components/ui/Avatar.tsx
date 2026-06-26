import * as React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'away' | 'busy' | 'offline';
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

const statusColors = {
  online: 'bg-success',
  away: 'bg-warning',
  busy: 'bg-error',
  offline: 'bg-fg-subtle',
};

export function Avatar({ src, alt, fallback, size = 'md', shape = 'circle', status }: AvatarProps) {
  const shapeClass = shape === 'square' ? 'rounded-lg' : 'rounded-full';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('inline-flex items-center justify-center overflow-hidden bg-bg-tertiary border border-border', sizes[size], shapeClass)}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-fg-muted select-none">
          {fallback || '?'}
        </span>
      )}
      {status && (
        <span
          className={cn('absolute bottom-0 right-0 border-2 border-bg rounded-full', statusColors[status], statusSizes[size])}
          aria-label={status}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function AvatarGroup({ max = 5, size = 'md', children }: AvatarGroupProps) {
  const avatars = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<AvatarProps>[];
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlaps = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-2.5',
    xl: '-space-x-3',
  };

  return (
    <div className={cn('flex items-center', overlaps[size])}>
      {visible.map((child, index) => (
        <div key={child.key || index} className="relative z-[{avatars.length - index}]">
          {React.cloneElement(child as React.ReactElement<any>, { size })}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center bg-bg-tertiary border-2 border-bg font-medium text-fg-muted',
            sizes[size],
            'rounded-full'
          )}
          aria-label={`${remaining} more people`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}