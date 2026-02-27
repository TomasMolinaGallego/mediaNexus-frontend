export interface MediaItem {
  title: string;
  disk: string;
  image?: string;
  status?: string;
  folder?: string;
  watched?: boolean;
  nextToWatch?: string,
  lastWatched?: string,
  watchedCount?: number,
  totalEpisodes?: number;
}