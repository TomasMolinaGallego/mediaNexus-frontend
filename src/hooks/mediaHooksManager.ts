import { useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { mediaService } from '../services/media.service.ts';
import { MediaMapper } from '../utils/MediaMapper.ts';
import { notify } from '../utils/Notifications.ts';

// Imports de tus sub-hooks
import { useSeriesData } from './useSeriesData.ts';
import { useMediaFilters } from './useMediaFilters.ts';
import { useMediaActions } from './useMediaActions.ts';
import { useExternalSearch } from './useExternalSearch.ts';
import { useDownloadMonitor } from './useDownloadMonitor.ts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const useMediaHooksManager = () => {
  const { seriesList, medias, setMedias, statusStats, isLoading, setIsLoading, fetchAllSeries } = useSeriesData();
  const { currentSerie, setCurrentSeries, lastWatchedEpisode, fetchLastWatched, openVlc, handleToggleWatched } = useMediaActions(setMedias);
  
  const { listExternalSearch, handleExternalSearch } = useExternalSearch();
  const isInsideMedia = !!currentSerie;
  const { displayData, filteredStatus, setFilteredStatus, setSearchTerm } = useMediaFilters(seriesList, medias, isInsideMedia);

  // Referencia para evitar colisiones de carga
  const loadingAbortController = useRef(null);

  const getMedia = useCallback(async (title: string, aliasRoute: string, folder: string, id?: string, isSilent = false) => {
    // Cancelar carga previa si existe
    if (loadingAbortController.current) loadingAbortController.current.abort();
    loadingAbortController.current = new AbortController();

    if (!isSilent) {
      setMedias([]);
      setIsLoading(true);
    }
    
    setCurrentSeries({ title, aliasRoute, id, folder });

    try {
      if (id) {
        // Carga paralela con manejo de errores individual
        const [localEpisodes, sonarrResponse] = await Promise.allSettled([
          mediaService.loadEpisodes(title, "discoC"),
          axios.get(`${API_BASE}/api/sonarr/series/${id}`, { signal: loadingAbortController.current.signal })
        ]);

        const localData = localEpisodes.status === 'fulfilled' ? localEpisodes.value : [];
        const sonarrData = sonarrResponse.status === 'fulfilled' ? sonarrResponse.value.data : [];

        // Mergeo ultra-seguro
        const merged = sonarrData.map((ext: any) => {
          const mapped = MediaMapper.toInternal(ext, folder);
          const match = localData.find(l => 
            l.episodeNumber === mapped.episodeNumber && l.seasonNumber === mapped.seasonNumber
          );
          
          return match 
            ? { ...match, cleanTitle: mapped.title, isDownloaded: true, airDate: mapped.airDate }
            : { ...mapped, isDownloaded: false };
        });

        // Ordenar por temporada y luego por episodio
        const sorted = merged.sort((a, b) => 
          (a.seasonNumber - b.seasonNumber) || (a.episodeNumber - b.episodeNumber)
        );

        setMedias(sorted);
      } else {
        const episodes = await mediaService.loadEpisodes(title, aliasRoute);
        setMedias(episodes.map(ep => ({ ...ep, isDownloaded: true })));
      }
      
      if (isSilent) notify.info("Lista actualizada");
    } catch (error: any) {
      if (error.name !== 'CanceledError') {
        notify.error("Error al cargar episodios");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setMedias, setIsLoading, setCurrentSeries]);

  const handleMediaClick = useCallback(async (title: string, media: any) => {
    if (!media.isAdded && media.externalId) {
      const tid = notify.loading("Añadiendo serie...");
      try {
        await axios.post(`${API_BASE}/api/sonarr/add-series`, { tvdbId: media.externalId, title });
        notify.success("Serie añadida", tid );
        await fetchAllSeries();
      } catch {
        notify.error("Error al añadir", tid );
      }
    } else {
      if (isInsideMedia) {
        await openVlc(title, media.aliasRoute);
      } else {
        // Normalización de carpetas para evitar problemas de slash/backslash
        const realTitle = media.folder?.replace(/\\/g, '/').split('/').pop() || title;
        await getMedia(realTitle, media.aliasRoute, media.folder, media.id);
      }
    }
  }, [isInsideMedia, openVlc, getMedia, fetchAllSeries]);

  // Monitor de descargas
  const { checkDownloads } = useDownloadMonitor(currentSerie, medias, () => {
    if(currentSerie) getMedia(currentSerie.title, currentSerie.aliasRoute, currentSerie.folder, currentSerie.id, true);
  });

  // Efecto inicial de carga
  useEffect(() => {
    fetchAllSeries();
    fetchLastWatched();
  }, []); // Solo al montar el componente principal

  return {
    displayData,
    isInsideMedia,
    isLoading,
    filteredStatus,
    setFilteredStatus,
    setSearchTerm,
    handleMediaClick,
    handleBack: () => { setCurrentSeries(null); }, // Eliminado fetchAllSeries innecesario aquí
    handleToggleWatched,
    fetchLastWatched,
    currentMedia: currentSerie,
    statusStats,
    handleExternalSearch,
    listExternalSearch,
    downloadEpisode: async (episodeId: string, title: string) => {
        const toastId = notify.loading(`Proceso de descarga iniciado para: ${title}...`);
        try {
          await axios.post(`${API_BASE}/api/sonarr/download-episode`, { episodeIds: [episodeId] });
          notify.success('Descarga iniciada', toastId );
        } catch {
          notify.error('Error al iniciar descarga', toastId );
        }
    },
    checkDownloads,
    lastWatchedEpisode
  };
};