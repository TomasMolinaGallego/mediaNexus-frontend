import { useState, useCallback } from 'react';
import { mediaService } from '../services/media.service.ts';
import { SeriesInfo } from '../interfaces/SeriesInfo.ts';

export const useSeriesData = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [medias, setMedias] = useState([]); // Episodios de una serie
  const [statusStats, setStatusStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllSeries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mediaService.fetchAll();
      setSeriesList(data);
      
      const stats = {
        total: data.length,
        completed: data.filter((m: SeriesInfo) => m.status === 'Completado').length,
        watching: data.filter((m: SeriesInfo) => m.status === 'Viendo').length,
        planToWatch: data.filter((m: SeriesInfo) => m.status === 'Pendiente').length,
        dropped: data.filter((m: SeriesInfo) => m.status === 'Abandonado').length,
      };
      setStatusStats(stats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    seriesList, setSeriesList, 
    medias, setMedias, 
    statusStats, 
    isLoading, setIsLoading, 
    fetchAllSeries 
  };
};