import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface Links {
  label: string;
  href: string;
  icon: ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        'sticky top-0 h-screen px-4 py-4 hidden md:flex md:flex-col w-[300px] shrink-0',
        className,
      )}
      animate={{
        width: animate ? (open ? '300px' : '70px') : '300px',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        'h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-[#F2FFDF] w-full',
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <Menu
          className="text-neutral-800 cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'fixed h-full w-full inset-0 p-10 z-[100] flex flex-col justify-between',
              className,
            )}
          >
            <div
              className="absolute right-10 top-10 z-50 text-neutral-800 cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
} & Omit<LinkProps, 'to' | 'onClick'>) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-start gap-2 group/sidebar py-2',
        className,
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-inherit text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
