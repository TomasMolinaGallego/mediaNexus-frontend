import React, { useState, useEffect } from 'react';
import styles from './ConfigurationPanel.module.css';

/**
 * ConfigurationPanel
 * Permite al usuario definir las rutas de carpetas y ejecutables
 * sin necesidad de modificar el código fuente.
 */
const ConfigurationPanel = () => {
    const [config, setConfig] = useState({
        diskPaths: [{ id: 1, path: '', label: 'HDD_01' }],
        vlcPath: '',
        apiPort: 3001
    });
    const [status, setStatus] = useState({ message: '', type: '' });

    // Cargar configuración inicial al montar
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/config`);
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            } catch (err) {
                console.error("Error cargando configuración", err);
            }
        };
        fetchConfig();
    }, []);

    const handlePathChange = (index, value) => {
        const newPaths = [...config.diskPaths];
        newPaths[index].path = value;
        setConfig({ ...config, diskPaths: newPaths });
    };

    const addDisk = () => {
        const newId = config.diskPaths.length + 1;
        setConfig({
            ...config,
            diskPaths: [...config.diskPaths, { id: newId, path: '', label: `HDD_0${newId}` }]
        });
    };

    const handleSave = async () => {
        setStatus({ message: 'Guardando...', type: 'info' });
        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setStatus({ message: 'Configuración guardada correctamente.', type: 'success' });
            } else {
                throw new Error();
            }
        } catch (err) {
            setStatus({ message: 'Error al conectar con el servidor.', type: 'error' });
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>CENTRAL_CONFIG_V2</h2>
                <span className={styles.subtitle}>Configuración de rutas y periféricos</span>
            </header>

            <section className={styles.section}>
                <label className={styles.label}>RUTAS DE ALMACENAMIENTO (DISCOS)</label>
                {config.diskPaths.map((disk, index) => (
                    <div key={disk.id} className={styles.inputGroup}>
                        <span className={styles.inputPrefix}>{disk.label}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={disk.path}
                            placeholder="Ejem: D:/Media/Series"
                            onChange={(e) => handlePathChange(index, e.target.value)}
                        />
                    </div>
                ))}
                <button className={styles.addButton} onClick={addDisk}>+ AÑADIR DISCO</button>
            </section>

            <section className={styles.section}>
                <label className={styles.label}>EJECUTABLE VLC (PATH)</label>
                <input
                    type="text"
                    className={styles.input}
                    value={config.vlcPath}
                    placeholder="C:/Program Files/VideoLAN/VLC/vlc.exe"
                    onChange={(e) => setConfig({ ...config, vlcPath: e.target.value })}
                />
            </section>

            <footer className={styles.footer}>
                {status.message && (
                    <div className={`${styles.status} ${styles[status.type]}`}>
                        {status.message}
                    </div>
                )}
                <button className={styles.saveButton} onClick={handleSave}>
                    APLICAR CAMBIOS_
                </button>
            </footer>
        </div>
    );
};

export default ConfigurationPanel;