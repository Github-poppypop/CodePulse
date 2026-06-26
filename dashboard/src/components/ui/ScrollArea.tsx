import { HTMLAttributes, forwardRef, useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  scrollbars?: 'auto' | 'always' | 'never';
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, scrollbars = 'auto', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'overflow-auto',
        scrollbars === 'never' && 'scrollbar-hide',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

ScrollArea.displayName = 'ScrollArea';