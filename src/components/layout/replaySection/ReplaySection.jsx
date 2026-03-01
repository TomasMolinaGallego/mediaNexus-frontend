import React, { useMemo } from 'react';
import styles from './ReplaySection.module.css';
import { FiPlayCircle, FiActivity, FiClock } from 'react-icons/fi';
import MediaUtils from '../../../utils/MediaUtils.jsx';

const ASSET_URL = 'http://localhost:3001'; // Ajusta según tu config

const ReplaySection = ({ onClickLastWatched, lastWatched }) => {
  
  // Calculamos todos los datos derivados en un solo paso
  const mediaData = useMemo(() => {
    if (!lastWatched) return null;

    const { seriesName, episodeNum: epNext } = MediaUtils.parseMediaTitle(lastWatched.nextEpisodeToWatch);
    const { episodeNum: epLast } = MediaUtils.parseMediaTitle(lastWatched.lastEpisodeWatched);

    return {
      name: seriesName,
      lastEpNum: epLast,
      nextEpNum: epNext,
      fullLastEp: lastWatched.lastEpisodeWatched,
      fullNextEp: lastWatched.nextEpisodeToWatch,
      image: lastWatched.imageSeries ? lastWatched.imageSeries : '/placeholder.png'
    };
  }, [lastWatched]);

  const handleNavigation = (targetEpisode) => {
    if (targetEpisode) {
      onClickLastWatched(targetEpisode, lastWatched.aliasRoute, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!lastWatched || !mediaData) {
    return (
      <div className={styles.noLastWatched}>
        <FiActivity size={20} />
        <p>Nada visto recientemente</p>
      </div>
    );
  }

  return (
    <div className={styles.replayContainer}>
      <p className={styles.groupTitle}>Continuar viendo</p>

      <article 
        className={styles.lastWatchedCard} 
        onClick={() => handleNavigation(mediaData.fullNextEp)}
        title={`Reproducir ${mediaData.name}`}
      >
        <div className={styles.imageWrapper}>
           <img src={mediaData.image} alt={mediaData.name} />
           <div className={styles.playOverlay}><FiPlayCircle /></div>
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
          className={styles.primaryAction} 
          onClick={() => handleNavigation(mediaData.fullLastEp)}
        >
          <FiClock size={14} /> Repetir {mediaData.lastEpNum.replace('Episodio ', 'E')}
        </button>

        <button 
          className={styles.secondaryAction} 
          onClick={() => handleNavigation(mediaData.fullNextEp)}
        >
          <FiPlayCircle size={14} /> 
          { !mediaData.nextEpNum ? "Finalizado" : `Siguiente: ${mediaData.nextEpNum.replace('Episodio ', 'E')}`}
        </button>
      </div>
    </div>
  );
};

export default ReplaySection;