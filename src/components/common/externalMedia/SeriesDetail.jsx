import React, { useState } from 'react';
import axios from 'axios';
import {} from './SeriesDetail.module.css';

interface SeriesProps {
  series: any; // Aquí deberías usar tu interfaz MediaItem extendida
}

const SeriesDetail = ({ series }) => {
  const [loadingSeason, setLoadingSeason] = useState(null);

  const fanart = series.images.find((img: any) => img.coverType === 'fanart')?.remoteUrl;
  const poster = series.images.find((img: any) => img.coverType === 'poster')?.remoteUrl;

  const handleDownloadSeason = async (seasonNumber: number) => {
    setLoadingSeason(seasonNumber);
    try {
      // Enviamos el comando a nuestro backend
      await axios.post(`http://localhost:3001/api/sonarr/command`, {
        name: "SeasonSearch",
        seriesId: series.id,
        seasonNumber: seasonNumber
      });
      alert(`Sonarr ha comenzado a buscar la temporada ${seasonNumber}`);
    } catch (error) {
      console.error("Error al disparar búsqueda:", error);
      alert("No se pudo iniciar la búsqueda. Revisa la consola.");
    } finally {
      setLoadingSeason(null);
    }
  };

  return (
    <div className="series-container font-sans">
      <div className="hero-banner">
        <img src={fanart} alt="Banner" className="hero-image" />
        <div className="hero-overlay"></div>
      </div>

      <div className="content-wrapper">
        <div className="main-info">
          <img src={poster} alt={series.title} className="poster-img" />
          
          <div className="info-text">
            <div className="title-row">
              <h1>{series.title}</h1>
              <span className="badge badge-anime">{series.seriesType}</span>
              <span className={`badge ${series.status === 'continuing' ? 'badge-status-on' : 'badge-status-off'}`}>
                {series.status === 'continuing' ? 'En Emisión' : 'Finalizada'}
              </span>
            </div>

            <p className="overview">{series.overview}</p>

            <div className="meta-grid">
              <span>⭐ <strong>{series.ratings.value}</strong></span>
              <span>📅 {series.year}</span>
              <span>🏢 {series.network}</span>
              <span>🌍 {series.originalLanguage.name}</span>
            </div>
          </div>
        </div>

        <div className="seasons-list">
          <h2 className="section-title">Temporadas</h2>
          {series.seasons.filter((s: any) => s.seasonNumber > 0).reverse().map((season: any) => {
            const progress = (season.statistics.episodeFileCount / season.statistics.totalEpisodeCount) * 100;
            
            return (
              <div key={season.seasonNumber} className="season-card">
                <div className="season-info">
                  <h3>Temporada {season.seasonNumber}</h3>
                  <p className="progress-text">
                    Episodios: {season.statistics.episodeFileCount} / {season.statistics.totalEpisodeCount}
                  </p>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="actions">
                  {progress === 100 ? (
                    <span className="completed-tag">✓ Completa</span>
                  ) : (
                    <button 
                      className="btn-download"
                      onClick={() => handleDownloadSeason(season.seasonNumber)}
                      disabled={loadingSeason === season.seasonNumber}
                    >
                      {loadingSeason === season.seasonNumber ? 'Buscando...' : 'Descargar Faltantes'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;