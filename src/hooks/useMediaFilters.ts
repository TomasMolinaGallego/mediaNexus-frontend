import { useState, useMemo } from 'react';
import { MediaItem } from '../interfaces/MediaItem.ts';
import { useDebounce } from './UseDebounce.ts';

export const useMediaFilters = (seriesList: MediaItem[], medias: MediaItem[], isInsideMedia: boolean) => {
  const [filteredStatus, setFilteredStatus] = useState('Viendo');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 100);

  const displayData = useMemo(() => {
    if (isInsideMedia) return medias;

    const term = debouncedSearch.toLowerCase().trim();
    return seriesList.filter((media: MediaItem) => {
      const hasMatchingStatus = filteredStatus === 'Todos' || media.status === filteredStatus;
      const matchesSearchTerm = 
        media.title.toLowerCase().includes(term) || 
        media.folder?.toLowerCase().includes(term);
      return hasMatchingStatus && matchesSearchTerm;
    });
  }, [isInsideMedia, medias, seriesList, filteredStatus, debouncedSearch]);

  return { displayData, filteredStatus, setFilteredStatus, searchTerm, setSearchTerm };
};