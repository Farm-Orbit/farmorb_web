"use client";

import { Fragment, ReactNode, useState, useEffect, useRef } from 'react';

export interface SidebarNavItem<TValue extends string = string> {
  id: TValue;
  label: string;
  testId?: string;
}

export interface SidebarNavProps<TValue extends string = string> {
  items: SidebarNavItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  selectLabel?: string;
  className?: string;
  selectTestId?: string;
  selectId?: string;
  renderItem?: (item: SidebarNavItem<TValue>, isActive: boolean) => ReactNode;
}

export default function SidebarNav<TValue extends string = string>({
  items,
  value,
  onChange,
  selectLabel = 'Select option',
  className = '',
  selectTestId,
  selectId = 'sidebar-nav-select',
  renderItem,
}: SidebarNavProps<TValue>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when value changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [value]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleItemClick = (itemId: TValue) => {
    onChange(itemId);
    setIsMobileMenuOpen(false);
  };

  const currentItem = items.find((item) => item.id === value);

  return (
    <Fragment>
      {/* Mobile dropdown container */}
      <div className="relative mb-2 md:hidden">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:border-blue-500"
          data-testid={selectTestId || 'sidebar-nav-hamburger'}
          aria-label={selectLabel}
          aria-expanded={isMobileMenuOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span className="font-medium">{currentItem?.label || selectLabel}</span>
          </div>
          <svg
            className={`h-4 w-4 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isMobileMenuOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1">
              {items.map((item) => {
                const isActive = value === item.id;

                if (renderItem) {
                  return (
                    <div key={item.id} onClick={() => handleItemClick(item.id)} role="menuitem">
                      {renderItem(item, isActive)}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    data-testid={item.testId}
                    role="menuitem"
                    className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors first:rounded-t-md last:rounded-b-md ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop navigation */}
      <nav className={`hidden md:flex md:flex-col gap-1 ${className}`} aria-label="Sidebar navigation">
        {items.map((item) => {
          const isActive = value === item.id;

          if (renderItem) {
            return <Fragment key={item.id}>{renderItem(item, isActive)}</Fragment>;
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              data-testid={item.testId}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </Fragment>
  );
}

