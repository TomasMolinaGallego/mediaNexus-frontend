import styles from './ReplaySection.module.css';
import React, { useState, useEffect } from 'react';
import {
    FiPlayCircle, FiActivity, FiClock
} from 'react-icons/fi';
import MediaUtils from '../../../utils/MediaUtils.jsx';

const ReplaySection = ({ onClickLastWatched, lastWatched }) => {

    const [lastEpisodeWatched, setLastEpisodeWatched] = useState(null);
    const [nextEpisode, setNextEpisode] = useState(null);
    const [image, setImage] = useState(null);
    const [name, setName] = useState('');
    const [numberEpisodeNext, setNumberEpisodeNext] = useState('');
    const [episode, setEpisode] = useState('');

    const handleNavigation = (targetEpisode) => {
        if (targetEpisode) {
            onClickLastWatched(targetEpisode, lastWatched.disk, false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };



    useEffect(() => {
        console.log('Received lastWatched:', lastWatched);
        if (lastWatched) {
            setLastEpisodeWatched(lastWatched.lastEpisodeWatched);
            setNextEpisode(lastWatched.nextEpisodeToWatch);
            const { episode: episodeNumberNext } = MediaUtils.parseMediaString(lastWatched.nextEpisodeToWatch);
            setNumberEpisodeNext(episodeNumberNext);
            console.log('Parsed next episode number:', episodeNumberNext);
            
            const { series: seriesName, episode: episodeNumber } = MediaUtils.parseMediaString(lastWatched.lastEpisodeWatched);
            setName(seriesName);
            console.log('Parsed series name:', seriesName);

            setEpisode(episodeNumber);
            console.log('Parsed episode number:', episodeNumber);
            setImage(lastWatched.imageSeries);
        }
    }, [lastWatched]);



    return (

        <>
            {lastWatched ? (
                <>
                    <div className={styles.extraSection}>
                        <p className={styles.groupTitle}>Último visto</p>

                        <div className={styles.lastWatchedCard} onClick={() => handleNavigation(nextEpisode)}>
                            <img src={`${image}`} alt={name} />
                            <div className={styles.lastWatchedInfo}>
                                <span className={styles.seriesName}>{name}</span>
                                <br />
                                <span className={styles.episodeName}>{episode}</span>
                                <div className={styles.miniProgress}>
                                    <div style={{ width: '70%' }} />
                                </div>
                            </div>
                        </div><div className={styles.actionButtons}>
                            <button className={styles.primaryAction} onClick={() => handleNavigation(lastEpisodeWatched)}>
                                <FiClock size={14} /> Volver a ver {episode.replace('Episodio ', 'E')}
                            </button>

                            <button className={styles.secondaryAction} onClick={() => handleNavigation(nextEpisode)} disabled={numberEpisodeNext === ""}>
                                <FiPlayCircle size={14} /> { numberEpisodeNext === "" ? "Último episodio visto" : `Siguiente: ${numberEpisodeNext.replace('Episodio ', 'E')}`}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className={styles.noLastWatched}>
                    <FiActivity size={24} />
                    <p>No hay episodios vistos recientemente</p>
                </div>
            )}
        </>

    )


}
export default ReplaySection;