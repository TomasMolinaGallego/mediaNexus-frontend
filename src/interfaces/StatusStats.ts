/**
 * Interface representing the statistical counters for the media library.
 */
export interface StatusStats {
    total: number;
    completed: number;
    watching: number;
    planToWatch: number;
    dropped: number;
}