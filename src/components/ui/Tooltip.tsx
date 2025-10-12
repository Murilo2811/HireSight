import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, className }) => {
  return (
    <div className={`relative flex items-center group ${className}`}>
      {children}
      <div className="absolute bottom-full mb-2 w-max max-w-xs transform -translate-x-1/2 left-1/2 z-50 scale-0 group-hover:scale-100 transition-transform duration-150 ease-in-out origin-bottom">
        <div className="rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-white dark:text-gray-100 shadow-lg">
          {content}
        </div>
        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </div>
  );
};

export default Tooltip;
