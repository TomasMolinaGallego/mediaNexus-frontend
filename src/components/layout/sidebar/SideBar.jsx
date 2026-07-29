import React, { memo, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  FiGrid, FiPlayCircle, FiCheckCircle, FiChevronLeft,
  FiChevronRight, FiHardDrive, FiClock
} from 'react-icons/fi';
import ReplaySection from '../replaySection/ReplaySection.jsx';
import styles from './SideBar.module.css';

// --- Sub-componentes Internos ---

const NavItem = ({ icon, label, active, onClick, collapsed, badge }) => (
  <li 
    className={`${styles.navItem} ${active ? styles.active : ''}`} 
    onClick={onClick}
    tabIndex={0}
    role="button"
    title={collapsed ? label : ''} // Tooltip nativo cuando está colapsado
  >
    <span className={styles.icon}>{icon}</span>
    {!collapsed && <span className={styles.label}>{label}</span>}
    {!collapsed && badge !== undefined && <span className={styles.badge}>{badge}</span>}
    {active && <div className={styles.activeIndicator} />}
  </li>
);

const DiskItem = ({ disk }) => {
  const isFull = parseFloat(disk.percentage) > 90;
  return (
    <div className={styles.diskItem}>
      <div className={styles.diskHeader}>
        <div className={styles.diskName}>
          <FiHardDrive size={12} />
          <span>{disk.name}</span>
        </div>
        <span className={styles.usageText}>{disk.used} / {disk.total}</span>
      </div>
      <div className={styles.diskBar}>
        <div 
          className={`${styles.diskProgress} ${isFull ? styles.diskFull : ''}`}
          style={{ width: disk.percentage }} 
        />
      </div>
    </div>
  );
};

// --- Componente Principal ---

const SideBar = memo(({ onStatusFilter, activeStatus, stats, lastWatched, disks, onClickLastWatched }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [downloads, setDownloads] = useState([]);

  // Fetch de descargas con manejo de errores limpio
  const fetchDownloads = useCallback(async () => {
    try {
      const { data } = await axios.get('http://localhost:3001/api/qbit/status/downloads');
      const activeDls = data.filter(t => 
        ['downloading', 'stalledDL', 'metaDL', 'queuedDL'].includes(t.status)
      );
      setDownloads(activeDls);
    } catch (err) {
      console.warn("QBit no disponible o error de red");
    }
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      fetchDownloads();
      const interval = setInterval(fetchDownloads, 4000);
      return () => clearInterval(interval);
    }
  }, [isCollapsed, fetchDownloads]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  const handleNavigation = (targetEpisode) => {
    if (targetEpisode) {
      onClickLastWatched(targetEpisode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <button 
        className={styles.toggleBtn} 
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Abrir barra lateral" : "Cerrar barra lateral"}
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
            onClick={() => onStatusFilter('Todos')} 
            collapsed={isCollapsed} 
            badge={stats?.total} 
          />
          <NavItem 
            icon={<FiPlayCircle />} 
            label="Viendo" 
            active={activeStatus === 'Viendo'} 
            onClick={() => onStatusFilter('Viendo')} 
            collapsed={isCollapsed} 
            badge={stats?.watching} 
          />
          <NavItem 
            icon={<FiClock />} 
            label="Pendientes" 
            active={activeStatus === 'Pendiente'} 
            onClick={() => onStatusFilter('Pendiente')} 
            collapsed={isCollapsed} 
            badge={stats?.planToWatch} 
          />
          <NavItem 
            icon={<FiCheckCircle />} 
            label="Completados" 
            active={activeStatus === 'Completado'} 
            onClick={() => onStatusFilter('Completado')} 
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
                {downloads.slice(0, 3).map(dl => (
                  <div key={dl.hash} className={styles.downloadItem}>
                    <div className={styles.dlHeader}>
                      <span className={styles.dlName}>{dl.name}</span>
                      <span className={styles.dlPercent}>{dl.progress}%</span>
                    </div>
                    <div className={styles.dlBarBg}>
                      <div className={styles.dlBarFill} style={{ width: `${dl.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ReplaySection onClickLastWatched={handleNavigation} lastWatched={lastWatched} />

          {/* Almacenamiento */}
          <div className={styles.extraSection}>
            <p className={styles.groupTitle}>Almacenamiento</p>
            {disks?.map(disk => <DiskItem key={disk.id} disk={disk} />)}
          </div>
        </div>
      )}
    </aside>
  );
});

export default SideBar;