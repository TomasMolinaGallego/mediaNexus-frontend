import React, { memo, useMemo, KeyboardEvent, MouseEvent } from 'react';
import styles from './MediaCard.module.css';
import MediaUtils from '../../../utils/MediaUtils';

const PLACEHOLDER = '/placeholder.png';

export interface MediaItem {
  id?: number | string;
  title: string;
  cleanTitle?: string;
  airDate?: string;
  isExternal?: boolean;
  isDownloaded?: boolean;
  image?: string;
  folder?: string;
  watched?: boolean;
  episodeNumber?: number | string;
  seasonNumber?: number;
  status?: string;
  disk?: string | number;
}

interface MediaCardProps {
  media: MediaItem;
  handleMediaClick: (path: string, media: MediaItem) => void;
  isInsideMedia?: boolean;
  onToggleWatched?: (media: MediaItem, nextState: boolean) => void;
}

const MediaCard: React.FC<MediaCardProps> = memo(({
  media,
  handleMediaClick,
  isInsideMedia = false,
  onToggleWatched
}) => {
  const { seriesName } = useMemo(() => {
    const targetTitle = media?.cleanTitle || media?.title || '';
    return MediaUtils?.parseMediaTitle ? MediaUtils.parseMediaTitle(targetTitle) : { seriesName: targetTitle };
  }, [media?.cleanTitle, media?.title]);

  const isFuture = useMemo(() => {
    if (!media?.airDate) return false;
    const airDate = new Date(media.airDate);
    if (isNaN(airDate.getTime())) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return airDate > today;
  }, [media?.airDate]);

  const isAvailable = isInsideMedia 
    ? (!media?.isExternal || Boolean(media?.isDownloaded)) && !isFuture 
    : true;

  const imageSrc = useMemo(() => {
    if (!media?.image || media.image === 'placeholder.jpeg') return PLACEHOLDER;
    if (media.isExternal) return media.image;
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL ?? '';
    return `${backendUrl}${media.image}`;
  }, [media?.image, media?.isExternal]);

  const handleCardClick = () => {
    if (isFuture) return;

    const rawTitle = media?.title || '';
    const rawFolder = media?.folder || '';
    const path = isInsideMedia
      ? `${rawFolder}/${rawTitle}`.replace(/\/+/g, '/')
      : rawTitle;

    handleMediaClick(path, media);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isFuture && onToggleWatched) {
      onToggleWatched(media, !media.watched);
    }
  };

  const formattedAirDate = useMemo(() => {
    if (!media?.airDate) return '';
    const parsed = new Date(media.airDate);
    if (isNaN(parsed.getTime())) return media.airDate;
    
    return parsed.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [media?.airDate]);

  const displayTitle = seriesName || media?.cleanTitle || media?.title || 'Sin Título';

  return (
    <article
      className={`
        ${styles.card} 
        ${!isAvailable ? styles.notReady : ''} 
        ${isFuture ? styles.futureCard : ''}
      `}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={isFuture ? -1 : 0}
      role="button"
      aria-disabled={isFuture}
    >
      <div className={styles.imageArea}>
        <img
          src={imageSrc}
          alt={displayTitle}
          className={`${styles.image} ${media?.watched ? styles.watchedImage : ''}`}
          loading="lazy"
          onError={(e) => { 
            e.currentTarget.src = PLACEHOLDER; 
          }}
        />

        {/* Overlay para contenido no emitido */}
        {isFuture && (
          <div className={styles.futureOverlay}>
            <span className={styles.lockIcon} role="img" aria-label="Bloqueado">📅</span>
            <span className={styles.futureText}>Próximamente</span>
            {media?.airDate && <span className={styles.dateText}>{media.airDate}</span>}
          </div>
        )}

        {/* Overlay para contenido no descargado */}
        {!isAvailable && !isFuture && (
          <div className={styles.downloadOverlay}>
            <span className={styles.downloadIcon} role="img" aria-label="Nube">☁️</span>
            <span className={styles.downloadText}>No descargado</span>
          </div>
        )}

        {media?.episodeNumber !== undefined && (
          <div className={styles.episodeBadge}>
            <span className={styles.epPrefix}>EP</span>
            <span className={styles.epNumber}>{media.episodeNumber}</span>
          </div>
        )}

        {media?.watched && (
          <div className={styles.watchedIndicator} aria-label="Visto">✔</div>
        )}
      </div>

      <div className={styles.contentArea}>
        <div className={styles.titleContainer}>
          <h3 className={styles.seriesName} title={displayTitle}>
            {displayTitle}
          </h3>
          {Boolean(media?.seasonNumber && media.seasonNumber > 0) && (
            <span className={styles.seasonInfo}>Temporada {media.seasonNumber}</span>
          )}
        </div>

        {formattedAirDate && (
          <div className={styles.airDateRow}>
            <span className={styles.airDateLabel}>Estreno:</span>
            <span className={styles.airDateValue}>{formattedAirDate}</span>
          </div>
        )}

        <div className={styles.footer}>
          {!isInsideMedia ? (
            <span className={styles.statusTag}>{media?.status || 'Biblioteca'}</span>
          ) : (
            <button
              type="button"
              className={`${styles.watchBtn} ${media?.watched ? styles.active : ''}`}
              onClick={handleToggle}
              disabled={isFuture}
            >
              {media?.watched ? 'Visto' : 'Marcar visto'}
            </button>
          )}

          {media?.disk && (
            <div className={styles.diskBadge}>DISCO {media.disk}</div>
          )}
        </div>
      </div>
    </article>
  );
});

MediaCard.displayName = 'MediaCard';
export default MediaCard;