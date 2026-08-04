import { useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { mediaService } from '../services/media.service.ts';
import { MediaMapper } from '../utils/MediaMapper.ts';
import { notify } from '../utils/Notifications.ts';

// Sub-hooks
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

  // Referencia para cancelar peticiones HTTP en vuelo
  const loadingAbortController = useRef<AbortController | null>(null);

  // Carga de episodios por serie
  const getMedia = useCallback(async (
    title: string, 
    aliasRoute: string, 
    folder: string, 
    id?: string, 
    isSilent = false
  ) => {
    // Cancelar la petición HTTP anterior si sigue pendiente
    if (loadingAbortController.current) {
      loadingAbortController.current.abort();
    }
    loadingAbortController.current = new AbortController();

    if (!isSilent) {
      setMedias([]);
      setIsLoading(true);
    }
    
    setCurrentSeries({ title, aliasRoute, id, folder });

    try {
      if (id) {
        // Carga paralela de episodios locales y datos de Sonarr
        const [localEpisodes, sonarrResponse] = await Promise.allSettled([
          mediaService.loadEpisodes(title, "discoC"),
          axios.get(`${API_BASE}/api/sonarr/series/${id}`, { signal: loadingAbortController.current.signal })
        ]);

        const localData = localEpisodes.status === 'fulfilled' ? localEpisodes.value : [];
        const sonarrData = sonarrResponse.status === 'fulfilled' ? sonarrResponse.value.data : [];

        // OPTIMIZACIÓN O(N): Creamos una Hash Map indexada por temporada y episodio
        const localMap = new Map<string, any>();
        localData.forEach((ep: any) => {
          localMap.set(`${ep.seasonNumber}-${ep.episodeNumber}`, ep);
        });

        // Mergeo eficiente en tiempo constante O(1) por cada episodio
        const merged = sonarrData.map((ext: any) => {
          const mapped = MediaMapper.toInternal(ext, folder);
          const key = `${mapped.seasonNumber}-${mapped.episodeNumber}`;
          const match = localMap.get(key);
          
          return match 
            ? { ...match, cleanTitle: mapped.title, isDownloaded: true, airDate: mapped.airDate }
            : { ...mapped, isDownloaded: false };
        });

        // Ordenar por Temporada ASC -> Episodio ASC
        const sorted = merged.sort((a, b) => 
          a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
        );

        setMedias(sorted);
      } else {
        const episodes = await mediaService.loadEpisodes(title, aliasRoute);
        setMedias(episodes.map(ep => ({ ...ep, isDownloaded: true })));
      }
      
      if (isSilent) notify.info("Lista actualizada");
    } catch (error: any) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        notify.error("Error al cargar episodios");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setMedias, setIsLoading, setCurrentSeries]);

  // Manejador de clics en tarjetas de media
  const handleMediaClick = useCallback(async (title: string, media: any) => {
    if (!media.isAdded && media.externalId) {
      const tid = notify.loading("Añadiendo serie...");
      try {
        await axios.post(`${API_BASE}/api/sonarr/add-series`, { tvdbId: media.externalId, title });
        notify.success("Serie añadida", tid);
        await fetchAllSeries();
      } catch {
        notify.error("Error al añadir", tid);
      }
    } else {
      if (isInsideMedia) {
        await openVlc(title, media.aliasRoute);
      } else {
        // Normalización de ruta/directorio
        const realTitle = media.folder?.replace(/\\/g, '/').split('/').pop() || title;
        await getMedia(realTitle, media.aliasRoute, media.folder, media.id);
      }
    }
  }, [isInsideMedia, openVlc, getMedia, fetchAllSeries]);

  // Retornar a la vista principal
  const handleBack = useCallback(() => {
    setCurrentSeries(null);
  }, [setCurrentSeries]);

  // Descarga manual de un episodio
  const downloadEpisode = useCallback(async (episodeId: string, title: string) => {
    const toastId = notify.loading(`Proceso de descarga iniciado para: ${title}...`);
    try {
      await axios.post(`${API_BASE}/api/sonarr/download-episode`, { episodeIds: [episodeId] });
      notify.success('Descarga iniciada', toastId);
    } catch {
      notify.error('Error al iniciar descarga', toastId);
    }
  }, []);

  // Mantener referencia estable de getMedia para el hook de monitoreo
  const getMediaRef = useRef(getMedia);
  useEffect(() => {
    getMediaRef.current = getMedia;
  }, [getMedia]);

  const handleDownloadUpdate = useCallback(() => {
    if (currentSerie) {
      getMediaRef.current(currentSerie.title, currentSerie.aliasRoute, currentSerie.folder, currentSerie.id, true);
    }
  }, [currentSerie]);

  // Monitor de descargas activas
  const { checkDownloads } = useDownloadMonitor(currentSerie, medias, handleDownloadUpdate);

  // Carga inicial
  useEffect(() => {
    fetchAllSeries();
    fetchLastWatched();

    return () => {
      // Abortar llamadas inconclusas al desmontar el hook
      if (loadingAbortController.current) {
        loadingAbortController.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    displayData,
    isInsideMedia,
    isLoading,
    filteredStatus,
    setFilteredStatus,
    setSearchTerm,
    handleMediaClick,
    handleBack,
    handleToggleWatched,
    fetchLastWatched,
    currentMedia: currentSerie,
    statusStats,
    handleExternalSearch,
    listExternalSearch,
    downloadEpisode,
    checkDownloads,
    lastWatchedEpisode
  };
};