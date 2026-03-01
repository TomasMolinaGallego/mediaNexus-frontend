import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './MediaDetails.module.css';

/**
 * API base URL - Ideally from an environment variable.
 */
const API_BASE_URL = 'http://localhost:3001';

/**
 * Utility to clean file names for display.
 */
const formatEpisodeName = (fileName) => {
    if (!fileName) return '';
    return fileName
        .replace(/\.[^/.]+$/, "") // Remove extension
        .replace(/\[.*?\]/g, "")  // Remove tags
        .replace(/_/g, " ")       // Replace underscores
        .trim();
};
// ... (mismos imports y utilidades)

const MediaDetails = ({ series, onPlayNext }) => {
    const [metaData, setMetaData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- PROGRESS CALCULATION ---
    const { episodesSeen, totalEpisodes, progressPercent } = useMemo(() => {
        const seen = series?.watchedCount || 0;
        const total = series?.totalEpisodes || 1; 
        return {
            episodesSeen: seen,
            totalEpisodes: total,
            progressPercent: Math.min((seen / total) * 100, 100)
        };
    }, [series]);

    // --- FETCHING (con limpieza de estado al cambiar) ---
    const fetchMetadata = useCallback(async () => {
        const searchTitle = series?.title || series?.folder;
        if (!searchTitle) return;

        const controller = new AbortController();
        setLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/media/metadata/${encodeURIComponent(searchTitle)}`, { 
                signal: controller.signal 
            });
            if (!response.ok) throw new Error('Metadata error');
            const data = await response.json();
            setMetaData(data);
        } catch (error) {
            if (error.name !== 'AbortError') setMetaData(null);
        } finally {
            setLoading(false);
        }
        return () => controller.abort();
    }, [series]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    if (!series) return null;

    const display = {
        title: metaData?.title || series.title || series.folder,
        image: metaData?.image || series.image,
        description: metaData?.description || 'Sin descripción disponible en la base de datos.',
        score: metaData?.score,
        year: metaData?.year || 'N/A',
        genres: metaData?.genres || [],
    };

    return (
        <section className={styles.heroContainer} aria-label="Detalles de la serie">
            <div 
                className={styles.heroBackdrop} 
                style={{ backgroundImage: `url(${display.image})` }} 
                aria-hidden="true"
            />
            
            <div className={styles.heroContent}>
                {loading ? (
                    <div className={styles.skeletonRow}>
                        <div className={styles.skeletonPoster}></div>
                        <div className={styles.skeletonTextCol}>
                            <div className={styles.skeletonTitle}></div>
                            <div className={styles.skeletonText}></div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.flexRow}>
                        <div className={styles.posterSide}>
                            <img src={display.image} alt="" className={styles.miniPoster} />
                            {display.score && (
                                <div className={styles.scoreTag}>
                                    <span className={styles.star}>★</span> {display.score}
                                </div>
                            )}
                        </div>

                        <div className={styles.textSide}>
                            <div className={styles.metaRow}>
                                <span className={styles.cyberBadge}>SISTEMA_ACTIVO</span>
                                <span className={styles.cyberBadge}>{display.year}</span>
                            </div>

                            <h1 className={styles.title}>{display.title}</h1>

                            <div className={styles.genreRow}>
                                {display.genres.map((genre, i) => (
                                    <span key={i} className={styles.genreItem}>
                                        {genre}{i < display.genres.length - 1 ? ' • ' : ''}
                                    </span>
                                ))}
                            </div>

                            <div className={styles.descriptionContainer}>
                                <p className={styles.descriptionText}>{display.description}</p>
                            </div>

                            <div className={styles.actionFooter}>
                                <div className={styles.progressBlock}>
                                    <div className={styles.progressInfo}>
                                        <span>PROGRESO</span>
                                        <span>{episodesSeen} / {totalEpisodes}</span>
                                    </div>
                                    <div className={styles.progressTrack}>
                                        <div 
                                            className={styles.progressBar} 
                                            style={{ width: `${progressPercent}%` }} 
                                        />
                                    </div>
                                </div>

                                <div className={styles.playInterface}>
                                    <div className={styles.nextInfo}>
                                        <span className={styles.nextLabel}>SIGUIENTE</span>
                                        <span className={styles.nextValue}>
                                            {series.nextToWatch ? formatEpisodeName(series.nextToWatch) : 'COMPLETO'}
                                        </span>
                                    </div>
                                    <button 
                                        className={styles.playBtnCyber} 
                                        onClick={() => onPlayNext(`${series.folder}/${series.nextToWatch}`, series.aliasRoute)}
                                        disabled={!series.nextToWatch}
                                    >
                                        REPRODUCIR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MediaDetails;