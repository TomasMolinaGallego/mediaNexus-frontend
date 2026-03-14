import { useState, useCallback } from 'react';
import { mediaService } from '../services/media.service.ts';
import { MediaItem } from '../interfaces/MediaItem.ts';

export const useMediaActions = (setMedias: React.Dispatch<React.SetStateAction<MediaItem[]>>) => {
  const [currentSerie, setCurrentSeries] = useState(null);
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState(null);

  const fetchLastWatched = useCallback(async () => {
    const { data } = await mediaService.fetchLastWatched();
    setLastWatchedEpisode(data);
    return data;
  }, []);

  const openVlc = useCallback(async (title: string, aliasRoute: number, isFromCard: boolean) => {
    await mediaService.openVlc(title, aliasRoute);
    if (isFromCard) {
      const cleanTitle = title.split('/').pop() || title;
      setMedias(prev => prev.map(a => a.title === cleanTitle ? { ...a, watched: true } : a));
    }
    await fetchLastWatched();
  }, [setMedias, fetchLastWatched]);

  const handleToggleWatched = useCallback(async (media: MediaItem, watched: boolean) => {
    await mediaService.markedAsWatched(media.folder!, media.title, watched);
    setMedias(prev => prev.map(a => a.title === media.title ? { ...a, watched } : a));
  }, [setMedias]);

  return { 
    currentSerie, setCurrentSeries, 
    lastWatchedEpisode, fetchLastWatched, 
    openVlc, handleToggleWatched 
  };
};