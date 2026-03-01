import { MediaItem } from "../interfaces/MediaItem";
import { EpisodeDTO } from "../interfaces/EpisodeDTO";
import { SeriesInfo } from "../interfaces/SeriesInfo";

export const mediaMapper = {
  toMediaItem: (item: Partial<EpisodeDTO>): MediaItem => ({
    title: item.fullName ?? 'Episodio desconocido',
    image: item.frameUrl ?? '/placeholder.png',
    folder: item.folder ?? '',
    aliasRoute: String(item.aliasRoute) ?? '0',
    watched: Boolean(item.watched)
  }),

  toSeriesList: (data: Record<string, EpisodeDTO[]>): SeriesInfo[] => {
    return Object.entries(data).map(([title, info]) => {
      const firstItem = info?.[0] || {};
      return {
        title,
        aliasRoute: firstItem.aliasRoute ?? 'Unknown',
        image: firstItem.frameUrl ?? '',
        status: 'Pendiente',
      };
    });
  }
};