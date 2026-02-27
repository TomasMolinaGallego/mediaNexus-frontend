import { useState, useEffect, useCallback, useMemo } from 'react';
import { mediaService, SeriesInfo } from '../services/api.ts';
import { MediaItem } from '../interfaces/MediaItem.ts';
import { useDebounce } from './UseDebounce.ts';

export const useMediaHooksManager = () => {
    const [medias, setMedias] = useState<MediaItem[]>([]);
    const [seriesList, setSeriesList] = useState<MediaItem[]>([]);
    const [currentSerie, setCurrentSeries] = useState(null);
    const [statusStats, setStatusStats] = useState(null);
    const [filteredStatus, setFilteredStatus] = useState('Viendo');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastWatchedEpisode, setLastWatchedEpisode] = useState<string | null>(null);

    const isInsideMedia = !!currentSerie;

    const fetchAllSeries = useCallback(async () => {
        setIsLoading(true);
        const data = await mediaService.fetchAll();
        await getLastWatchedEpisode();
        setSeriesList(data);
        const nbCompleted = data.filter((media: SeriesInfo) => media.status === 'Completado').length;
        const nbWatching = data.filter((media: SeriesInfo) => media.status === 'Viendo').length;
        const nbPlanToWatch = data.filter((media: SeriesInfo) => media.status === 'Pendiente').length;
        const nbDropped = data.filter((media: SeriesInfo) => media.status === 'Abandonado').length;
        setStatusStats({ total: data.length, completed: nbCompleted, watching: nbWatching, planToWatch: nbPlanToWatch, dropped: nbDropped });
        setCurrentSeries(null);
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchAllSeries(); }, [fetchAllSeries]);

    const debouncedSearch = useDebounce(searchTerm, 100);


    const handleMediaClick = async (title: string, disk: number, isFromCard: boolean) => {
        console.log(`Getting series or opening VLC for ${title} on disk ${disk}`);
        if (isInsideMedia) {
            openVlc(title, disk, isFromCard);
        }
        else {
            // If we're not inside a media, we want to load the episodes for the selected series
            getMedia(title, disk);
        }
    }

    const openVlc = async (title: string, disk: number, isFromCard: boolean) => {
        // If we're already inside a media, we want to open VLC instead of loading episodes
        await mediaService.openVlc(title, disk);

        if (isFromCard) {
            // mark the episode as watched in the UI immediately for better UX, the backend will be updated when the user toggles the watched status
            title = title.split('/').pop() || title; // Extract episode name if title is in the format "folder/episode"
            setMedias((prev: MediaItem[]) =>
                prev.map((a) => a.title === title ? { ...a, watched: true } : a)
            );
        }
        const lastWatched = await getLastWatchedEpisode(); // Update the last watched episode in the state immediately
        console.log("lastWatched:", lastWatched);
        setLastWatchedEpisode(lastWatched);

    }

    const getLastWatchedEpisode = async () => {
        const lastWatched = (await mediaService.fetchLastWatched()).data;
        console.log("Fetched last watched episode:", lastWatched);
        setLastWatchedEpisode(lastWatched);
        return lastWatched;
    };

    const getMedia = async (title: string, disk: number): Promise<void> => {
        setMedias([]);
        setIsLoading(true);

        setCurrentSeries({ title, disk });

        try {
            const episodes = await mediaService.loadEpisodes(title, disk);

            if (!episodes || episodes.length === 0) {
                throw new Error(`No se encontraron episodios para: ${title}`);
            }

            const nextToWatch = episodes.find(ep => !ep.watched)?.title;

            const lastWatched = [...episodes].reverse().find(ep => ep.watched)?.title;

            const watchedCount = episodes.filter(ep => ep.watched).length;
            const totalEpisodes = episodes.length;

            const updatedSeries = {
                title,
                disk,
                folder: episodes[0]?.folder,
                nextToWatch,
                lastWatched,
                watchedCount,
                totalEpisodes
            };

            setCurrentSeries(updatedSeries);
            setMedias(episodes);

            console.log(`[GetMedia] Sincronización exitosa: ${title} (${watchedCount}/${totalEpisodes})`);

        } catch (error) {
            console.error(`[GetMedia] Fallo crítico al cargar serie:`, error);

            setCurrentSeries(null);

            await fetchAllSeries();
        } finally {
            setIsLoading(false);
        }
    };

    const displayData = useMemo(() => {
        if (isInsideMedia) return medias;

        const searchTerm = debouncedSearch.toLowerCase().trim();

        return seriesList.filter((media: MediaItem) => {
            const hasMatchingStatus =
                filteredStatus === 'Todos' ||
                media.status === filteredStatus;

            const matchesSearchTerm =
                media.title.toLowerCase().includes(searchTerm) ||
                media.folder?.toLowerCase().includes(searchTerm);

            return hasMatchingStatus && matchesSearchTerm;
        });
    }, [isInsideMedia, medias, seriesList, filteredStatus, debouncedSearch]);

    const handleToggleWatched = useCallback(async (media: MediaItem, watched: boolean) => {
        await mediaService.markedAsWatched(media.folder!, media.title, watched);
        setMedias((prev: MediaItem[]) =>
            prev.map((a) => a.title === media.title ? { ...a, watched } : a)
        );
    }, []); // No depende de estados externos porque usa la versión funcional de setMedias

    return {
        displayData,
        isInsideMedia,
        isLoading,
        filteredStatus,
        setFilteredStatus,
        setSearchTerm,
        handleMediaClick,
        currentMedia: currentSerie,
        handleBack: fetchAllSeries,
        handleToggleWatched,
        getLastWatchedEpisode,
        lastWatchedEpisode,
        openVlc,
        statusStats
    };
};