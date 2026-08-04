import React, { memo, useMemo, useCallback } from 'react';
import styles from './ReplaySection.module.css';
import { FiPlayCircle, FiActivity, FiClock } from 'react-icons/fi';
import MediaUtils from '../../../utils/MediaUtils.jsx';

const ReplaySection = memo(({ onClickLastWatched, lastWatched }) => {
  // Cálculo de datos derivados del último elemento visto
  const mediaData = useMemo(() => {
    if (!lastWatched) return null;

    const { seriesName, episodeNum: epNext } = MediaUtils.parseMediaTitle(lastWatched.nextEpisodeToWatch);
    const { episodeNum: epLast } = MediaUtils.parseMediaTitle(lastWatched.lastEpisodeWatched);

    return {
      name: seriesName || 'Serie',
      lastEpNum: epLast || '',
      nextEpNum: epNext || '',
      fullLastEp: lastWatched.lastEpisodeWatched,
      fullNextEp: lastWatched.nextEpisodeToWatch,
      image: lastWatched.imageSeries ? lastWatched.imageSeries : '/placeholder.png'
    };
  }, [lastWatched]);

  // Manejo de la navegación con scroll suave hacia arriba
  const handleNavigation = useCallback((targetEpisode) => {
    if (targetEpisode && typeof onClickLastWatched === 'function') {
      onClickLastWatched(targetEpisode, lastWatched?.aliasRoute, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onClickLastWatched, lastWatched?.aliasRoute]);

  // Estado cuando no hay nada visto recientemente
  if (!lastWatched || !mediaData) {
    return (
      <div className={styles.noLastWatched}>
        <FiActivity size={20} />
        <p>Nada visto recientemente</p>
      </div>
    );
  }

  // Formateo seguro para etiquetas de botones
  const formattedLastEp = mediaData.lastEpNum 
    ? mediaData.lastEpNum.replace('Episodio ', 'E') 
    : '';
    
  const formattedNextEp = mediaData.nextEpNum 
    ? mediaData.nextEpNum.replace('Episodio ', 'E') 
    : '';

  return (
    <div className={styles.replayContainer}>
      <p className={styles.groupTitle}>Continuar viendo</p>

      <article 
        className={styles.lastWatchedCard} 
        onClick={() => handleNavigation(mediaData.fullLastEp)}
        title={`Reproducir ${mediaData.name}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleNavigation(mediaData.fullLastEp)}
      >
        <div className={styles.imageWrapper}>
          <img src={mediaData.image} alt={mediaData.name} loading="lazy" />
          <div className={styles.playOverlay}>
            <FiPlayCircle />
          </div>
        </div>
        
        <div className={styles.lastWatchedInfo}>
          <h4 className={styles.seriesName}>{mediaData.name}</h4>
          <span className={styles.episodeLabel}>Visto: {mediaData.lastEpNum}</span>
          <div className={styles.miniProgress} aria-hidden="true">
            <div className={styles.progressBar} style={{ width: '70%' }} />
          </div>
        </div>
      </article>

      <div className={styles.actionButtons}>
        <button 
          type="button"
          className={styles.primaryAction} 
          onClick={() => handleNavigation(mediaData.fullLastEp)}
        >
          <FiClock size={14} /> Repetir {formattedLastEp}
        </button>

        <button 
          type="button"
          className={styles.secondaryAction} 
          onClick={() => handleNavigation(mediaData.fullNextEp)}
        >
          <FiPlayCircle size={14} /> 
          {!mediaData.nextEpNum ? "Finalizado" : `Siguiente: ${formattedNextEp}`}
        </button>
      </div>
    </div>
  );
});

ReplaySection.displayName = 'ReplaySection';

export default ReplaySection;