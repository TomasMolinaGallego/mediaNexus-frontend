import React, { memo } from 'react';
import MediaCard from '../mediaCard/MediaCard';
import styles from './MediaList.module.css';

/**
 * MediaList Component
 * Renderiza una rejilla fluida que se adapta al ancho de pantalla
 * sin necesidad de definir columnas fijas para cada dispositivo.
 */
const MediaList = memo(({ medias, handleClick, isInsideMedia, onToggleWatched, isLoading }) => {
  
  if (isLoading) {
    return (
      <div className={styles.loadingWrapper} role="status" aria-live="polite">
        <div className={styles.loader}>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
        </div>
        <p className={styles.loadingText}>Sincronizando biblioteca...</p>
      </div>
    );
  }

  if (!medias || medias.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontraron resultados en Alexandria.</p>
      </div>
    );
  }

  return (
    <section className={styles.mediaList} aria-label="Media Grid">
      {medias.map((media) => (
        <MediaCard
          key={`${media.title}-${media.disk}`}
          media={media}
          onClick={handleClick}
          isInsideMedia={isInsideMedia}
          onToggleWatched={onToggleWatched} 
        />
      ))}
    </section>
  );
});

MediaList.displayName = 'MediaList';

export default MediaList;