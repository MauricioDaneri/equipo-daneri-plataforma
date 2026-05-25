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
    abrirVisorDetachado: () => ipcRenderer.invoke('video:abrirVisorDetachado'),
    cerrarVisorDetachado: () => ipcRenderer.invoke('video:cerrarVisorDetachado'),
    // Métodos de sincronización del visor por IPC (evita problemas de origen cruzado de BroadcastChannel)
    enviarMensajeSync: (msg) => ipcRenderer.send('video:sync-enviar', msg),
    onMensajeSync: (cb) => {
      const handler = (_, msg) => cb(msg)
      ipcRenderer.on('video:sync-recibir', handler)
      return () => ipcRenderer.removeListener('video:sync-recibir', handler)
    },
    enviarMensajeDesdeViewer: (msg) => ipcRenderer.send('video:sync-enviar-desde-viewer', msg),
    onMensajeDesdeViewer: (cb) => {
      const handler = (_, msg) => cb(msg)
      ipcRenderer.on('video:sync-recibir-desde-viewer', handler)
      return () => ipcRenderer.removeListener('video:sync-recibir-desde-viewer', handler)
    },
    onVisorCerrado: (cb) => {
      const handler = () => cb()
      ipcRenderer.on('video:visor-cerrado', handler)
      return () => ipcRenderer.removeListener('video:visor-cerrado', handler)
    }
  },

  // Auto-updater
  actualizacion: {
    instalar:     () => ipcRenderer.invoke('actualizacion:instalar'),
    buscar:       () => ipcRenderer.invoke('actualizacion:buscar'),
    onDisponible: (cb) => {
      const handler = (_, info) => cb(info)
      ipcRenderer.on('actualizacion:disponible', handler)
      return () => ipcRenderer.removeListener('actualizacion:disponible', handler)
    },
    onNoDisponible: (cb) => {
      const handler = () => cb()
      ipcRenderer.on('actualizacion:no-disponible', handler)
      return () => ipcRenderer.removeListener('actualizacion:no-disponible', handler)
    },
    onError: (cb) => {
      const handler = (_, msg) => cb(msg)
      ipcRenderer.on('actualizacion:error', handler)
      return () => ipcRenderer.removeListener('actualizacion:error', handler)
    },
    onProgreso: (cb) => {
      const handler = (_, datos) => cb(datos)
      ipcRenderer.on('actualizacion:progreso', handler)
      return () => ipcRenderer.removeListener('actualizacion:progreso', handler)
    },
    onLista:      (cb) => {
      const handler = (_, info) => cb(info)
      ipcRenderer.on('actualizacion:lista', handler)
      return () => ipcRenderer.removeListener('actualizacion:lista', handler)
    },
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

  // ── Registro de Errores local (Puente con Antigravity) ───────────────
  errores: {
    guardarLog: (errorLog) => ipcRenderer.invoke('errores:guardarLog', errorLog),
  },

  backup: {
    guardar: (filename, dataString) => ipcRenderer.invoke('backup:guardar', { filename, dataString }),
    leer: () => ipcRenderer.invoke('backup:leer'),
  },
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
})

