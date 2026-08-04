import { useState, useCallback, useRef, useEffect } from 'react';
import { mediaService } from '../services/media.service.ts';
import { MediaItem } from '../interfaces/MediaItem.ts';

export const useMediaActions = (
  setMedias: React.Dispatch<React.SetStateAction<MediaItem[]>>
) => {
  const [currentSerie, setCurrentSeries] = useState<MediaItem | null>(null);
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState<MediaItem | null>(null);

  // Ref para limpiar temporizadores pendientes y evitar fugas de memoria
  const vlcTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener el último episodio visto
  const fetchLastWatched = useCallback(async () => {
    try {
      const response = await mediaService.fetchLastWatched();
      if (response?.data) {
        setLastWatchedEpisode(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Error fetching last watched:', err);
    }
    return null;
  }, []);

  // Abrir reproductor VLC y actualizar registro
  const openVlc = useCallback(async (title: string, aliasRoute: string | number) => {
    try {
      await mediaService.openVlc(title, aliasRoute);

      // Limpiar cualquier temporizador pendiente antes de crear uno nuevo
      if (vlcTimerRef.current) clearTimeout(vlcTimerRef.current);

      vlcTimerRef.current = setTimeout(() => {
        fetchLastWatched();
      }, 500);
    } catch (err) {
      console.error('Error opening VLC:', err);
    }
  }, [fetchLastWatched]);

  // Alternar estado de visto (con actualización optimista + rollback en error)
  const handleToggleWatched = useCallback(async (media: MediaItem, watched: boolean) => {
    if (!media.folder || !media.title) return;

    // 1. Actualización optimista instantánea en UI
    setMedias(prev =>
      prev.map(item => (item.title === media.title ? { ...item, watched } : item))
    );

    try {
      await mediaService.markedAsWatched(media.folder, media.title, watched);
      await fetchLastWatched();
    } catch (err) {
      console.error('Error toggling watched status, revirtiendo estado:', err);

      // 2. Rollback en caso de falla
      setMedias(prev =>
        prev.map(item => (item.title === media.title ? { ...item, watched: !watched } : item))
      );
    }
  }, [setMedias, fetchLastWatched]);

  // Limpieza al desmontar el hook
  useEffect(() => {
    return () => {
      if (vlcTimerRef.current) clearTimeout(vlcTimerRef.current);
    };
  }, []);

  return { 
    currentSerie, 
    setCurrentSeries, 
    lastWatchedEpisode, 
    fetchLastWatched, 
    openVlc, 
    handleToggleWatched 
  };
};