import { useEffect, useCallback } from 'react';
import { mediaService } from '../services/media.service.ts';
import { useSeriesData } from './useSeriesData.ts';
import { useMediaFilters } from './useMediaFilters.ts';
import { useMediaActions } from './useMediaActions.ts';

export const useMediaHooksManager = () => {
  const { seriesList, medias, setMedias, statusStats, isLoading, setIsLoading, fetchAllSeries } = useSeriesData();
  const { currentSerie, setCurrentSeries, lastWatchedEpisode, fetchLastWatched, openVlc, handleToggleWatched } = useMediaActions(setMedias);
  
  const isInsideMedia = !!currentSerie;
  
  const { displayData, filteredStatus, setFilteredStatus, setSearchTerm } = useMediaFilters(seriesList, medias, isInsideMedia);

  useEffect(() => { 
    fetchAllSeries(); 
    fetchLastWatched();
  }, [fetchAllSeries, fetchLastWatched]);

  const getMedia = useCallback(async (title: string, aliasRoute: number) => {
    setMedias([]);
    setIsLoading(true);
    setCurrentSeries({ title, aliasRoute });

    try {
      const episodes = await mediaService.loadEpisodes(title, aliasRoute);
      if (!episodes || episodes.length === 0) throw new Error("No episodes found");

      const lastWatched = [...episodes].reverse().find(ep => ep.watched)?.title;
      const updatedSeries = {
        title,
        aliasRoute: episodes[0]?.aliasRoute,
        folder: episodes[0]?.folder,
        nextToWatch: episodes.find(ep => !ep.watched)?.title,
        lastWatched,
        watchedCount: episodes.filter(ep => ep.watched).length,
        totalEpisodes: episodes.length
      };

      setCurrentSeries(updatedSeries);
      setMedias(episodes);
    } catch (error) {
      setCurrentSeries(null);
      await fetchAllSeries();
    } finally {
      setIsLoading(false);
    }
  }, [setMedias, setIsLoading, setCurrentSeries, fetchAllSeries]);

  const handleMediaClick = useCallback(async (title: string, aliasRoute: number, isFromCard: boolean) => {
    if (isInsideMedia) {
      await openVlc(title, aliasRoute, isFromCard);
    } else {
      await getMedia(title, aliasRoute);
    }
  }, [isInsideMedia, openVlc, getMedia]);

  const handleBack = useCallback(() => {
    setCurrentSeries(null);
    fetchAllSeries();
  }, [fetchAllSeries, setCurrentSeries]);

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
    currentMedia: currentSerie,
    lastWatchedEpisode,
    statusStats,
    openVlc,
    saveConfig: mediaService.saveFoldersOfConfig
  };
};