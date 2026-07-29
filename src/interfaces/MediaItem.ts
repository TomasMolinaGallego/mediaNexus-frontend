export interface MediaItem {
  id?: string;
  title: string;
  aliasRoute?: string;
  image?: string;
  status?: string;
  folder?: string;
  watched?: boolean;
  nextToWatch?: string,
  lastWatched?: string,
  watchedCount?: number,
  totalEpisodes?: number;
  isExternal?: boolean;
  externalId?: string;
  isAdded?: boolean;
  episodeNumber?: number;
  seasonNumber?: number;
  airDate?: string;
}