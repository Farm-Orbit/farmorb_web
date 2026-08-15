import React from "react";
import {
  BoxCubeIcon,
  BoxIcon,
  CheckCircleIcon,
  DocsIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  PencilIcon,
  PaperPlaneIcon,
  PieChartIcon,
  ShootingStarIcon,
  TaskIcon,
  TimeIcon,
  UserCircleIcon,
} from "@/icons";

/**
 * Single source of truth for a farm's sections.
 *
 * Both the global sidebar and the farm detail page's in-page tab strip are
 * built from this list, so they cannot drift apart. Sections are still
 * addressed by the `?tab=` query param the detail page already uses.
 */
export type FarmTab =
  | "crops"
  | "locations"
  | "plantings"
  | "harvests"
  | "activities"
  | "animals"
  | "groups"
  | "breeding"
  | "health"
  | "feeding"
  | "inventory"
  | "suppliers"
  | "details"
  | "members"
  | "activity";

export interface FarmNavItem {
  id: FarmTab;
  label: string;
  icon: React.ReactNode;
}

export interface FarmNavSection {
  title: string;
  items: FarmNavItem[];
}

export const isCropFarm = (farmType?: string | null): boolean =>
  farmType === "crop" || farmType === "mixed";

/** Livestock is the fallback: a farm with no type set still gets animal sections. */
export const isLivestockFarm = (farmType?: string | null): boolean =>
  !farmType ||
  farmType === "livestock" ||
  farmType === "dairy" ||
  farmType === "poultry" ||
  farmType === "mixed" ||
  farmType === "other";

const CROP_SECTION: FarmNavSection = {
  title: "Crops",
  items: [
    { id: "crops", label: "Crops", icon: <ListIcon /> },
    { id: "locations", label: "Locations", icon: <GridIcon /> },
    { id: "plantings", label: "Plantings", icon: <BoxCubeIcon /> },
    { id: "harvests", label: "Harvests", icon: <TaskIcon /> },
    { id: "activities", label: "Activities", icon: <PencilIcon /> },
  ],
};

const LIVESTOCK_SECTION: FarmNavSection = {
  title: "Livestock",
  items: [
    { id: "animals", label: "Animals", icon: <BoxIcon /> },
    { id: "groups", label: "Groups", icon: <GroupIcon /> },
    { id: "breeding", label: "Breeding", icon: <ShootingStarIcon /> },
    { id: "health", label: "Health", icon: <CheckCircleIcon /> },
    { id: "feeding", label: "Feeding", icon: <PieChartIcon /> },
  ],
};

const OPERATIONS_SECTION: FarmNavSection = {
  title: "Operations",
  items: [
    { id: "inventory", label: "Inventory", icon: <FolderIcon /> },
    { id: "suppliers", label: "Suppliers", icon: <PaperPlaneIcon /> },
  ],
};

const FARM_SECTION: FarmNavSection = {
  title: "Farm",
  items: [
    { id: "details", label: "Details", icon: <DocsIcon /> },
    { id: "members", label: "Members", icon: <UserCircleIcon /> },
    { id: "activity", label: "Activity", icon: <TimeIcon /> },
  ],
};

/**
 * Sections available for a farm, gated by its type. Inventory and suppliers
 * follow the livestock gate, matching what the detail page has always shown.
 */
export function buildFarmNav(farmType?: string | null): FarmNavSection[] {
  const sections: FarmNavSection[] = [];

  if (isCropFarm(farmType)) {
    sections.push(CROP_SECTION);
  }
  if (isLivestockFarm(farmType)) {
    sections.push(LIVESTOCK_SECTION, OPERATIONS_SECTION);
  }
  sections.push(FARM_SECTION);

  return sections;
}

/** The section a farm opens on when no `?tab=` is present. */
export function defaultFarmTab(farmType?: string | null): FarmTab {
  return isCropFarm(farmType) ? "crops" : "animals";
}

export const isFarmTab = (value: string): value is FarmTab =>
  [
    "crops",
    "locations",
    "plantings",
    "harvests",
    "activities",
    "animals",
    "groups",
    "breeding",
    "health",
    "feeding",
    "inventory",
    "suppliers",
    "details",
    "members",
    "activity",
  ].includes(value);
