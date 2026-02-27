import React, { useState } from 'react';
import styles from './SideBar.module.css';
import {
  FiGrid, FiPlayCircle, FiCheckCircle, FiChevronLeft,
  FiChevronRight, FiHardDrive, FiActivity, FiClock, FiAlertCircle
} from 'react-icons/fi';
import ReplaySection from '../replaySection/ReplaySection.jsx';
import ConfigurationPanel from '../configurationPanel/ConfigurationPanel.jsx';

const NavItem = ({ icon, label, active, onClick, collapsed, badge }) => (
  <div className={`${styles.navItem} ${active ? styles.active : ''}`} onClick={onClick}>
    <span className={styles.icon}>{icon}</span>
    {!collapsed && <span className={styles.label}>{label}</span>}
    {!collapsed && badge !== undefined && <span className={styles.badge}>{badge}</span>}
    {active && <div className={styles.activeIndicator} />}
  </div>
);

const SideBar = ({ onStatusFilter, activeStatus, stats, lastWatched, disks, onClickLastWatched, filterStatuses }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Función unificada para navegar y subir al top
  const handleNavigation = (targetEpisode) => {
    console.log("Navegando a episodio:", targetEpisode);
    console.log("LastWatched en SideBar:", lastWatched);
    if (targetEpisode) {
      onClickLastWatched(targetEpisode, lastWatched.disk, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>A</div>
        {!isCollapsed && <span className={styles.logoText}>ALEXANDRIA</span>}
      </div>

      <nav className={styles.navGroup}>
        <p className={styles.groupTitle}>{!isCollapsed ? 'Biblioteca' : ''}</p>
        <NavItem
          icon={<FiGrid />} label="Total"
          active={activeStatus === 'Todos'}
          onClick={() => onStatusFilter('Todos')}
          collapsed={isCollapsed}
          badge={stats?.total}
        />
        <NavItem
          icon={<FiPlayCircle />} label="Viendo"
          active={activeStatus === 'Viendo'}
          onClick={() => onStatusFilter('Viendo')}
          collapsed={isCollapsed}
          badge={stats?.watching}
        />
        <NavItem
          icon={<FiClock />} label="Pendientes"
          active={activeStatus === 'Pendiente'}
          onClick={() => onStatusFilter('Pendiente')}
          collapsed={isCollapsed}
          badge={stats?.planToWatch}
        />
        <NavItem
          icon={<FiCheckCircle />} label="Completados"
          active={activeStatus === 'Completado'}
          onClick={() => onStatusFilter('Completado')}
          collapsed={isCollapsed}
          badge={stats?.completed}
        />
        <NavItem
          icon={<FiAlertCircle />} label="Abandonados"
          active={activeStatus === 'Abandonado'}
          onClick={() => onStatusFilter('Abandonado')}
          collapsed={isCollapsed}
          badge={stats?.dropped}
        />
      </nav>

      {!isCollapsed && (
        <>
        

          <ReplaySection onClickLastWatched={handleNavigation} lastWatched={lastWatched} />

          <div className={styles.extraSection}>
            <p className={styles.groupTitle}>Almacenamiento</p>
            {disks?.map(disk => (
              <div key={disk.id} className={styles.diskItem}>
                <div className={styles.diskHeader}>
                  <FiHardDrive size={12} />
                  <span>{disk.name}</span>
                  <span className={styles.usageText}>{disk.used} / {disk.total}</span>
                </div>
                <div className={styles.diskBar}><div style={{ width: disk.percentage }} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
};

export default SideBar;