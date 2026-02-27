import { EpisodeDTO } from "../interfaces/EpisodeDTO";
import { MediaInfo } from "../interfaces/MediaInfo";
import { MediaItem } from "../interfaces/MediaItem";
import { SeriesInfo } from "../interfaces/SeriesInfo";

const API_BASE_URL = 'http://localhost:3001/api';



interface ApiResponse2 {
    [title: string]: MediaInfo[];
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface WatchedStatusUpdate {
    series: string;
    episode: string;
    watched: boolean;
}

interface LastWatchedResponse {
    lastEpisodeWatched: string;
    nextEpisodeToWatch: string;
    imageSeries: string;
    disk: string;
}



export const mediaService = {

    mapToMediaItem: (item: Partial<EpisodeDTO>): MediaItem => ({
        title: item.fullName ?? 'Episodio desconocido',
        image: item.frameUrl ?? '/placeholder.png', // Imagen por defecto
        folder: item.folder ?? '',
        disk: String(item.disk) ?? 0,
        watched: Boolean(item.watched)
    }),

    fetchAll: async (): Promise<SeriesInfo[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/media/files`);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data: ApiResponse2 = await response.json();

            return Object.entries(data).map(([title, info]) => {
                const firstItem = info?.[0] || {};

                return {
                    title,
                    disk: firstItem.disk ?? 'Unknown',
                    image: firstItem.frameUrl ?? '',
                    status: firstItem.status ?? 'Pending',
                };
            });
        } catch (error) {
            console.error('Failed to fetch series from Alexandria API:', error);
            return [];
        }
    }

    ,
    loadEpisodes: async (title: string, disk: number): Promise<MediaItem[]> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8s

        try {
            const url = `${API_BASE_URL}/media/files/${encodeURIComponent(title)}/${disk}`;
            const res = await fetch(url, { signal: controller.signal });

            if (!res.ok) {
                throw new Error(`Server responded ${res.status}: ${res.statusText}`);
            }

            const rawData = await res.json();
            clearTimeout(timeoutId);

            // Normalización de la estructura de datos
            const rawEpisodes: EpisodeDTO[] = Array.isArray(rawData)
                ? rawData
                : (rawData?.episodes ?? []);

            /**
             * OPTIMIZACIÓN DE MEMORIA:
             * Si la lista es enorme, usamos un bucle simple o map directo.
             * Aquí el Mapper asegura que el objeto final tenga la estructura limpia 
             * que espera tu frontend, independientemente de la API.
             */
            return rawEpisodes.map(mediaService.mapToMediaItem);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error('Fetch aborted: Timeout or manual cancel');
            } else {
                console.error(`[EpisodesService] Error for ${title}:`, error.message);
            }
            return []; // Siempre devolvemos un array para evitar errores de .map() en el componente
        }
    },

    openVlc: async (title: string, disk: number): Promise<ApiResponse<null>> => {
        try {
            const url = `${API_BASE_URL}/media/open-vlc/${title}/${disk}`;

            const response = await fetch(url, {
                method: 'GET', 
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with status ${response.status}`);
            }

            return { success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error starting VLC';
            console.error(`[MediaService.openVlc] Failure:`, { title, disk, error: errorMessage });
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },
    markedAsWatched: async (
        title: string, 
        episode: string, 
        watched: boolean
    ): Promise<ApiResponse<WatchedStatusUpdate>> => {
        
        const payload: WatchedStatusUpdate = {
            series: title,
            episode: episode,
            watched
        };

        try {
            const response = await fetch(`${API_BASE_URL}/watched`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorInfo = await response.json().catch(() => ({}));
                throw new Error(errorInfo.message || `Error del servidor: ${response.status}`);
            }

            return { 
                success: true, 
                data: payload 
            };

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Error de red';
            console.error(`[MediaService.toggleWatchedStatus] Falló la sincronización:`, { 
                ...payload, 
                error: msg 
            });

            return { 
                success: false, 
                error: msg 
            };
        }
    },

fetchLastWatched: async (): Promise<ApiResponse<LastWatchedResponse>> => {
        const endpoint = `${API_BASE_URL}/media/last-watched`;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { 
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache' // Evita datos obsoletos del navegador
                }
            });

            // 1. Validación de Infraestructura (Red/Protocolo)
            if (!response.ok) {
                throw new Error(`HTTP_ERROR_${response.status}`);
            }

            // 2. Validación de Contenido (Parsing)
            const data: LastWatchedResponse = await response.json();

            // 3. Normalización: Aseguramos que el dominio reciba una estructura predecible
            return {
                success: true,
                data: {
                    lastEpisodeWatched: data.lastEpisodeWatched,
                    nextEpisodeToWatch: data.nextEpisodeToWatch,
                    imageSeries: data.imageSeries || '/placeholder.png',
                    disk: data.disk || 'Unknown'
                }
            };

        } catch (error) {
            // 4. Gestión de Errores Silenciosa para la UI pero ruidosa para el Dev
            const errorMessage = error instanceof Error ? error.message : 'NETWORK_FAILURE';
            
            console.warn(`[MediaService.fetchLastWatched] Non-critical failure:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
                data: { 
                    lastEpisodeWatched: null,
                    nextEpisodeToWatch: null,
                    imageSeries: '/placeholder.png',
                    disk: 'Unknown'
                }
            };
        }
    }
};