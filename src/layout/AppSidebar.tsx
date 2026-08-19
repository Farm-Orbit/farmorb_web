"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useFarms } from "@/hooks/useFarms";
import FarmSwitcher from "./FarmSwitcher";
import {
  buildFarmNav,
  defaultFarmTab,
  isFarmTab,
  type FarmTab,
} from "./navigation/farmNav";
import {
  BoxIcon,
  HorizontaLDots,
  MailIcon,
} from "@/icons";

interface GlobalNavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

// Profile deliberately lives only in the header account menu. Duplicating it
// here gives the page two links to the same href, which is both redundant
// navigation and an ambiguous target.
//
// Dashboard and Farms were two entries pointing at the same job; now that the
// home page is the farm list, they are one.
const globalNavItems: GlobalNavItem[] = [
  { name: "Farms", path: "/", icon: <BoxIcon /> },
  { name: "My Invitations", path: "/invitations", icon: <MailIcon /> },
];

/** Keeps the ids the E2E suite already clicks (e.g. `farms-sidebar-button`). */
const sidebarTestId = (name: string) =>
  `${name.toLowerCase().replace(/\s+/g, "-")}-sidebar-button`;

/** `/farms/<id>` and anything below it, but not `/farms` or `/farms/create`. */
function farmIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/farms\/([^/]+)/);
  if (!match || match[1] === "create") return null;
  return match[1];
}

const menuItemClass = (active: boolean, showLabels: boolean) =>
  `menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${
    showLabels ? "lg:justify-start" : "lg:justify-center"
  }`;

const iconClass = (active: boolean) =>
  active ? "menu-item-icon-active" : "menu-item-icon-inactive";

function SectionHeading({
  title,
  showLabels,
}: {
  title: string;
  showLabels: boolean;
}) {
  return (
    <h2
      className={`mb-3 flex text-xs uppercase leading-[20px] text-gray-400 ${
        showLabels ? "justify-start" : "lg:justify-center"
      }`}
    >
      {showLabels ? title : <HorizontaLDots />}
    </h2>
  );
}

/**
 * The farm's sections. Split out because it reads `?tab=`, and useSearchParams
 * needs a Suspense boundary for the statically prerendered admin pages.
 */
function FarmSectionNav({
  farmId,
  farmType,
  showLabels,
}: {
  farmId: string;
  farmType?: string | null;
  showLabels: boolean;
}) {
  const searchParams = useSearchParams();
  const sections = useMemo(() => buildFarmNav(farmType), [farmType]);

  const tabParam = searchParams.get("tab");
  const activeTab: FarmTab =
    tabParam && isFarmTab(tabParam) ? tabParam : defaultFarmTab(farmType);

  return (
    <>
      {sections.map((section) => (
        <div key={section.title}>
          <SectionHeading title={section.title} showLabels={showLabels} />
          <ul className="flex flex-col gap-1.5">
            {section.items.map((item) => {
              const active = item.id === activeTab;
              return (
                <li key={item.id}>
                  <Link
                    href={`/farms/${farmId}?tab=${item.id}`}
                    className={menuItemClass(active, showLabels)}
                    data-testid={`nav-${item.id}`}
                    title={item.label}
                  >
                    <span className={iconClass(active)}>{item.icon}</span>
                    {showLabels && (
                      <span className="menu-item-text">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { farms, currentFarm, getFarms } = useFarms();

  const showLabels = isExpanded || isHovered || isMobileOpen;
  const farmId = farmIdFromPath(pathname);

  // The switcher needs the full list, which the farms page may never have
  // loaded if the user deep-linked straight into a farm.
  useEffect(() => {
    if (farmId && farms.length === 0) {
      getFarms({ page: 1, pageSize: 100 });
    }
  }, [farmId, farms.length, getFarms]);

  const activeFarm = useMemo(() => {
    if (!farmId) return null;
    return (
      farms.find((farm) => farm.id === farmId) ??
      (currentFarm?.id === farmId ? currentFarm : null)
    );
  }, [farmId, farms, currentFarm]);

  const isGlobalActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${showLabels ? "w-[240px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${showLabels ? "justify-start" : "lg:justify-center"}`}
      >
        <Link href="/">
          <Image
            src="/images/logo/farmorblogo.png"
            alt="FarmOrbit"
            width={showLabels ? 154 : 32}
            height={32}
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pb-6 duration-300 ease-linear no-scrollbar">
        {farmId ? (
          <nav className="flex flex-1 flex-col gap-6">
            <FarmSwitcher
              farms={farms}
              currentFarm={activeFarm}
              farmId={farmId}
              showLabels={showLabels}
            />

            <Suspense
              fallback={
                <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.03]" />
              }
            >
              <FarmSectionNav
                farmId={farmId}
                farmType={activeFarm?.farm_type}
                showLabels={showLabels}
              />
            </Suspense>

            {/* Leaving a farm is the switcher's job — it already lists every
                farm and offers a new one. A second route to the same place
                made it feel like two pages doing one thing. */}
            <div className="mt-auto border-t border-gray-200 pt-4 dark:border-gray-800">
              <ul className="flex flex-col gap-1.5">
                <li>
                  <Link
                    href="/invitations"
                    className={menuItemClass(false, showLabels)}
                    data-testid="my-invitations-sidebar-button"
                    title="My Invitations"
                  >
                    <span className={iconClass(false)}>
                      <MailIcon />
                    </span>
                    {showLabels && (
                      <span className="menu-item-text">My Invitations</span>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        ) : (
          <nav>
            <SectionHeading title="Menu" showLabels={showLabels} />
            <ul className="flex flex-col gap-1.5">
              {globalNavItems.map((item) => {
                const active = isGlobalActive(item.path);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      className={menuItemClass(active, showLabels)}
                      data-testid={sidebarTestId(item.name)}
                      title={item.name}
                    >
                      <span className={iconClass(active)}>{item.icon}</span>
                      {showLabels && (
                        <span className="menu-item-text">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
