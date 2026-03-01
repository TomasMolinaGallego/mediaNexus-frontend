class MediaUtils {
        /**
         * Utility to clean media titles and extract episode metadata.
         * Separating this logic from the component body ensures better testability.
         * * @param {string} rawTitle - The original filename or series title.
         * @returns {Object} { seriesName: string, episodeNum: string | null }
         */
        static parseMediaTitle = (rawTitle) => {
          if (!rawTitle) return { seriesName: 'Unknown Title', episodeNum: null };
        
          // Clean extensions, tags [brackets], and metadata (parentheses)
          let clean = rawTitle
            .replace(/\[.*?\]/g, '')       
            .replace(/\(.*?\)/g, '')       
            .replace(/\.[^/.]+$/, "")      
            .replace(/_/g, ' ')            
            .replace(/\s\s+/g, ' ')        
            .trim();
        
          // Regex to capture numeric episodes at the end of the string
          const epRegex = /(?:.*[\s\-\_eE]|capitulo\s|cap\.\s|ep\.\s)(\d+)$/i;
          const match = clean.match(epRegex);
        
          if (match) {
            const episodeNum = match[1];
            const seriesName = clean.substring(0, clean.lastIndexOf(episodeNum))
                                    .replace(/[\s\-\_]+$/, '') 
                                    .trim();
            return { seriesName, episodeNum };
          }
        
          return { seriesName: clean, episodeNum: null };
        };
}

export default MediaUtils;