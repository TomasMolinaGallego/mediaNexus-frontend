import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { MediaMapper } from '../utils/MediaMapper.ts';
import { notify } from '../utils/Notifications.ts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const DEBOUNCE_DELAY_MS = 500;
const TOAST_SEARCH_ID = 'search-toast';

/**
 * Hook to manage external series searching with debouncing and request cancellation.
 */
export const useExternalSearch = () => {
  const [listExternalSearch, setListExternalSearch] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Limpiar el estado de búsqueda manualmente
  const clearExternalSearch = useCallback(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setListExternalSearch([]);
    setIsSearching(false);
  }, []);

  const handleExternalSearch = useCallback((title: string) => {
    // 1. Limpiar el temporizador anterior
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // 2. Cancelar la petición HTTP previa en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cleanTitle = title?.trim();

    // Resetear si el texto no cumple la longitud mínima
    if (!cleanTitle || cleanTitle.length < 3) {
      setListExternalSearch([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      abortControllerRef.current = new AbortController();

      try {
        const query = encodeURIComponent(cleanTitle);
        notify.loading(`Buscando en la nube: ${cleanTitle}...`, TOAST_SEARCH_ID);

        const { data } = await axios.get(`${API_BASE}/api/sonarr/search?query=${query}`, {
          signal: abortControllerRef.current.signal,
        });

        if (Array.isArray(data)) {
          // Filtrado y mapeo seguro
          const mappedData = data
            .filter((item) => item && (item.poster || item.remotePoster))
            .map(MediaMapper.fromSearch);

          setListExternalSearch(mappedData);
          
          if (mappedData.length === 0) {
            notify.info('No se encontraron resultados', TOAST_SEARCH_ID);
          } else {
            notify.success('Resultados obtenidos', TOAST_SEARCH_ID);
          }
        }
      } catch (error: any) {
        // Ignorar de forma segura peticiones abortadas por debouncing o desmontaje
        const isCanceled =
          axios.isCancel(error) ||
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError';

        if (isCanceled) {
          console.log('Búsqueda cancelada (petición obsoleta)');
        } else {
          console.error('External Search Error:', error);
          notify.error('Error al buscar en la nube', TOAST_SEARCH_ID);
        }
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_DELAY_MS);
  }, []);

  // Limpieza integral de timers y peticiones en vuelo al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    listExternalSearch,
    handleExternalSearch,
    clearExternalSearch,
    isSearching,
  };
};