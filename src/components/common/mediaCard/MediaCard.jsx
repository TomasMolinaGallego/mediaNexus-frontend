import React, { memo, useMemo } from 'react';
import styles from './MediaCard.module.css';
import MediaUtils from '../../../utils/MediaUtils.jsx';

const PLACEHOLDER = '/placeholder.png';

const MediaCard = memo(({ media, handleMediaClick, isInsideMedia, onToggleWatched }) => {

  // 1. Parseo de títulos y nombres
  const { seriesName, episodeNum } = useMemo(() =>
    MediaUtils.parseMediaTitle(media.cleanTitle || media.title),
    [media.cleanTitle, media.title]
  );

  // 2. Lógica de fecha futura (Bloqueo)
  const isFuture = useMemo(() => {
    if (!media.airDate) return false;
    const airDate = new Date(media.airDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return airDate > today;
  }, [media.airDate]);

  // 3. Disponibilidad lógica
  const isAvailable = isInsideMedia ? (!media.isExternal || media.isDownloaded) && !isFuture : true;

  // 4. Construcción de URL de imagen
  const imageSrc = useMemo(() => {
    if (!media.image || media.image === 'placeholder.jpeg') return PLACEHOLDER;
    return media.isExternal
      ? media.image
      : `${process.env.REACT_APP_BACKEND_URL}${media.image}`;
  }, [media.image, media.isExternal]);

  const handleCardClick = () => {
    if (isFuture) return; // Bloqueo total si no se ha emitido

    const path = isInsideMedia
      ? `${media.folder}/${media.title}`.replace(/\/+/g, '/')
      : media.title;

    handleMediaClick(path, media);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isFuture) onToggleWatched?.(media, !media.watched);
  };

  return (
    <article
      className={`
        ${styles.card} 
        ${!isAvailable ? styles.notReady : ''} 
        ${isFuture ? styles.futureCard : ''}
      `}
      onClick={handleCardClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      tabIndex={isFuture ? -1 : 0}
      role="button"
      aria-disabled={isFuture}
    >
      <div className={styles.imageArea}>
        <img
          src={imageSrc}
          alt={seriesName || media.title}
          className={`${styles.image} ${media.watched ? styles.watchedImage : ''}`}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />

        {/* Overlay para fechas futuras */}
        {isFuture && (
          <div className={styles.futureOverlay}>
            <span className={styles.lockIcon}>📅</span>
            <span className={styles.futureText}>Próximamente</span>
            <span className={styles.dateText}>{media.airDate}</span>
          </div>
        )}

        {/* Overlay para contenido no descargado (pero ya emitido) */}
        {!isAvailable && !isFuture && (
          <div className={styles.downloadOverlay}>
            <span className={styles.downloadIcon}>☁️</span>
            <span className={styles.downloadText}>No descargado</span>
          </div>
        )}

        {media.episodeNumber && (
          <div className={styles.episodeBadge}>
            <span className={styles.epPrefix}>EP</span>
            <span className={styles.epNumber}>{media.episodeNumber}</span>
          </div>
        )}

        {media.watched && (
          <div className={styles.watchedIndicator}>✔</div>
        )}
      </div>

      <div className={styles.contentArea}>
        <div className={styles.titleContainer}>
          <h3 className={styles.seriesName} title={media.cleanTitle || media.title}>
            {seriesName || media.cleanTitle || media.title}
          </h3>
          {media.seasonNumber > 0 && (
            <span className={styles.seasonInfo}>Temporada {media.seasonNumber}</span>
          )}
        </div>

        {/* NUEVA SECCIÓN PARA EL AIRDATE */}
        {media.airDate && (
          <div className={styles.airDateRow}>
            <span className={styles.airDateLabel}>Estreno:</span>
            <span className={styles.airDateValue}>
              {new Date(media.airDate).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        )}

        <div className={styles.footer}>
          {!isInsideMedia ? (
            <span className={styles.statusTag}>{media.status || 'Biblioteca'}</span>
          ) : (
            <button
              className={`${styles.watchBtn} ${media.watched ? styles.active : ''}`}
              onClick={handleToggle}
              disabled={isFuture}
            >
              {media.watched ? 'Visto' : 'Marcar visto'}
            </button>
          )}

          {media.disk && (
            <div className={styles.diskBadge}>DISCO {media.disk}</div>
          )}
        </div>
      </div>
    </article>
  );
});

MediaCard.displayName = 'MediaCard';
export default MediaCard;