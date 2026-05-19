const { contextBridge, ipcRenderer } = require('electron')

// ── Exposición segura de la API al Renderer (Skill_ElectronVite) ──────────
contextBridge.exposeInMainWorld('api', {
  // Controles de ventana
  ventana: {
    minimizar: () => ipcRenderer.invoke('ventana:minimizar'),
    maximizar: () => ipcRenderer.invoke('ventana:maximizar'),
    cerrar:    () => ipcRenderer.invoke('ventana:cerrar'),
  },

  // Diálogos del sistema
  dialogo: {
    abrirVideo: () => ipcRenderer.invoke('dialogo:abrirVideo'),
  },

  // Video: cargar desde ruta absoluta (solo Electron)
  video: {
    cargarDesdeRuta: (ruta) => ipcRenderer.invoke('video:cargarDesdeRuta', ruta),
  },

  // Auto-updater
  actualizacion: {
    instalar:     () => ipcRenderer.invoke('actualizacion:instalar'),
    onDisponible: (cb) => ipcRenderer.on('actualizacion:disponible', cb),
    onLista:      (cb) => ipcRenderer.on('actualizacion:lista', cb),
  },

  // ── Auth: Google OAuth via navegador del sistema ────────────────────
  auth: {
    // Abre la URL en el navegador predeterminado del sistema (Chrome/Edge)
    abrirEnNavegador: (url) => ipcRenderer.invoke('auth:abrirEnNavegador', url),
    // Escucha el token que llega desde daneri-app://auth?token=...
    onTokenRecibido:  (cb) => {
      const handler = (_, token) => cb(token)
      ipcRenderer.on('auth:token-recibido', handler)
      // Devuelve función para limpiar el listener
      return () => ipcRenderer.removeListener('auth:token-recibido', handler)
    },
  },
})

