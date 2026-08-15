"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDownIcon, PlusIcon } from "@/icons";
import { Farm } from "@/types/farm";

interface FarmSwitcherProps {
  farms: Farm[];
  currentFarm: Farm | null;
  farmId: string;
  /** False when the sidebar is collapsed to icons. */
  showLabels: boolean;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "F";

export default function FarmSwitcher({
  farms,
  currentFarm,
  farmId,
  showLabels,
}: FarmSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  // The farm list is loaded asynchronously; until it arrives show the id-based
  // placeholder rather than an empty box that shifts layout when it resolves.
  const name = currentFarm?.name ?? "Loading farm…";

  const select = (id: string) => {
    setIsOpen(false);
    router.push(`/farms/${id}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        data-testid="farm-switcher-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={name}
        className={`flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] ${
          showLabels ? "justify-start" : "justify-center"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500 text-xs font-semibold text-white">
          {currentFarm ? initials(currentFarm.name) : "…"}
        </span>
        {showLabels && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                {name}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {currentFarm?.farm_type
                  ? `${currentFarm.farm_type[0].toUpperCase()}${currentFarm.farm_type.slice(1)} farm`
                  : "Farm"}
              </span>
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          data-testid="farm-switcher-menu"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {farms.length > 1 && (
            <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
              Switch farm
            </p>
          )}

          {farms.map((farm) => (
            <button
              key={farm.id}
              type="button"
              role="option"
              aria-selected={farm.id === farmId}
              onClick={() => select(farm.id)}
              data-testid={`farm-switcher-option-${farm.id}`}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                farm.id === farmId
                  ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span className="truncate">{farm.name}</span>
            </button>
          ))}

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          <Link
            href="/farms/create"
            onClick={() => setIsOpen(false)}
            data-testid="farm-switcher-create"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <PlusIcon className="h-4 w-4" />
            New farm
          </Link>
        </div>
      )}
    </div>
  );
}
