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

/**
 * MediaDetails Component
 * Decouples metadata fetching from UI rendering and handles loading states gracefully.
 */
const MediaDetails = ({ series, onPlayNext }) => {
    const [metaData, setMetaData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- PROGRESS CALCULATION (Memoized) ---
    const { episodesSeen, totalEpisodes, progressPercent } = useMemo(() => {
        const seen = series?.watchedCount || 0;
        const total = series?.totalEpisodes || 1; 
        return {
            episodesSeen: seen,
            totalEpisodes: total,
            progressPercent: Math.min((seen / total) * 100, 100)
        };
    }, [series]);

    // --- METADATA FETCHING ---
    const fetchMetadata = useCallback(async () => {
        const searchTitle = series?.title || series?.folder;
        if (!searchTitle) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        setLoading(true);
        try {
            const url = `${API_BASE_URL}/api/media/metadata/${encodeURIComponent(searchTitle)}`;
            const response = await fetch(url, { signal: controller.signal });
            
            if (!response.ok) throw new Error('Metadata not found');
            
            const data = await response.json();
            setMetaData(data);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('[MediaDetails] Error fetching metadata:', error);
            }
            setMetaData(null);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }, [series]);

    useEffect(() => {
        setMetaData(null);
        fetchMetadata();
    }, [fetchMetadata]);

    if (!series) return null;

    // --- DATA MAPPING (Clean Architecture Pattern) ---
    const display = {
        title: metaData?.title || series.title || series.folder,
        image: metaData?.image || series.image,
        description: metaData?.description || 'Sin descripción disponible en la base de datos de Alexandria.',
        score: metaData?.score,
        year: metaData?.year || '2025',
        genres: metaData?.genres || [],
    };

    return (
        <div className={styles.heroContainer}>
            {/* Background Backdrop with Blur */}
            <div 
                className={styles.heroBackdrop} 
                style={{ backgroundImage: `url(${display.image})` }} 
                role="presentation"
            />
            
            <div className={styles.heroContent}>
                {loading ? (
                    <div className={styles.skeletonRow}>
                        <div className={styles.skeletonPoster}></div>
                        <div className={styles.skeletonTextCol}>
                            <div className={styles.skeletonTitle}></div>
                            <div className={styles.skeletonText}></div>
                            <div className={styles.skeletonText}></div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.flexRow}>
                        {/* Poster Section */}
                        <div className={styles.posterSide}>
                            <img 
                                src={display.image} 
                                alt={display.title} 
                                className={styles.miniPoster} 
                                loading="eager"
                            />
                            {display.score && (
                                <div className={styles.scoreTag}>
                                    <span className={styles.star}>★</span> {display.score}
                                </div>
                            )}
                        </div>

                        {/* Information Section */}
                        <div className={styles.textSide}>
                            <div className={styles.metaRow}>
                                <span className={styles.cyberBadge}>SISTEMA_ACTIVO</span>
                                <span className={styles.yearBadge}>{display.year}</span>
                                <span className={styles.diskBadge}>DISK_0{series.disk}</span>
                            </div>

                            <h1 className={styles.title}>{display.title}</h1>

                            <div className={styles.genreRow}>
                                {display.genres.map((genre, index) => (
                                    <span key={index} className={styles.genreItem}>
                                        {genre}{index < display.genres.length - 1 ? ' • ' : ''}
                                    </span>
                                ))}
                            </div>

                            {/* Scrollable Description */}
                            <div className={styles.descriptionContainer}>
                                <div className={styles.scrollContent}>
                                    <p className={styles.descriptionText}>{display.description}</p>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className={styles.actionFooter}>
                                <div className={styles.progressBlock}>
                                    <div className={styles.progressInfo}>
                                        <span>DATA_STREAM_PROGRESS</span>
                                        <span>{episodesSeen} / {totalEpisodes} ARCHIVOS</span>
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
                                        <span className={styles.nextLabel}>SIGUIENTE_EPISODIO</span>
                                        <span className={styles.nextValue}>
                                            {series.nextToWatch ? formatEpisodeName(series.nextToWatch) : 'SISTEMA_COMPLETO'}
                                        </span>
                                    </div>
                                    <button 
                                        className={styles.playBtnCyber} 
                                        onClick={() => series.nextToWatch && onPlayNext(`${series.folder}/${series.nextToWatch}`, series.disk, false)}
                                        disabled={!series.nextToWatch}
                                        aria-label="Reproducir siguiente"
                                    >
                                        <span className={styles.playIcon}>▶</span> REPRODUCIR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaDetails;