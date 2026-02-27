class MediaUtils {
        static parseMediaString = (rawPath) => {
            if (!rawPath) return { series: 'Desconocido', episode: '', chapter: '' };
            const parts = rawPath.split('/');
            const rawFolder = parts[0] || '';
            const rawFile = parts[parts.length - 1] || '';
            const seriesName = rawFolder.replace(/\[.*?\]|\(.*?\)/g, '').trim();
            let cleanFile = rawFile.replace(/\.[^/.]+$/, "").replace(/\[.*?\]/g, '').trim();
            const epRegex = /(?:(?:\s-\s)|(?:\sEpisode\s)|(?:\sE))(\d+)/i;
            const epMatch = cleanFile.match(epRegex);
            return {
                series: seriesName,
                episode: epMatch ? `Episodio ${epMatch[1]}` : "",
            };
        }
}

export default MediaUtils;