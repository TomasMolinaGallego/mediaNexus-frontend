import React, { useEffect, useState } from 'react';
import styles from './NextEpisodeOverlay.module.css';

export const NextEpisodeOverlay = ({
  nextEpisode,
  onPlayNext,
  onCancel,
  countdownSeconds = 10
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onPlayNext(nextEpisode);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, nextEpisode, onPlayNext]);

  if (!nextEpisode) return null;

  return (
    <div className={styles.overlayContainer} onClick={(e) => e.stopPropagation()}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>Siguiente episodio</span>
          <span className={styles.timer}>{timeLeft}s</span>
        </div>

        <div className={styles.content}>
          {nextEpisode.image && (
            <img
              src={nextEpisode.image}
              alt={nextEpisode.title || 'Siguiente episodio'}
              className={styles.thumbnail}
            />
          )}
          <div className={styles.info}>
            <h4 className={styles.title}>{nextEpisode.title}</h4>
            <p className={styles.episodeMeta}>Saltar ending / créditos</p>
          </div>
        </div>

        <div className={styles.progressBarBackground}>
          <div
            className={styles.progressBarFill}
            style={{ animationDuration: `${countdownSeconds}s` }}
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            type="button"
          >
            Ver Ending
          </button>
          <button
            className={styles.playBtn}
            onClick={() => onPlayNext(nextEpisode)}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};