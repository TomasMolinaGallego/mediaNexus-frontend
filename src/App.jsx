import React, { useState, useMemo, useEffect } from 'react';
import { Toaster } from 'sonner';

// Componentes y Estilos
import Header from './components/layout/header/Header';
import Sidebar from './components/layout/sidebar/SideBar';
import ConfigurationPanel from './components/layout/configurationPanel/ConfigurationPanel.jsx';
import MediaList from './components/common/mediaList/MediaList';
import MediaDetails from './components/common/mediaDetails/MediaDetails';
import VideoPlayer from './components/common/videoPlayer/VideoPlayer';
import { useMediaHooksManager } from './hooks/mediaHooksManager.ts';
import styles from './styles/App.module.css';
import BulletHell from './components/games/BulletHell.jsx';

const FILTER_STATUSES = ['Todos', 'Viendo', 'Pendiente', 'Completado', 'Abandonado'];
const STORAGE_DISKS = [
  { id: 1, name: "Multimedia 1", used: "1.2TB", total: "2TB", percentage: "60%" },
  { id: 2, name: "Series SSD", used: "400GB", total: "500GB", percentage: "80%" }
];

function App() {
  const [currentView, setCurrentView] = useState('library');
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchMode, setSearchMode] = useState('local'); // Sincronizado con Header
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

  // Escuchar cuando el tema cambia a YoRHa
  useEffect(() => {
    // Verifica que 'theme' sea exactamente 'yorha'
    if (theme === 'yorha') {
      console.log("Activando Glitch YoRHa..."); // Revisa la consola (F12)
      setShowGlitch(true);

      const timer = setTimeout(() => {
        setShowGlitch(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [theme]); // Se dispara cada vez que el tema cambia

  // MODO EXCLUYENTE: Evita que se mezclen resultados de tabs anteriores
  const computedMediaList = useMemo(() => {
    if (searchMode === 'external') {
      return listExternalSearch || [];
    }
    return displayData || [];
  }, [searchMode, listExternalSearch, displayData]);

  const onMediaInteraction = (path, media) => {
    if (isInsideMedia) {
      if (media.isDownloaded) {
        setActiveVideo(media);
        currentMedia.isEpisodeWatched || handleToggleWatched(media, true);
      } else {
        downloadEpisode(media.id, media.title);
      }
    } else {
      handleMediaClick(path, media);
    }
  };

  const openVideoPlayerFromSidebar = async (mediaItemPath) => {
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
  };

  const activateEndingE = (activate) => {
    console.log(`activateEndingE called with: ${activate}`);
    if(activate) {
      setIsGameActive(true);
    } else {
      setIsGameActive(false);
    }
  }

  const isSettingsView = currentView === 'settings';
  const navigateToLibrary = () => setCurrentView('library');

  return (
    <div className={styles.appContainer}>
      { isGameActive && <BulletHell onExit={() => setIsGameActive(false)} /> }
      <Toaster
        richColors
        closeButton
        theme="dark" // O basarte en tu variable 'theme'
        position="bottom-right"
        toastOptions={{
          // Esto asegura que la fuente y el estilo base se hereden siempre
          style: { fontFamily: 'var(--font-family)' },
        }}
      />

      {activeVideo && (
        <VideoPlayer
          media={activeVideo}
          onClose={() => { setActiveVideo(null); fetchLastWatched(); }}
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
        onSettingsClick={() => setCurrentView('settings')}
        onLibraryClick={navigateToLibrary}
        isSettingsActive={isSettingsView}
      />

      <main className={styles.mainContent}>
        <Header
          onSearch={setSearchTerm}
          onExternalSearch={handleExternalSearch}
          onModeChange={setSearchMode}
          isInsideMedia={isInsideMedia}
          setGlobalTheme={setTheme} // Pasamos el setter de tema al Header
          onBackClick={isSettingsView ? navigateToLibrary : handleBack}
          isLoading={isLoading} // Pasamos el loading al Header
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
              searchMode={searchMode} // Clave para el reseteo visual
            />
          )}
        </div>
        <GlitchOverlay />
      </main>
    </div>
  );
}

const MainLibraryView = ({
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
            key={searchMode} // Fuerza el re-montaje al cambiar de tab
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
};

const GlitchOverlay = () => {
  const [debugCode, setDebugCode] = useState("0x000000");

  useEffect(() => {
    const interval = setInterval(() => {
      const randomHex = "0x" + Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
      setDebugCode(randomHex);
    }, 50); // Cambia cada 50ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.yorhaGlitchOverlay}>
      <div className={styles.noise} />
      <div className={styles.scanlines} />

      <div className={styles.glitchContent}>
        <span className={styles.syncText}>SYNCING_WITH_BUNKER</span>
        <span className={styles.hexCode}>{debugCode}</span>

        {/* Barra de carga decorativa */}
        <div className={styles.fakeLoadingBar}>
          <div className={styles.fakeLoadingFill} />
        </div>
      </div>
    </div>
  );
};

export default App;