import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import MediaCard from '../mediaCard/MediaCard';
import styles from './MediaList.module.css';
import MediaSkeleton from './mediaSkeleton.jsx';

const MediaList = memo(({ medias, handleMediaClick, isInsideMedia, onToggleWatched, isLoading }) => {
  const [openSeasons, setOpenSeasons] = useState({});

  // 1. Agrupación y llaves (Memorizadas)
  const seasons = useMemo(() => {
    if (!medias) return {};
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

  // 2. Inicialización inteligente: Abrir la primera temporada disponible al cargar
  useEffect(() => {
    if (isInsideMedia && seasonKeys.length > 0) {
      setOpenSeasons({ [seasonKeys[0]]: true });
    }
  }, [isInsideMedia, seasonKeys]);

  // 3. Handlers de expansión
  const toggleSeason = useCallback((seasonNum) => {
    setOpenSeasons(prev => ({ ...prev, [seasonNum]: !prev[seasonNum] }));
  }, []);

  const toggleAll = useCallback((expand) => {
    const newState = {};
    if (expand) {
      seasonKeys.forEach(key => newState[key] = true);
    }
    setOpenSeasons(newState);
  }, [seasonKeys]);

  // Determinar si todas están expandidas para el icono del botón global
  const allExpanded = useMemo(() => 
    seasonKeys.length > 0 && seasonKeys.every(key => openSeasons[key]),
    [seasonKeys, openSeasons]
  );

  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.mediaGrid}>
          {Array.from({ length: 12 }).map((_, index) => <MediaSkeleton key={index} />)}
        </div>
      </div>
    );
  }

  if (!medias || medias.length === 0) {
    return <div className={styles.emptyState}><p>No se encontraron resultados.</p></div>;
  }

  return (
    <section className={styles.listContainer}>
      {/* Botón Global de Control (Solo si estamos dentro de una serie con varias temporadas) */}
      {isInsideMedia && seasonKeys.length > 1 && (
        <div className={styles.globalControls}>
          <button 
            className={styles.controlBtn} 
            onClick={() => toggleAll(!allExpanded)}
            title={allExpanded ? "Colapsar todo" : "Expandir todo"}
          >
            {allExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
            <span>{allExpanded ? "Colapsar todo" : "Expandir todas las temporadas"}</span>
          </button>
        </div>
      )}

      {seasonKeys.map((seasonNum) => {
        const isOpen = openSeasons[seasonNum] || !isInsideMedia;
        const isOva = seasonNum === "0";
        const displayTitle = isInsideMedia 
          ? (isOva ? "OVAs / Especiales" : `Temporada ${seasonNum}`) 
          : "Listado de series";
        
        return (
          <div key={`season-${seasonNum}`} className={styles.seasonSection}>
            <header 
              className={`${styles.seasonHeader} ${isInsideMedia ? styles.clickable : ''}`} 
              onClick={() => isInsideMedia && toggleSeason(seasonNum)}
              role={isInsideMedia ? "button" : "presentation"}
              tabIndex={isInsideMedia ? 0 : -1}
              onKeyDown={(e) => isInsideMedia && (e.key === 'Enter' || e.key === ' ') && toggleSeason(seasonNum)}
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
            
            <div className={`${styles.collapsibleContent} ${isOpen ? styles.open : styles.closed}`}>
              <div className={styles.gridWrapper}>
                <ul className={styles.mediaGrid} aria-label={displayTitle}>
                  {seasons[seasonNum].map((media) => (
                    <li key={`${media.id || media.title}-${media.episodeNumber || 0}`} className={styles.gridItem}>
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

export default MediaList;