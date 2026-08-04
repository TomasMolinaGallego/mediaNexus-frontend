import React, { memo, useMemo, useState, useCallback } from 'react';
import { FiChevronDown, FiChevronRight, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import MediaCard from '../mediaCard/MediaCard';
import MediaSkeleton from './mediaSkeleton.jsx';
import styles from './MediaList.module.css';

const MediaList = memo(({ 
  medias = [], 
  handleMediaClick, 
  isInsideMedia = false, 
  onToggleWatched, 
  isLoading = false 
}) => {
  const seasons = useMemo(() => {
    if (!Array.isArray(medias) || medias.length === 0) return {};
    return medias.reduce((acc, media) => {
      const s = Number(media.seasonNumber) || 0;
      if (!acc[s]) acc[s] = [];
      acc[s].push(media);
      return acc;
    }, {});
  }, [medias]);

  const seasonKeys = useMemo(() => {
    return Object.keys(seasons).sort((a, b) => {
      if (a === "0") return 1;
      if (b === "0") return -1;
      return Number(a) - Number(b);
    });
  }, [seasons]);

  const [openSeasons, setOpenSeasons] = useState(() => {
    if (isInsideMedia && seasonKeys.length > 0) {
      return { [seasonKeys[0]]: true };
    }
    return {};
  });

  const toggleSeason = useCallback((seasonNum) => {
    setOpenSeasons(prev => ({ ...prev, [seasonNum]: !prev[seasonNum] }));
  }, []);

  const toggleAll = useCallback((expand) => {
    const newState = {};
    if (expand) {
      seasonKeys.forEach(key => { newState[key] = true; });
    }
    setOpenSeasons(newState);
  }, [seasonKeys]);

  const allExpanded = useMemo(() => 
    seasonKeys.length > 0 && seasonKeys.every(key => openSeasons[key]),
    [seasonKeys, openSeasons]
  );

  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.mediaGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <MediaSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (!medias || medias.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontraron resultados.</p>
      </div>
    );
  }

  return (
    <section className={styles.listContainer}>
      {/* Botón Global de Expandir/Colapsar */}
      {isInsideMedia && seasonKeys.length > 1 && (
        <div className={styles.globalControls}>
          <button 
            type="button"
            className={styles.controlBtn} 
            onClick={() => toggleAll(!allExpanded)}
            title={allExpanded ? "Colapsar todo" : "Expandir todo"}
          >
            {allExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
            <span>{allExpanded ? "Colapsar todo" : "Expandir todas las temporadas"}</span>
          </button>
        </div>
      )}

      {/* Listado de Temporadas */}
      {seasonKeys.map((seasonNum) => {
        const isOpen = !isInsideMedia || Boolean(openSeasons[seasonNum]);
        const isOva = seasonNum === "0";
        const displayTitle = isInsideMedia 
          ? (isOva ? "OVAs / Especiales" : `Temporada ${seasonNum}`) 
          : "Listado de series";
        const contentId = `season-content-${seasonNum}`;

        return (
          <div key={`season-${seasonNum}`} className={styles.seasonSection}>
            <header 
              className={`${styles.seasonHeader} ${isInsideMedia ? styles.clickable : ''}`} 
              onClick={() => isInsideMedia && toggleSeason(seasonNum)}
              role={isInsideMedia ? "button" : undefined}
              tabIndex={isInsideMedia ? 0 : undefined}
              aria-expanded={isInsideMedia ? isOpen : undefined}
              aria-controls={isInsideMedia ? contentId : undefined}
              onKeyDown={(e) => {
                if (isInsideMedia && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggleSeason(seasonNum);
                }
              }}
            >
              <h2 className={`${styles.seasonTitle} ${isOva ? styles.ovaTitle : ''}`}>
                {isInsideMedia && (
                  <span className={styles.iconWrapper}>
                    {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                )}
                {displayTitle}
                <span className={styles.episodeCount}>({seasons[seasonNum].length} ep)</span>
              </h2>
            </header>
            
            <div 
              id={contentId}
              className={`${styles.collapsibleContent} ${isOpen ? styles.open : styles.closed}`}
            >
              <div className={styles.gridWrapper}>
                <ul className={styles.mediaGrid} aria-label={displayTitle}>
                  {seasons[seasonNum].map((media, index) => (
                    <li 
                      key={media.id || `${media.title}-${index}`} 
                      className={styles.gridItem}
                    >
                      <MediaCard
                        media={media}
                        handleMediaClick={handleMediaClick}
                        isInsideMedia={isInsideMedia}
                        onToggleWatched={onToggleWatched} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
});

MediaList.displayName = 'MediaList';
export default MediaList;