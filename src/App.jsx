import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Toaster } from 'sonner';

import Header from './components/layout/header/Header';
import Sidebar from './components/layout/sidebar/SideBar';
import ConfigurationPanel from './components/layout/configurationPanel/ConfigurationPanel.jsx';
import MediaList from './components/common/mediaList/MediaList';
import MediaDetails from './components/common/mediaDetails/MediaDetails';
import VideoPlayer from './components/common/videoPlayer/VideoPlayer';
import BulletHell from './components/games/BulletHell.jsx';

import { useMediaHooksManager } from './hooks/mediaHooksManager.ts';
import styles from './styles/App.module.css';

const FILTER_STATUSES = ['Todos', 'Viendo', 'Pendiente', 'Completado', 'Abandonado'];
const STORAGE_DISKS = [
  { id: 1, name: "Multimedia 1", used: "1.2TB", total: "2TB", percentage: "60%" },
  { id: 2, name: "Series SSD", used: "400GB", total: "500GB", percentage: "80%" }
];

function App() {
  const [currentView, setCurrentView] = useState('library');
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchMode, setSearchMode] = useState('local');
  const [theme, setTheme] = useState();
  const [isGameActive, setIsGameActive] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);

  const {
    displayData,
    isInsideMedia,
    isLoading,
    filteredStatus,
    setFilteredStatus,
    setSearchTerm,
    handleMediaClick,
    handleBack,
    handleToggleWatched,
    currentMedia,
    lastWatchedEpisode,
    fetchLastWatched,
    statusStats,
    handleExternalSearch,
    listExternalSearch,
    downloadEpisode
  } = useMediaHooksManager();

  useEffect(() => {
    if (theme === 'yorha') {
      setShowGlitch(true);

      const timer = setTimeout(() => {
        setShowGlitch(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [theme]);

  const computedMediaList = useMemo(() => {
    return searchMode === 'external' ? (listExternalSearch || []) : (displayData || []);
  }, [searchMode, listExternalSearch, displayData]);

  const activeEpisodesList = useMemo(() => {
    if (isInsideMedia && currentMedia?.episodes && Array.isArray(currentMedia.episodes)) {
      return currentMedia.episodes;
    }
    if (isInsideMedia && currentMedia?.items && Array.isArray(currentMedia.items)) {
      return currentMedia.items;
    }
    return computedMediaList;
  }, [isInsideMedia, currentMedia, computedMediaList]);

  const onMediaInteraction = useCallback((path, media) => {
    if (isInsideMedia) {
      if (media.isDownloaded) {
        setActiveVideo(media);
        if (!currentMedia?.isEpisodeWatched) {
          handleToggleWatched(media, true);
        }
      } else {
        downloadEpisode(media.id, media.title);
      }
    } else {
      handleMediaClick(path, media);
    }
  }, [isInsideMedia, currentMedia, handleToggleWatched, downloadEpisode, handleMediaClick]);

  const openVideoPlayerFromSidebar = useCallback(async (mediaItemPath) => {
    if (!mediaItemPath) return;
    const pathParts = mediaItemPath.split('/');
    const title = pathParts.pop();
    const folder = pathParts.join('/');
    const mediaPayload = { title, folder, aliasRoute: lastWatchedEpisode?.aliasRoute || 'noRoute' };

    setActiveVideo(mediaPayload);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      await handleToggleWatched(mediaPayload, true);
      await fetchLastWatched();
    } catch (error) {
      console.error('Error synchronizing progress:', error);
    }
  }, [lastWatchedEpisode, handleToggleWatched, fetchLastWatched]);

  const activateEndingE = useCallback((activate) => {
    setIsGameActive(Boolean(activate));
  }, []);

  const nextEpisode = useMemo(() => {
    if (!activeVideo || !activeEpisodesList || activeEpisodesList.length === 0) {
      return null;
    }

    const currentIndex = activeEpisodesList.findIndex((item) => {
      if (item.id && activeVideo.id) {
        return item.id === activeVideo.id;
      }
      return item.title === activeVideo.title && (item.folder === activeVideo.folder || !item.folder);
    });

    if (currentIndex !== -1 && currentIndex < activeEpisodesList.length - 1) {
      const nextItem = activeEpisodesList[currentIndex + 1];
      return {
        ...nextItem,
        aliasRoute: nextItem.aliasRoute || activeVideo.aliasRoute,
        folder: nextItem.folder || activeVideo.folder
      };
    }

    return null;
  }, [activeVideo, activeEpisodesList]);

  const handlePlayNextEpisode = useCallback(
    async (nextMediaPayload) => {
      if (!nextMediaPayload) return;
      setActiveVideo(nextMediaPayload);
      try {
        await handleToggleWatched(nextMediaPayload, true);
        await fetchLastWatched();
      } catch (error) {
        console.error('Error actualizando episodio visto:', error);
      }
    },
    [handleToggleWatched, fetchLastWatched]
  );

  const isSettingsView = currentView === 'settings';
  const navigateToLibrary = useCallback(() => setCurrentView('library'), []);
  const navigateToSettings = useCallback(() => setCurrentView('settings'), []);
  const handleCloseVideo = useCallback(() => {
    setActiveVideo(null);
    fetchLastWatched();
  }, [fetchLastWatched]);

  return (
    <div className={styles.appContainer}>
      {isGameActive && <BulletHell onExit={() => setIsGameActive(false)} />}

      <Toaster
        richColors
        closeButton
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: 'var(--font-family)' },
        }}
      />

      {activeVideo && (
        <VideoPlayer
          media={activeVideo}
          nextEpisode={nextEpisode}
          onClose={handleCloseVideo}
          onPlayNextEpisode={handlePlayNextEpisode}
          endingOffsetSeconds={90}
        />
      )}

      <Sidebar
        onStatusFilter={setFilteredStatus}
        activeStatus={filteredStatus}
        stats={statusStats}
        lastWatched={lastWatchedEpisode}
        disks={STORAGE_DISKS}
        onClickLastWatched={openVideoPlayerFromSidebar}
        filterStatuses={FILTER_STATUSES}
        onSettingsClick={navigateToSettings}
        onLibraryClick={navigateToLibrary}
        isSettingsActive={isSettingsView}
      />

      <main className={styles.mainContent}>
        <Header
          onSearch={setSearchTerm}
          onExternalSearch={handleExternalSearch}
          onModeChange={setSearchMode}
          isInsideMedia={isInsideMedia}
          setGlobalTheme={setTheme}
          onBackClick={isSettingsView ? navigateToLibrary : handleBack}
          isLoading={isLoading}
          activateEndingE={activateEndingE}
        />

        <div className={styles.scrollableArea}>
          {isSettingsView ? (
            <section className={styles.configWrapper}>
              <ConfigurationPanel />
            </section>
          ) : (
            <MainLibraryView
              isInsideMedia={isInsideMedia}
              currentMedia={currentMedia}
              isLoading={isLoading}
              mediaItems={computedMediaList}
              onMediaClick={onMediaInteraction}
              onToggleWatched={handleToggleWatched}
              searchMode={searchMode}
            />
          )}
        </div>

        {/* Solo procesamos e instanciamos el Glitch cuando está activo */}
        {showGlitch && <GlitchOverlay />}
      </main>
    </div>
  );
}

const MainLibraryView = React.memo(({
  isInsideMedia,
  currentMedia,
  isLoading,
  mediaItems,
  onMediaClick,
  onToggleWatched,
  searchMode
}) => {
  const isEmpty = !isLoading && mediaItems.length === 0;

  return (
    <div className={styles.contentWrapper}>
      {isInsideMedia && currentMedia && (
        <MediaDetails series={currentMedia} onPlayNext={onMediaClick} />
      )}

      <div className={styles.contentBody}>
        {isInsideMedia && <h2 className={styles.sectionTitle}>Available Episodes</h2>}

        {isEmpty ? (
          <div className={styles.emptySearch}>
            <p>NO SE ENCONTRARON RESULTADOS</p>
            <span>Intenta con otros términos o cambia de catálogo</span>
          </div>
        ) : (
          <MediaList
            key={searchMode}
            medias={mediaItems}
            handleMediaClick={onMediaClick}
            isInsideMedia={isInsideMedia}
            onToggleWatched={isInsideMedia ? onToggleWatched : undefined}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
});

MainLibraryView.displayName = 'MainLibraryView';

const GlitchOverlay = () => {
  const [debugCode, setDebugCode] = useState("0x000000");

  useEffect(() => {
    const interval = setInterval(() => {
      const randomHex = "0x" + Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
      setDebugCode(randomHex);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.yorhaGlitchOverlay}>
      <div className={styles.noise} />
      <div className={styles.scanlines} />

      <div className={styles.glitchContent}>
        <span className={styles.syncText}>SYNCING_WITH_BUNKER</span>
        <span className={styles.hexCode}>{debugCode}</span>

        <div className={styles.fakeLoadingBar}>
          <div className={styles.fakeLoadingFill} />
        </div>
      </div>
    </div>
  );
};

export default App;