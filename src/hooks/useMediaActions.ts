import { useState, useCallback } from 'react';
import { mediaService } from '../services/media.service.ts';
import { MediaItem } from '../interfaces/MediaItem.ts';

export const useMediaActions = (setMedias: React.Dispatch<React.SetStateAction<MediaItem[]>>) => {
  const [currentSerie, setCurrentSeries] = useState<MediaItem | null>(null);
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState<any>(null);

  const fetchLastWatched = useCallback(async () => {
    try {
      const response = await mediaService.fetchLastWatched();
      if (response && response.data) {
        setLastWatchedEpisode(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Error fetching last watched:', err);
    }
    return null;
  }, []);

  const openVlc = useCallback(async (title: string, aliasRoute: number) => {
    try {
      await mediaService.openVlc(title, aliasRoute);
      // Añadimos un pequeño delay o esperamos a la respuesta para asegurar 
      // que el backend registró la apertura antes de pedir el nuevo status
      setTimeout(async () => {
        await fetchLastWatched();
      }, 500);
    } catch (err) {
      console.error('Error opening VLC:', err);
    }
  }, [fetchLastWatched]);

  const handleToggleWatched = useCallback(async (media: MediaItem, watched: boolean) => {
    // Verificación de seguridad antes de llamar al servicio
    if (!media.folder || !media.title) return;

    try {
      await mediaService.markedAsWatched(media.folder, media.title, watched);
      
      // Actualizamos la lista local
      setMedias(prev => prev.map(a => 
        a.title === media.title ? { ...a, watched } : a
      ));

      // Si marcamos como visto, refrescamos el último visto para que la UI brille
      await fetchLastWatched();
    } catch (err) {
      console.error('Error toggling watched status:', err);
    }
  }, [setMedias, fetchLastWatched]);

  return { 
    currentSerie, setCurrentSeries, 
    lastWatchedEpisode, fetchLastWatched, 
    openVlc, handleToggleWatched 
  };
};