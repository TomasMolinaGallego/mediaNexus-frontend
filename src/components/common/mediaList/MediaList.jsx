import React, { memo, useEffect } from 'react';
import MediaCard from '../mediaCard/MediaCard';
import styles from './MediaList.module.css';
import MediaSkeleton from './mediaSkeleton.jsx'

const MediaList = memo(({ medias, handleMediaClick, isInsideMedia, onToggleWatched, isLoading }) => {
  
  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.mediaGrid} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaSkeleton key={index} />
          ))}
        </div>
        <span className={styles.srOnly} aria-live="polite">Cargando contenido...</span>
      </div>
    );
  }

  // Estado vacío
  if (!medias || medias.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <p>No se encontraron resultados en Alexandria.</p>
      </div>
    );
  }

  return (
    <section className={styles.listContainer}>
      {/* Texto invisible para lectores de pantalla que indica el éxito de la búsqueda */}
      <span className={styles.srOnly} aria-live="polite">
        Se muestran {medias.length} resultados
      </span>

      <ul className={styles.mediaGrid} aria-label="Cuadrícula de medios">
        {medias.map((media) => (
          <li key={`${media.title}-${media.aliasRoute}`} className={styles.gridItem}>
            <MediaCard
              media={media}
              handleMediaClick={handleMediaClick}
              isInsideMedia={isInsideMedia}
              onToggleWatched={onToggleWatched} 
            />
          </li>
        ))}
      </ul>
    </section>
  );
});

MediaList.displayName = 'MediaList';
export default MediaList;