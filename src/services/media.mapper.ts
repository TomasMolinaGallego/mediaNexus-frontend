import { MediaItem } from "../interfaces/MediaItem";
import { EpisodeDTO } from "../interfaces/EpisodeDTO";
import { SeriesInfo } from "../interfaces/SeriesInfo";

export const mediaMapper = {
  toMediaItem: (item: Partial<EpisodeDTO>): MediaItem => ({
    title: item.episodeName ?? 'Episodio desconocido',
    image: item.frameUrl ?? '/placeholder.png',
    folder: item.seriesName ?? '',
    aliasRoute: String(item.aliasRoute) ?? '0',
    watched: Boolean(item.isEpisodeWatched),
    episodeNumber: item.episodeNumber,
    seasonNumber: item.seasonNumber,
  }),

  toSeriesList: (data: Record<string, EpisodeDTO[]>): SeriesInfo[] => {
    return Object.entries(data).map(([title, info]) => {
      const firstItem = info?.[0] || {};
      return {
        title,
        aliasRoute: firstItem.aliasRoute ?? 'Unknown',
        image: firstItem.frameUrl ?? '',
        status: 'Todos', // Placeholder, should be set based on actual data
      };
    });
  }
};