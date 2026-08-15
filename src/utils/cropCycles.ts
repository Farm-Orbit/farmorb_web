import { GrowingType, PlantingCycle } from '@/types/crop';

/**
 * Cycles are stored in schema vocabulary — `cycle_type`, `cycle_number`,
 * `season_year`. Nobody in a field says any of that. Everything user-facing
 * goes through here so the wording stays consistent, and so there is one place
 * to change it.
 */

/** "2027 season", "Ratoon 2", "Mother crop". */
export function cycleLabel(cycle: Pick<PlantingCycle, 'cycle_type' | 'cycle_number' | 'season_year'>): string {
    switch (cycle.cycle_type) {
        case 'season':
            return cycle.season_year ? `${cycle.season_year} season` : `Season ${cycle.cycle_number}`;
        case 'ratoon':
            // Cycle 1 is the mother crop, so ratoons start counting from cycle 2.
            return `Ratoon ${Math.max(cycle.cycle_number - 1, 1)}`;
        case 'mother':
        default:
            return 'Mother crop';
    }
}

/** Label for the button that advances a planting, given what comes next. */
export function nextCycleLabel(
    growingType: GrowingType | undefined | null,
    cycles: Pick<PlantingCycle, 'cycle_type' | 'cycle_number' | 'season_year'>[]
): string | null {
    if (growingType === 'perennial') {
        const latestYear = cycles.reduce(
            (max, c) => (c.season_year && c.season_year > max ? c.season_year : max),
            0
        );
        return latestYear ? `Start ${latestYear + 1} season` : 'Start next season';
    }
    if (growingType === 'ratoon') {
        const ratoons = cycles.filter((c) => c.cycle_type === 'ratoon').length;
        return `Start ratoon ${ratoons + 1}`;
    }
    // Annual and biennial crops do not carry over into another cycle.
    return null;
}

/** Whether the planting can advance at all — drives showing the action. */
export function canStartNextCycle(
    growingType: GrowingType | undefined | null,
    cycles: Pick<PlantingCycle, 'cycle_type'>[],
    maxRatoonCycles?: number | null
): boolean {
    if (growingType === 'perennial') return true;
    if (growingType !== 'ratoon') return false;
    if (maxRatoonCycles == null) return true;
    return cycles.filter((c) => c.cycle_type === 'ratoon').length < maxRatoonCycles;
}

/** The cycle a new harvest should land in, without asking the user. */
export function activeCycle<T extends Pick<PlantingCycle, 'status' | 'cycle_number'>>(
    cycles: T[]
): T | undefined {
    return (
        cycles.find((c) => c.status === 'active') ??
        [...cycles].sort((a, b) => b.cycle_number - a.cycle_number)[0]
    );
}
