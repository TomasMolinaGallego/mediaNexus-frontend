class MediaUtils {
  /**
   * Utility to clean media titles and extract episode metadata.
   * Optimized for: "Series - S01E02 - Title", "Series - 08", "Series [Tag] (1080p) 01"
   * * @param {string} rawTitle - The original filename or series title.
   * @returns {Object} { seriesName: string, episodeNum: string | null, season: string | null }
   */
  static parseMediaTitle = (rawTitle) => {
    if (!rawTitle) return { seriesName: 'Unknown Title', episodeNum: null, season: null };

    // 1. Pre-cleaning: Remove extensions and common metadata tags
    let clean = rawTitle
      .replace(/\.[^/.]+$/, "") // Remove extension (.mkv, .mp4)
      .replace(/\[.*?\]/g, '')  // Remove [Fansub Tags]
      .replace(/\(.*?\)/g, '')  // Remove (Resolution/Codec info)
      .replace(/_/g, ' ')       // Replace underscores with spaces
      .trim();

    /**
     * 2. Multipattern Regex Logic
     * Pattern A: S01E02 or 1x02 (Standard)
     * Pattern B: Episode number surrounded by dashes " - 08 - " (Common in Anime)
     * Pattern C: Number at the end "Series 01"
     */
    const patterns = [
      /[Ss](\d+)[Ee](\d+)/i,                 // S01E02
      /(\d+)x(\d+)/,                         // 1x02
      /(?:capitulo|cap\.|ep\.|ep|episode)\s*(\d+)/i, // ep 01, capitulo 20
      /\s-\s(\d+)\s-\s/                      // " - 08 - " (Specific for long titles)
    ];

    let episodeNum = null;
    let seasonNum = null;

    for (let regex of patterns) {
      const match = clean.match(regex);
      if (match) {
        // If it's Pattern A or B (Season + Episode)
        if (match.length === 3) {
          seasonNum = match[1];
          episodeNum = match[2];
        } else {
          // Single episode number
          episodeNum = match[1];
        }
        
        // Clean the series name by removing the matched part and everything after it
        // This ensures we get "Code Geass" instead of "Code Geass S01E02 Title"
        const partToRemove = match[0];
        const index = clean.indexOf(partToRemove);
        let seriesName = clean.substring(0, index).replace(/[\s\-\_]+$/, '').trim();
        
        // If seriesName becomes empty (e.g. file starts with S01E01), 
        // we try to keep the original clean string as fallback
        if (!seriesName) seriesName = clean;

        return { 
          seriesName, 
          episodeNum: episodeNum.padStart(2, '0'), // Normalize to "01", "02"...
          season: seasonNum ? seasonNum.padStart(2, '0') : null 
        };
      }
    }

    // 3. Fallback: If no pattern matches, try the original end-of-string logic
    const lastNumRegex = /(?:.*[\s\-\_])(\d+)$/;
    const lastMatch = clean.match(lastNumRegex);
    
    if (lastMatch) {
      const ep = lastMatch[1];
      const name = clean.substring(0, clean.lastIndexOf(ep)).replace(/[\s\-\_]+$/, '').trim();
      return { seriesName: name, episodeNum: ep.padStart(2, '0'), season: null };
    }

    return { seriesName: clean, episodeNum: null, season: null };
  };
}

export default MediaUtils;