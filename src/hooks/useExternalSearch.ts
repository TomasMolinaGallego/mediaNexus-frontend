import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { MediaMapper } from '../utils/MediaMapper.ts';
import { toast } from 'sonner';
import { notify } from '../utils/Notifications.ts';

/**
 * Hook to manage external series searching with debouncing and request cancellation.
 */
export const useExternalSearch = () => {
  const [listExternalSearch, setListExternalSearch] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // Útil para mostrar un spinner

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleExternalSearch = useCallback((title: string) => {
    // 1. Limpiar el temporizador anterior
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // 2. Cancelar la petición HTTP que esté en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cleanTitle = title?.trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      setListExternalSearch([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);

      // Crear un nuevo controlador para esta petición
      abortControllerRef.current = new AbortController();

      try {
        const query = encodeURIComponent(cleanTitle);
        // Usamos la referencia del backend desde variables de entorno
        const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        notify.loading(`Buscando en la nube: ${cleanTitle}, puede tardar unos segundos...`, 'search-toast');

        const { data } = await axios.get(`${baseUrl}/api/sonarr/search?query=${query}`, {
          signal: abortControllerRef.current.signal
        });

        notify.success('Resultados obtenidos', 'search-toast');

        if (Array.isArray(data)) {
          // Filtrado y mapeo seguro
          const mappedData = data
            .filter(i => i && (i.poster || i.remotePoster))
            .map(MediaMapper.fromSearch);
          setListExternalSearch(mappedData);
        }
      } catch (error: any) {
        if (axios.isCancel(error)) {
          console.log('Búsqueda cancelada (petición obsoleta)');
        } else {
          console.error('External Search Error:', error);
          notify.error('Error al buscar en la nube', 'search-toast');
        }
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return { listExternalSearch, handleExternalSearch, isSearching };
};