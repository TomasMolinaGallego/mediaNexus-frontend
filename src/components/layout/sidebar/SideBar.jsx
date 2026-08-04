import React, { memo, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  FiGrid,
  FiPlayCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiHardDrive,
  FiClock
} from 'react-icons/fi';
import ReplaySection from '../replaySection/ReplaySection.jsx';
import styles from './SideBar.module.css';

// --- Sub-componentes Memoizados ---

const NavItem = memo(({ icon, label, active, onClick, collapsed, badge }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <li
      className={`${styles.navItem} ${active ? styles.active : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={label}
      title={collapsed ? label : undefined}
    >
      <span className={styles.icon}>{icon}</span>
      {!collapsed && <span className={styles.label}>{label}</span>}
      {!collapsed && badge !== undefined && <span className={styles.badge}>{badge}</span>}
      {active && <div className={styles.activeIndicator} />}
    </li>
  );
});

NavItem.displayName = 'NavItem';

const DiskItem = memo(({ disk }) => {
  const isFull = parseFloat(disk.percentage) > 90;
  return (
    <div className={styles.diskItem}>
      <div className={styles.diskHeader}>
        <div className={styles.diskName}>
          <FiHardDrive size={12} />
          <span>{disk.name}</span>
        </div>
        <span className={styles.usageText}>
          {disk.used} / {disk.total}
        </span>
      </div>
      <div className={styles.diskBar}>
        <div
          className={`${styles.diskProgress} ${isFull ? styles.diskFull : ''}`}
          style={{ width: disk.percentage }}
        />
      </div>
    </div>
  );
});

DiskItem.displayName = 'DiskItem';

// --- Componente Principal ---

const SideBar = memo(({ 
  onStatusFilter, 
  activeStatus, 
  stats, 
  lastWatched, 
  disks, 
  onClickLastWatched 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [downloads, setDownloads] = useState([]);

  // Fetch de descargas con soporte de cancelación de solicitudes
  const fetchDownloads = useCallback(async (cancelToken) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/qbit/status/downloads`,
        { cancelToken }
      );
      const activeDls = (data || []).filter((t) =>
        ['downloading', 'stalledDL', 'metaDL', 'queuedDL'].includes(t.status)
      );
      setDownloads(activeDls);
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.warn('QBit no disponible o error de red');
      }
    }
  }, []);

  useEffect(() => {
    if (isCollapsed) return;

    const source = axios.CancelToken.source();
    fetchDownloads(source.token);

    const interval = setInterval(() => {
      fetchDownloads(source.token);
    }, 4000);

    return () => {
      source.cancel('Sidebar colapsada o desmontada');
      clearInterval(interval);
    };
  }, [isCollapsed, fetchDownloads]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleNavigation = useCallback((targetEpisode) => {
    if (targetEpisode && typeof onClickLastWatched === 'function') {
      onClickLastWatched(targetEpisode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onClickLastWatched]);

  const handleFilterClick = useCallback((status) => {
    if (typeof onStatusFilter === 'function') {
      onStatusFilter(status);
    }
  }, [onStatusFilter]);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <button
        className={styles.toggleBtn}
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}
        type="button"
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>A</div>
        {!isCollapsed && <span className={styles.logoText}>ALEXANDRIA</span>}
      </div>

      <nav className={styles.navGroup}>
        {!isCollapsed && <p className={styles.groupTitle}>Biblioteca</p>}
        <ul className={styles.navList}>
          <NavItem
            icon={<FiGrid />}
            label="Total"
            active={activeStatus === 'Todos'}
            onClick={() => handleFilterClick('Todos')}
            collapsed={isCollapsed}
            badge={stats?.total}
          />
          <NavItem
            icon={<FiPlayCircle />}
            label="Viendo"
            active={activeStatus === 'Viendo'}
            onClick={() => handleFilterClick('Viendo')}
            collapsed={isCollapsed}
            badge={stats?.watching}
          />
          <NavItem
            icon={<FiClock />}
            label="Pendientes"
            active={activeStatus === 'Pendiente'}
            onClick={() => handleFilterClick('Pendiente')}
            collapsed={isCollapsed}
            badge={stats?.planToWatch}
          />
          <NavItem
            icon={<FiCheckCircle />}
            label="Completados"
            active={activeStatus === 'Completado'}
            onClick={() => handleFilterClick('Completado')}
            collapsed={isCollapsed}
            badge={stats?.completed}
          />
        </ul>
      </nav>

      {!isCollapsed && (
        <div className={styles.bottomContent}>
          {/* Sección de Descargas */}
          {downloads.length > 0 && (
            <div className={styles.extraSection}>
              <p className={styles.groupTitle}>Descargas Activas</p>
              <div className={styles.downloadList}>
                {downloads.slice(0, 3).map((dl) => (
                  <div key={dl.hash || dl.name} className={styles.downloadItem}>
                    <div className={styles.dlHeader}>
                      <span className={styles.dlName}>{dl.name}</span>
                      <span className={styles.dlPercent}>{dl.progress}%</span>
                    </div>
                    <div className={styles.dlBarBg}>
                      <div
                        className={styles.dlBarFill}
                        style={{ width: `${dl.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ReplaySection 
            onClickLastWatched={handleNavigation} 
            lastWatched={lastWatched} 
          />

          {/* Almacenamiento */}
          {disks && disks.length > 0 && (
            <div className={styles.extraSection}>
              <p className={styles.groupTitle}>Almacenamiento</p>
              {disks.map((disk) => (
                <DiskItem key={disk.id || disk.name} disk={disk} />
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
});

SideBar.displayName = 'SideBar';

export default SideBar;