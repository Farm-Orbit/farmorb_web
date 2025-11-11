"use client";

import { useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFarms } from '@/hooks/useFarms';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  farmId?: string;
  animalId?: string;
  groupId?: string;
  className?: string;
}

const routeLabels: Record<string, string> = {
  farms: 'Farms',
  animals: 'Animals',
  groups: 'Groups',
  breeding: 'Breeding',
  health: 'Health',
  records: 'Records',
  schedules: 'Schedules',
  members: 'Members',
  activity: 'Activity',
  details: 'Details',
  new: 'New',
  edit: 'Edit',
  invite: 'Invite Member',
  'breeding-records': 'Breeding Records',
  'health-records': 'Health Records',
  'health-schedules': 'Health Schedules',
  create: 'Create',
  'audit-logs': 'Audit Logs',
};

export default function Breadcrumbs({ items, farmId, animalId, groupId, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentFarm, getFarmById } = useFarms();
  const { currentAnimal } = useAnimals();
  const { currentGroup, getGroupById } = useGroups();

  // Load farm data if farmId is provided and not already loaded
  useEffect(() => {
    if (farmId && (!currentFarm || currentFarm.id !== farmId)) {
      getFarmById(farmId);
    }
  }, [farmId, currentFarm, getFarmById]);

  // Load group data if groupId is provided and not already loaded
  useEffect(() => {
    if (farmId && groupId && (!currentGroup || currentGroup.id !== groupId)) {
      getGroupById(farmId, groupId).catch((error) => {
        console.error('Failed to load group for breadcrumb:', error);
      });
    }
  }, [farmId, groupId, currentGroup, getGroupById]);

  const breadcrumbItems = useMemo(() => {
    // If custom items provided, use them
    if (items) {
      return items;
    }

    // Generate breadcrumbs from pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [];

    // Always start with Dashboard/Home
    generatedItems.push({
      label: 'Dashboard',
      href: '/',
    });

    // Build breadcrumbs based on path segments
    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;

      // Skip UUID segments, but use them to look up names
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

      if (isUUID) {
        // This is a dynamic segment (farm ID or animal ID)
        if (i === 1 && pathSegments[0] === 'farms') {
          // Farm ID
          const farm = farmId === segment ? currentFarm : null;
          const label = farm?.name || 'Farm';
          generatedItems.push({
            label,
            href: currentPath,
          });
        } else if (i === 3 && pathSegments[2] === 'animals') {
          // Animal ID
          const animal = animalId === segment ? currentAnimal : null;
          const label = animal?.name || animal?.tag_id || 'Animal';
          generatedItems.push({
            label,
            href: currentPath,
          });
        } else if (i === 3 && pathSegments[2] === 'groups') {
          // Group ID
          const group = groupId === segment ? currentGroup : null;
          const label = group?.name || 'Group';
          generatedItems.push({
            label,
            href: currentPath,
          });
        } else {
          // Other UUID - skip or use generic label based on context
          const prevSegment = i > 0 ? pathSegments[i - 1] : '';
          if (prevSegment === 'audit-logs') {
            generatedItems.push({
              label: 'Audit Log',
              href: currentPath,
            });
          }
          // Skip other UUIDs to keep breadcrumbs clean
          continue;
        }
      } else {
        // Static segment - use route label or capitalize
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        const isLast = i === pathSegments.length - 1;

        // Don't add href for the last segment
        generatedItems.push({
          label,
          href: isLast ? undefined : currentPath,
          isActive: isLast,
        });
      }
    }

    return generatedItems;
  }, [pathname, items, currentFarm, currentAnimal, currentGroup, farmId, animalId, groupId]);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center gap-1.5 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isActive = item.isActive ?? isLast;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {isActive || !item.href ? (
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.href!);
                  }}
                >
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <svg
                  className="h-4 w-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

