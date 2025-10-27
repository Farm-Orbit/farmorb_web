import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}

interface SelectContentProps {
  children: ReactNode;
  className?: string;
  onItemClick?: (value: string) => void;
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child as any, {
              onClick: () => setIsOpen(!isOpen),
              isOpen,
            });
          } else if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child as any, {
              onItemClick: handleItemClick,
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '', isOpen, ...props }) => {
  return (
    <button
      type="button"
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
      <svg
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '', onItemClick }) => {
  return (
    <div className={`absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg ${className}`}>
      <div className="py-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child as any, {
              onClick: () => onItemClick?.((child.props as any).value),
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ children, className = '', onClick }) => {
  return (
    <button
      type="button"
      className={`w-full px-3 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className = '' }) => {
  return (
    <span className={`text-gray-900 dark:text-white ${className}`}>
      {placeholder}
    </span>
  );
};
