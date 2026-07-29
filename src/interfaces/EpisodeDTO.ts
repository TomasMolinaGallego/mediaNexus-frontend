
export interface EpisodeDTO {
    episodeName: string;
    frameUrl: string;
    seriesName: string;
    aliasRoute: string;
    isEpisodeWatched: boolean;
    episodeNumber?: number;
    seasonNumber?: number;
}