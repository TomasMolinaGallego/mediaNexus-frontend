
export interface ExternalSerieInfo {
    id: string;
    title: string;
    status: "continuing" | "ended" | "upcoming" | "unknown";
    overview: string;
    nextAiring?: string;
    previousAiring?: string;
    airTime?: string;
    images: ExternalSerieImage[];
    seasons: ExternalSerieSeason[];
    year?: number;
    path: string;
    runtime?: number;
    tvdbId?: number;
    tmdbId?: number;
    firstAired?: string;
    lastAired?: string;
    seriesType?: string;
    imdbId?: string;
    rootFolderPath?: string;
    genres?: string[];
    added?: string;
}

interface ExternalSerieImage {
    coverType: string;
    remoteUrl: string;
}

interface ExternalSerieSeason {
    seasonNumber: number;
    totalEpisodeCount: number;
    nextAiring?: string;
    previousAiring?: string;
}

