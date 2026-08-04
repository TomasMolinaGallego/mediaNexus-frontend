import { useState, useMemo } from 'react';
import { MediaItem } from '../interfaces/MediaItem.ts';
import { useDebounce } from './UseDebounce.ts';

export const useMediaFilters = (seriesList: MediaItem[], medias: MediaItem[], isInsideMedia: boolean) => {
  // 1. Empezar en 'Todos' suele ser mejor UX, pero 'Viendo' es aceptable si es tu vista principal.
  const [filteredStatus, setFilteredStatus] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 100);

  const displayData = useMemo(() => {
    // 2. Determinamos qué fuente de datos filtrar
    const sourceData = isInsideMedia ? medias : seriesList;
    const term = debouncedSearch.toLowerCase().trim();
    

    return (sourceData || []).filter((media: MediaItem) => {
      const hasMatchingStatus = 
        isInsideMedia || // Omitimos el filtro de status si son episodios
        filteredStatus === 'Todos' || 
        media.status?.toLowerCase() === filteredStatus.toLowerCase();

      const matchesSearchTerm = 
        media.title?.toLowerCase().includes(term) || 
        media.folder?.toLowerCase().includes(term);

      return hasMatchingStatus && matchesSearchTerm;
    });
  }, [isInsideMedia, medias, seriesList, filteredStatus, debouncedSearch]);

  return { 
    displayData, 
    filteredStatus, 
    setFilteredStatus, 
    searchTerm, 
    setSearchTerm 
  };
};