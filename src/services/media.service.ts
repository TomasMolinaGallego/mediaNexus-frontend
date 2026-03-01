import { httpClient } from "./api.client.ts";
import { mediaMapper } from "./media.mapper.ts";
import { MediaItem } from "../interfaces/MediaItem";
import { ApiResponse } from "../interfaces/ApiResponse";

export const mediaService = {
  
  fetchAll: async () => {
    try {
      const data = await httpClient.get<any>('/media/files');
      console.log(mediaMapper.toSeriesList(data))
      return mediaMapper.toSeriesList(data);
    } catch (error) {
      console.error('[MediaService] Error al cargar series:', error);
      return [];
    }
  },

  loadEpisodes: async (title: string, aliasRoute: number): Promise<MediaItem[]> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `/media/files/${encodeURIComponent(title)}/${aliasRoute}`;
      const rawData = await httpClient.get<any>(url, { signal: controller.signal });
      clearTimeout(id);
      
      const rawEpisodes = Array.isArray(rawData) ? rawData : (rawData?.episodes ?? []);
      return rawEpisodes.map(mediaMapper.toMediaItem);
    } catch (error) {
      console.error(`[MediaService] Error cargando episodios de ${title}:`, error);
      return [];
    }
  },

  openVlc: async (title: string, aliasRoute: number): Promise<ApiResponse<null>> => {
    try {
      await httpClient.get(`/media/open-vlc/${title}/${aliasRoute}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  markedAsWatched: async (title: string, episode: string, watched: boolean) => {
    const payload = { series: title, episode, watched };
    try {
      await httpClient.post('/watched', payload);
      return { success: true, data: payload };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  fetchLastWatched: async () => {
    try {
      const data = await httpClient.get<any>('/media/last-watched');
      return {
        success: true,
        data: {
          ...data,
          imageSeries: data.imageSeries || '/placeholder.png'
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  saveFoldersOfConfig: async (folders: any[]) => {
    try {
      await httpClient.post('/config/folders', folders);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};