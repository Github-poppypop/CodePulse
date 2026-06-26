import * as React from 'react';
import { cn } from '../../utils/cn';
import { Portal } from './Portal';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const childRef = React.useRef<HTMLElement | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  React.useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const child = React.Children.only(children);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-fg border-x-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-fg border-x-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-fg border-y-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-fg border-y-transparent',
  };

  return (
    <div className="relative inline-flex">
      {React.cloneElement(children, {
        ref: childRef,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
      })}
      {open && (
        <Portal>
          <div
            className={cn(
              'fixed z-[1600] px-3 py-1.5 text-xs font-medium text-fg bg-fg rounded-lg shadow-lg',
              'animate-fade-in whitespace-nowrap max-w-[300px]',
              positions[position]
            )}
            role="tooltip"
          >
            {content}
            <div className={cn('absolute w-0 h-0 border-4 border-transparent', arrows[position])} />
          </div>
        </Portal>
      )}
    </div>
  );
}