import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './SeriesDetail.module.css';

export interface SonarrImage {
  coverType: 'fanart' | 'poster' | 'banner' | string;
  remoteUrl: string;
}

export interface SeasonStatistics {
  episodeFileCount: number;
  totalEpisodeCount: number;
  percentOfEpisodes?: number;
}

export interface Season {
  seasonNumber: number;
  monitored?: boolean;
  statistics?: SeasonStatistics;
}

export interface SeriesData {
  id: number;
  title: string;
  overview?: string;
  seriesType?: string;
  status?: string;
  year?: number;
  network?: string;
  originalLanguage?: {
    name?: string;
  };
  ratings?: {
    value?: number;
  };
  images?: SonarrImage[];
  seasons?: Season[];
}

interface SeriesDetailProps {
  series: SeriesData;
}

const SeriesDetail: React.FC<SeriesDetailProps> = ({ series }) => {
  const [loadingSeason, setLoadingSeason] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ season: number; text: string; error?: boolean } | null>(null);

  const fanart = series?.images?.find(img => img.coverType === 'fanart')?.remoteUrl;
  const poster = series?.images?.find(img => img.coverType === 'poster')?.remoteUrl;

  const handleDownloadSeason = useCallback(async (seasonNumber: number) => {
    setLoadingSeason(seasonNumber);
    setFeedbackMessage(null);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/sonarr/command`, {
        name: 'SeasonSearch',
        seriesId: series.id,
        seasonNumber: seasonNumber
      });
      setFeedbackMessage({ season: seasonNumber, text: 'Búsqueda iniciada' });
    } catch (error) {
      console.error('Error al disparar la búsqueda:', error);
      setFeedbackMessage({ season: seasonNumber, text: 'Error al iniciar', error: true });
    } finally {
      setLoadingSeason(null);
    }
  }, [series?.id]);

  if (!series) {
    return <div className={styles.emptyContainer}>No hay detalles disponibles para esta serie.</div>;
  }

  const filteredSeasons = (series.seasons ?? [])
    .filter(s => s.seasonNumber > 0)
    .sort((a, b) => b.seasonNumber - a.seasonNumber);

  return (
    <article className={styles.seriesContainer}>
      {/* Banner Principal */}
      <div className={styles.heroBanner}>
        {fanart && <img src={fanart} alt="" className={styles.heroImage} role="presentation" />}
        <div className={styles.heroOverlay} />
      </div>

      <div className={styles.contentWrapper}>
        {/* Información General */}
        <section className={styles.mainInfo}>
          {poster && <img src={poster} alt={series.title} className={styles.posterImg} />}
          
          <div className={styles.infoText}>
            <div className={styles.titleRow}>
              <h1>{series.title}</h1>
              {series.seriesType && (
                <span className={`${styles.badge} ${styles.badgeAnime}`}>
                  {series.seriesType}
                </span>
              )}
              <span 
                className={`${styles.badge} ${
                  series.status === 'continuing' ? styles.badgeStatusOn : styles.badgeStatusOff
                }`}
              >
                {series.status === 'continuing' ? 'En Emisión' : 'Finalizada'}
              </span>
            </div>

            <p className={styles.overview}>{series.overview ?? 'Sin descripción disponible.'}</p>

            <div className={styles.metaGrid}>
              <span>⭐ <strong>{series.ratings?.value ? series.ratings.value.toFixed(1) : 'N/A'}</strong></span>
              {series.year && <span>📅 {series.year}</span>}
              {series.network && <span>🏢 {series.network}</span>}
              {series.originalLanguage?.name && <span>🌍 {series.originalLanguage.name}</span>}
            </div>
          </div>
        </section>

        {/* Listado de Temporadas */}
        <section className={styles.seasonsList}>
          <h2 className={styles.sectionTitle}>Temporadas</h2>
          
          {filteredSeasons.map((season) => {
            const fileCount = season.statistics?.episodeFileCount ?? 0;
            const totalCount = season.statistics?.totalEpisodeCount ?? 0;
            const progress = totalCount > 0 ? Math.min(100, Math.round((fileCount / totalCount) * 100)) : 0;
            const isCompleted = progress === 100 && totalCount > 0;
            const isLoading = loadingSeason === season.seasonNumber;
            const feedback = feedbackMessage?.season === season.seasonNumber ? feedbackMessage : null;

            return (
              <div key={`season-${season.seasonNumber}`} className={styles.seasonCard}>
                <div className={styles.seasonInfo}>
                  <h3>Temporada {season.seasonNumber}</h3>
                  <p className={styles.progressText}>
                    Episodios: {fileCount} / {totalCount}
                  </p>
                  <div 
                    className={styles.progressBarContainer} 
                    role="progressbar" 
                    aria-valuenow={progress} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                    aria-label={`Progreso de la Temporada ${season.seasonNumber}`}
                  >
                    <div 
                      className={styles.progressBarFill} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  {feedback && (
                    <span className={feedback.error ? styles.errorTag : styles.successTag}>
                      {feedback.text}
                    </span>
                  )}

                  {isCompleted ? (
                    <span className={styles.completedTag}>✓ Completa</span>
                  ) : (
                    <button 
                      type="button"
                      className={styles.btnDownload}
                      onClick={() => handleDownloadSeason(season.seasonNumber)}
                      disabled={isLoading}
                      aria-busy={isLoading}
                    >
                      {isLoading ? 'Buscando...' : 'Descargar Faltantes'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </article>
  );
};

export default SeriesDetail;