import React, { memo, useMemo } from 'react';
import styles from './MediaCard.module.css';

/**
 * Configuration constant for asset hosting.
 * In a production environment, this should be moved to an .env file.
 */
const ASSET_URL = 'http://localhost:3001';

/**
 * Utility to clean media titles and extract episode metadata.
 * Separating this logic from the component body ensures better testability.
 * * @param {string} rawTitle - The original filename or series title.
 * @returns {Object} { seriesName: string, episodeNum: string | null }
 */
const parseMediaTitle = (rawTitle) => {
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

/**
 * MediaCard Component
 * Represents a single series or episode in the library grid.
 * * @param {Object} props
 * @param {Object} props.media - The media data object (title, image, disk, etc.)
 * @param {Function} props.onClick - Handler for card selection (Navigate or Play)
 * @param {boolean} props.isInsideMedia - UI Context: True if browsing episodes of a series
 * @param {Function} props.onToggleWatched - Action to change the watched status
 */
const MediaCard = memo(({ media, onClick, isInsideMedia, onToggleWatched }) => {
  
  // Memoize parsing logic to prevent heavy regex execution on every re-render
  const { seriesName, episodeNum } = useMemo(() => 
    parseMediaTitle(media.title), [media.title]
  );

  /**
   * Handles navigation/playback logic based on the current view context.
   */
  const handleCardClick = () => {
    // Determine the full path based on whether we are at root or inside a folder
    const path = isInsideMedia ? `${media.folder}/${media.title}` : media.title;
    console.log("disk en MediaCard:", media);
    onClick(path, media.disk, true); 
  };

  /**
   * Prevents event bubbling to the card click when clicking the status button.
   */
  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleWatched?.(media, !media.watched);
  };

  return (
    <article className={styles.card} onClick={handleCardClick}>
      <div className={styles.imageArea}>
        <img 
          src={`${ASSET_URL}${media.image}`} 
          alt={seriesName} 
          className={`${styles.image} ${media.watched ? styles.watchedImage : ''}`}
          loading="lazy"
          // Fallback image handling
          onError={(e) => { e.target.src = 'https://via.placeholder.com/350x200?text=No+Thumbnail'; }}
        />

        {/* Dynamic Badges */}
        {episodeNum && (
          <div className={styles.episodeBadge}>
            <span className={styles.epPrefix}>EP</span>
            <span className={styles.epNumber}>{episodeNum}</span>
          </div>
        )}

        {media.watched && (
          <div className={styles.watchedIndicator} aria-label="Watched">
            ✔
          </div>
        )}
      </div>
      
      <div className={styles.contentArea}>
        <div className={styles.titleContainer}>
          <h3 className={styles.seriesName} title={media.title}>
            {seriesName || `Episode ${episodeNum}`}
          </h3>
        </div>
        
        <div className={styles.footer}>
          {!isInsideMedia ? (
            <span className={styles.statusTag}>{media.status || 'Library'}</span>
          ) : (
            <button 
              className={`${styles.watchBtn} ${media.watched ? styles.active : ''}`}
              onClick={handleToggle}
            >
              {media.watched ? 'Watched' : 'Mark seen'}
            </button>
          )}
          
          <div className={styles.diskBadge}>
            <span>DISK {media.disk}</span>
          </div>
        </div>
      </div>
    </article>
  );
});

MediaCard.displayName = 'MediaCard';
export default MediaCard;