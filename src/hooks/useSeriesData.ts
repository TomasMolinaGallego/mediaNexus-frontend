import { useState, useCallback } from 'react';
import { mediaService } from '../services/media.service.ts';
import { ExternalSerieInfo } from '../interfaces/ExternalSerieInfo.ts';
import { MediaItem } from '../interfaces/MediaItem.ts';

// 1. Movido fuera del hook para evitar que la referencia cambie en cada render
const mapperExternalSerieDtoToInternal = (externalSerie: any): ExternalSerieInfo => {
  return {
    id: externalSerie.id,
    title: externalSerie.title,
    status: externalSerie.status,
    overview: externalSerie.overview,
    nextAiring: externalSerie.nextAiring,
    previousAiring: externalSerie.previousAiring,
    airTime: externalSerie.airTime,
    // Uso de encadenamiento opcional para evitar crash si images o seasons son null
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
  const [seriesList, setSeriesList] = useState([]);
  const [medias, setMedias] = useState([]); 
  const [statusStats, setStatusStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [externalSeries, setExternalSeries] = useState(null);
  const [error, setError] = useState(null);

  const fetchAllSeries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Ejecución en paralelo
      const [externalResult, internalData] = await Promise.all([
        mediaService.getAllSeriesExternal(),
        mediaService.fetchAll()
      ]);

      // 2. Procesamos las series externas con seguridad
      let externalItems: MediaItem[] = [];
      if (externalResult.success && externalResult.data) {
        setExternalSeries(externalResult.data);

        externalItems = externalResult.data.map((element: any) => {
          const serie = mapperExternalSerieDtoToInternal(element);
          return {
            id: serie.id,
            title: serie.title,
            image: serie.images.find(img => img.coverType === 'poster')?.remoteUrl || '/placeholder.png',
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

      // 3. Filtrado de duplicados por título
      const externalTitles = new Set(externalItems.map(s => s.title));
      const uniqueInternal = (internalData || []).filter((media: MediaItem) => !externalTitles.has(media.title));

      // 4. Lista unificada
      const fullList = [...externalItems, ...uniqueInternal];
      setSeriesList(fullList);

      // 5. Cálculo de estadísticas sobre la lista UNIFICADA 
      // (Para que los números coincidan con lo que ve el usuario)
      const stats = fullList.reduce((acc, m) => {
        acc.total++;
        const statusNormalizado = m.status?.toLowerCase() || '';
        
        if (statusNormalizado.includes('completado')) acc.completed++;
        else if (statusNormalizado.includes('viendo')) acc.watching++;
        else if (statusNormalizado.includes('pendiente')) acc.planToWatch++;
        else if (statusNormalizado.includes('abandonado')) acc.dropped++;
        
        return acc;
      }, { total: 0, completed: 0, watching: 0, planToWatch: 0, dropped: 0 });

      setStatusStats(stats);

    } catch (error) {
      console.error('Error general en fetchAllSeries:', error);
      setError('Error al conectar con los servicios de Alexandria.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías porque el mapper está fuera

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