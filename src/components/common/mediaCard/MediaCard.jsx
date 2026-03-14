import React, { memo, useMemo } from 'react';
import styles from './MediaCard.module.css';
import MediaUtils from '../../../utils/MediaUtils.jsx';

const PLACEHOLDER = '/placeholder.png'; // Asegúrate de tener esta imagen en public/

const MediaCard = memo(({ media, handleMediaClick, isInsideMedia, onToggleWatched }) => {
  
  // Parseo del título (Memoizado para rendimiento)
  const { seriesName, episodeNum } = useMemo(() => 
    MediaUtils.parseMediaTitle(media.title), [media.title]
  );

  const handleCardClick = () => {
    // Limpiamos la construcción de la ruta para evitar dobles barras
    const path = isInsideMedia 
      ? `${media.folder}/${media.title}`.replace(/\/+/g, '/') 
      : media.title;
    
    handleMediaClick(path, media.aliasRoute, true); 
  };

  // Soporte para accesibilidad (Click con teclado)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleWatched?.(media, !media.watched);
  };

  return (
    <article 
      className={styles.card} 
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0} // Permite navegar con el tabulador
      role="button"
      aria-label={`Ver ${seriesName || media.title}`}
    >
      <div className={styles.imageArea}>
        <img 
          src={media.image ? `${process.env.REACT_APP_BACKEND_URL}${media.image}` : PLACEHOLDER} 
          alt={seriesName || media.title} 
          className={`${styles.image} ${media.watched ? styles.watchedImage : ''}`}
          loading="lazy"
          onError={(e) => { 
            e.currentTarget.onerror = null; // Evita bucle infinito si el placeholder también falla
            e.currentTarget.src = PLACEHOLDER; 
          }}
        />

        {/* Badge de Episodio */}
        {episodeNum && (
          <div className={styles.episodeBadge}>
            <span className={styles.epPrefix}>EP</span>
            <span className={styles.epNumber}>{episodeNum}</span>
          </div>
        )}

        {/* Check de Visto (UI superior) */}
        {media.watched && (
          <div className={styles.watchedIndicator} aria-hidden="true">
            ✔
          </div>
        )}
      </div>
      
      <div className={styles.contentArea}>
        <div className={styles.titleContainer}>
          <h3 className={styles.seriesName} title={media.title}>
            {seriesName || `Episodio ${episodeNum}`}
          </h3>
        </div>
        
        <div className={styles.footer}>
          {!isInsideMedia ? (
            <span className={styles.statusTag}>{media.status || 'Biblioteca'}</span>
          ) : (
            <button 
              className={`${styles.watchBtn} ${media.watched ? styles.active : ''}`}
              onClick={handleToggle}
              aria-pressed={media.watched}
              tabIndex={-1}
            >
              {media.watched ? 'Visto' : 'Marcar visto'}
            </button>
          )}
          
          <div className={styles.diskBadge} title={`Ubicación: Disco ${media.disk}`}>
            <span>DISCO {media.disk || '?'}</span>
          </div>
        </div>
      </div>
    </article>
  );
});

MediaCard.displayName = 'MediaCard';
export default MediaCard;