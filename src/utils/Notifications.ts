import { toast, ExternalToast } from 'sonner';
import React from 'react';

const commonStyle = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-color)',
  border: '1px solid var(--border-main)',
  fontFamily: 'var(--font-family)',
  textTransform: 'uppercase',
  fontSize: '0.8rem',
  letterSpacing: '1px',
};

export const notify = {
  /**
   * Muestra un toast de carga persistente mientras se consulta la API.
   * @param query - El término de búsqueda para mostrar al usuario.
   */
  loading: (msg: string, id?: string): string | number => {
    return toast.loading(
      // Usamos React.createElement para evitar problemas de tipos en TS puro
      `${msg}`, 
      {
        id: id || 'search-toast',
        style: { 
          ...commonStyle, 
          borderLeft: '4px solid var(--accent)' 
        },
      }
    );
  },

  /**
   * Notificación de éxito (Reemplaza al de carga si comparten el mismo ID).
   */
  success: (msg, id?: string): string | number => {
    return toast.success(msg, {
      id: id || 'search-toast',
      style: { 
        ...commonStyle, 
        borderColor: '#22c55e' 
      },
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
    });
  },

    info: (msg, id?: string): string | number => {
    return toast.info(msg, {
      id: id || 'search-toast',
      style: { 
        ...commonStyle, 
        borderColor: '#22c55e' 
      },
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
    });
  },

  /**
   * Notificación de error o advertencia.
   */
  error: (msg, id?: string): string | number => {
    return toast.error(msg, {
      id: id || 'search-toast',
      style: { 
        ...commonStyle, 
        borderColor: 'var(--accent)' 
      },
    });
  },

  /**
   * Elimina cualquier notificación de búsqueda activa.
   */
  dismiss: (id?: string): void => {
    toast.dismiss(id || 'search-toast');
  }
};