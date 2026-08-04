import { MediaItem } from "../interfaces/MediaItem";

/**
 * Utility class to transform external API data (Sonarr) 
 * into our internal MediaItem format.
 */
export class MediaMapper {
  static toInternal(external: any, folder: string): MediaItem {
    return {
      id: external.id,
      title: external.title,
      image: '/placeholder.jpeg',
      folder: folder,
      aliasRoute: 'noRoute',
      status: 'No agregada',
      watched: false,
      isExternal: true,
      externalId: external.tvdbId,
      isAdded: true,
      episodeNumber: external.episodeNumber,
      seasonNumber: external.seasonNumber,
      airDate: external.airDate
    };
  }

  static fromSearch(item: any): MediaItem {
    return {
      title: item.title,
      image: item.poster,
      status: 'No agregada',
      watched: false,
      isExternal: true,
      externalId: item.tvdbId
    } as MediaItem;
  }
}