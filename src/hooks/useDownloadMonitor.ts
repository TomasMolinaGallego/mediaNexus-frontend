import { useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../utils/Notifications.ts';
/**
 * Background monitor for qBittorrent downloads and Sonarr import synchronization.
 */
export const useDownloadMonitor = (currentSerie, medias, refreshMedia) => {
  const prevTorrentsRef = useRef(new Map());

  const verifySonarrImport = useCallback(async (seriesId: number, initialCount: number) => {
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    const interval = setInterval(async () => {
      try {
        attempts++;
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/sonarr/series/${seriesId}`);
        const currentCount = data.filter((ep: any) => ep.hasFile).length;

        if (currentCount > initialCount) {
          clearInterval(interval);
          notify.success("File imported and ready! 🎬");
          refreshMedia(); // Trigger silent refresh
        }

        if (attempts >= MAX_ATTEMPTS) clearInterval(interval);
      } catch (e) {
        clearInterval(interval);
      }
    }, 10000);
  }, [refreshMedia]);

  const checkDownloads = useCallback(async () => {
    try {
      return;
      const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/qbit/status/downloads`);
      const currentMap = new Map(data.map(t => [t.hash, t]));

      data.forEach(async torrent => {
        const prev = prevTorrentsRef.current.get(torrent.hash);

        // Notify new downloads
        if (!prev) notify.info(`Download started: ${torrent.name} 📥`);

        // Trigger import check when download finishes
        else if (prev.status === 'downloading' && torrent.status !== 'downloading') {
          if (currentSerie) {
            const downloadedCount = medias.filter(m => m.isDownloaded).length;
            notify.loading(`Importing ${torrent.name}...`, `import-${torrent.hash}`);
            await verifySonarrImport(currentSerie.id, downloadedCount);
          }
        }
      });

      prevTorrentsRef.current = currentMap;
    } catch (e) {
      console.error("qBit polling error:", e);
    }
  }, [currentSerie, medias, verifySonarrImport]);

  useEffect(() => {
    const interval = setInterval(checkDownloads, 5000);
    return () => clearInterval(interval);
  }, [checkDownloads]);

  return { checkDownloads };
};