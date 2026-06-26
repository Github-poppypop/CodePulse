import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = React.useState(false);
  const portalRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
    portalRef.current = container || document.body;
    return () => { portalRef.current = null; };
  }, [container]);

  if (!mounted || !portalRef.current) return null;

  return ReactDOM.createPortal(children, portalRef.current);
}