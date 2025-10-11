import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface DropdownMenuContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps | undefined>(undefined);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{ children: React.ReactNode, asChild?: boolean }> = ({ children, asChild }) => {
  const { setOpen } = useDropdownMenu();
  const child = React.Children.only(children) as React.ReactElement;
  
  if (asChild) {
      // FIX: Cast child to React.ReactElement<any> to allow passing additional props like onClick.
      // The onClick handler now properly composes with any onClick prop on the child.
      return React.cloneElement(child as React.ReactElement<any>, {
          onClick: (event: React.MouseEvent<unknown>) => {
              // Fix: Cast props to `any` to handle `onClick` from child, preventing a TypeScript error where props is `unknown`.
              (child.props as any).onClick?.(event);
              setOpen(o => !o);
          },
          'aria-expanded': true,
          'aria-haspopup': true,
      });
  }
  
  return (
    <button onClick={() => setOpen(o => !o)} aria-expanded="true" aria-haspopup="true">
      {children}
    </button>
  );
};

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end';
    forceMount?: boolean;
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
    ({ className, children, align = 'end', ...props }, ref) => {
    const { open, setOpen } = useDropdownMenu();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open, setOpen]);

    if (!open) return null;

    const alignClass = align === 'end' ? 'right-0' : 'left-0';

    return (
      <div
        ref={menuRef}
        className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-fade-in ${alignClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';


export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onSelect?: (event: Event) => void }
>(({ className, children, onSelect, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();
    return (
        <div
            ref={ref}
            className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground ${className}`}
            onClick={(e) => {
                onSelect?.(e.nativeEvent);
                setOpen(false);
            }}
            {...props}
        >
            {children}
        </div>
    );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={`px-2 py-1.5 text-sm font-semibold ${className}`} {...props} />
);

export const DropdownMenuSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={`-mx-1 my-1 h-px bg-muted ${className}`} {...props} />
);

export const DropdownMenuGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
    <div {...props} />
);