import { useState, useCallback } from 'react';
import { mediaService } from '../services/media.service.ts';
import { ExternalSerieInfo } from '../interfaces/ExternalSerieInfo.ts';
import { MediaItem } from '../interfaces/MediaItem.ts';

interface StatusStats {
  total: number;
  completed: number;
  watching: number;
  planToWatch: number;
  dropped: number;
}

// Mapper de DTO externo a modelo interno (manteniendo pureza fuera del hook)
const mapperExternalSerieDtoToInternal = (externalSerie: any): ExternalSerieInfo => {
  return {
    id: externalSerie.id,
    title: externalSerie.title,
    status: externalSerie.status,
    overview: externalSerie.overview,
    nextAiring: externalSerie.nextAiring,
    previousAiring: externalSerie.previousAiring,
    airTime: externalSerie.airTime,
    images: (externalSerie.images || []).map((img: any) => ({
      coverType: img.coverType,
      remoteUrl: img.remoteUrl
    })),
    seasons: (externalSerie.seasons || []).map((season: any) => ({
      seasonNumber: season.seasonNumber,
      totalEpisodeCount: season.statistics?.totalEpisodeCount || 0,
      nextAiring: season.statistics?.nextAiring,
      previousAiring: season.statistics?.previousAiring
    })),
    year: externalSerie.year,
    path: externalSerie.path,
    runtime: externalSerie.runtime,
    tvdbId: externalSerie.tvdbId,
    tmdbId: externalSerie.tmdbId,
    firstAired: externalSerie.firstAired,
    lastAired: externalSerie.lastAired,
    seriesType: externalSerie.seriesType,
    imdbId: externalSerie.imdbId,
    rootFolderPath: externalSerie.rootFolderPath,
    genres: externalSerie.genres || [],
    added: externalSerie.added
  };
};

export const useSeriesData = () => {
  const [seriesList, setSeriesList] = useState<MediaItem[]>([]);
  const [medias, setMedias] = useState<MediaItem[]>([]); 
  const [statusStats, setStatusStats] = useState<StatusStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [externalSeries, setExternalSeries] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSeries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Usamos Promise.allSettled para tolerar fallos en una de las dos fuentes
      const [externalRes, internalRes] = await Promise.allSettled([
        mediaService.getAllSeriesExternal(),
        mediaService.fetchAll()
      ]);

      const externalResult = externalRes.status === 'fulfilled' ? externalRes.value : null;
      const internalData: MediaItem[] = internalRes.status === 'fulfilled' ? (internalRes.value || []) : [];

      let externalItems: MediaItem[] = [];

      // 1. Procesar series externas
      if (externalResult?.success && Array.isArray(externalResult.data)) {
        setExternalSeries(externalResult.data);

        externalItems = externalResult.data.map((element: any) => {
          const serie = mapperExternalSerieDtoToInternal(element);
          const posterUrl = serie.images.find(img => img.coverType === 'poster')?.remoteUrl;

          return {
            id: serie.id,
            title: serie.title,
            image: posterUrl || '/placeholder.png',
            folder: serie.path,
            aliasRoute: 'noRoute',
            status: serie.status,
            watched: false,
            isExternal: true,
            externalId: serie.tvdbId,
            isAdded: true
          };
        });
      }

      // 2. Normalización de títulos para filtrado ultra-seguro contra duplicados
      const externalTitlesSet = new Set(
        externalItems.map(s => s.title.trim().toLowerCase())
      );

      const uniqueInternal = internalData.filter(
        (media) => media?.title && !externalTitlesSet.has(media.title.trim().toLowerCase())
      );

      // 3. Lista unificada
      const fullList = [...externalItems, ...uniqueInternal];
      setSeriesList(fullList);

      // 4. Cálculo optimizado de estadísticas sobre la lista unificada
      const stats = fullList.reduce<StatusStats>(
        (acc, m) => {
          acc.total++;
          const status = m.status?.toLowerCase().trim() || '';

          if (status.includes('completado')) acc.completed++;
          else if (status.includes('viendo')) acc.watching++;
          else if (status.includes('pendiente')) acc.planToWatch++;
          else if (status.includes('abandonado')) acc.dropped++;

          return acc;
        },
        { total: 0, completed: 0, watching: 0, planToWatch: 0, dropped: 0 }
      );

      setStatusStats(stats);

      // Notificar si alguna fuente falló parcialmente
      if (externalRes.status === 'rejected' || internalRes.status === 'rejected') {
        setError('Algunos servicios de Alexandria no estuvieron disponibles.');
      }

    } catch (err) {
      console.error('Error general en fetchAllSeries:', err);
      setError('Error al conectar con los servicios de Alexandria.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    seriesList,
    setSeriesList,
    medias,
    setMedias,
    statusStats,
    isLoading,
    setIsLoading,
    fetchAllSeries,
    externalSeries,
    error
  };
};