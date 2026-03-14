import React, { useState } from 'react';
import styles from './styles/App.module.css';
import Header from './components/layout/header/Header';
import MediaList from './components/common/mediaList/MediaList';
import Sidebar from './components/layout/sidebar/SideBar';
import MediaDetails from './components/common/mediaDetails/MediaDetails';
import VideoPlayer from './components/common/videoPlayer/VideoPlayer';
import ConfigurationPanel from './components/layout/configurationPanel/ConfigurationPanel.jsx';
import { useMediaHooksManager } from './hooks/mediaHooksManager.ts';

const FILTER_STATUSES = ['Todos', 'Viendo', 'Pendiente', 'Completado', 'Abandonado'];

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [playingMedia, setPlayingMedia] = useState(null);

  const {
    displayData, isInsideMedia, isLoading, filteredStatus,
    setFilteredStatus, setSearchTerm, handleMediaClick, handleBack,
    handleToggleWatched, currentMedia, lastWatchedEpisode, openVlc, statusStats
  } = useMediaHooksManager();

  const onMediaClick = (path, alias) => {
    if (isInsideMedia) {
        // Si ya estamos dentro y es un archivo, buscamos el objeto media
        const mediaObj = displayData.find(m => m.title === path.split('/').pop());
        setPlayingMedia(mediaObj);
    } else {
        handleMediaClick(path, alias);
    }
  };

  const navigateToLibrary = () => {
    setShowSettings(false);
  };

  const mockDisks = [
    { id: 1, name: "Multimedia 1", used: "1.2TB", total: "2TB", percentage: "60%" },
    { id: 2, name: "Series SSD", used: "400GB", total: "500GB", percentage: "80%" }
  ];

  return (
    <div className={styles.appContainer}>
      {playingMedia && (
        <VideoPlayer 
          media={playingMedia} 
          onClose={() => setPlayingMedia(null)} 
        />
      )}
      <Sidebar
        onStatusFilter={setFilteredStatus}
        activeStatus={filteredStatus}
        stats={statusStats}
        lastWatched={lastWatchedEpisode}
        disks={mockDisks}
        onClickLastWatched={openVlc}
        filterStatuses={FILTER_STATUSES}
        // Nueva prop para abrir configuración desde el Sidebar
        onSettingsClick={() => setShowSettings(true)}
        onLibraryClick={navigateToLibrary}
        isSettingsActive={showSettings}
      />

      <main className={styles.mainContent}>
        <Header
          onSearch={setSearchTerm}
          filterStatuses={FILTER_STATUSES}
          filteredStatus={filteredStatus}
          onFilterChange={setFilteredStatus}
          isInsideMedia={isInsideMedia}
          onBackClick={showSettings ? navigateToLibrary : handleBack}
        />

        <div className={styles.scrollableArea}>
          {showSettings ? (
            <div className={styles.configWrapper}>
               <ConfigurationPanel />
            </div>
          ) : (
            <>
              {isInsideMedia && currentMedia && (
                <MediaDetails
                  series={currentMedia}
                  onPlayNext={onMediaClick}
                />
              )}

              <div className={styles.contentBody}>
                {isInsideMedia && (
                  <h2 className={styles.sectionTitle}>Episodios Disponibles</h2>
                )}

                <MediaList
                  medias={displayData}
                  handleMediaClick={onMediaClick}
                  isInsideMedia={isInsideMedia}
                  onToggleWatched={isInsideMedia ? handleToggleWatched : undefined}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;