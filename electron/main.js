const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron')
app.name = 'equipo-daneri-plataforma'
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs   = require('fs')
const url  = require('url')
const http = require('http')
const { startMcpServer } = require('./mcp-server')

// Puerto dinámico para el servidor local (Firebase auth requiere http://localhost)
let localServerPort = 0
let localServer = null

// Registrar daneri-file como esquema privilegiado para habilitar streaming y fetch
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'daneri-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
])

function getAbsolutePathFromDaneriUrl(requestUrl) {
  try {
    const parsed = new url.URL(requestUrl)
    let decodedPath = decodeURIComponent(parsed.pathname)
    if (parsed.host && parsed.host.length === 1) {
      return parsed.host + ':' + decodedPath
    }
    if (decodedPath.startsWith('/')) {
      if (/^\/[a-zA-Z]:/.test(decodedPath)) {
        decodedPath = decodedPath.substring(1)
      }
    }
    return decodedPath
  } catch (e) {
    return decodeURIComponent(requestUrl.replace('daneri-file:///', '').replace('daneri-file://', ''))
  }
}

// ── Protocolo Custom OAuth (Skill_FirebaseAuth_Desktop) ───────────────────
// Registra daneri-app:// como handler del OS para capturar el redirect de Google
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('daneri-app', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('daneri-app')
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

// ── Servidor HTTP local para producción (necesario para Firebase Auth Google) ──
// signInWithPopup requiere que el origen sea http://localhost (no file://).
// Firebase tiene localhost en sus dominios autorizados por defecto.
function iniciarServidorLocal() {
  return new Promise((resolve, reject) => {
    if (isDev) { resolve(5173); return; }
    
    try {
      const distPath = path.join(__dirname, '../dist')
      
      localServer = http.createServer((req, res) => {
        // Ignorar queries y obtener la ruta del archivo
        const parsedUrl = url.parse(req.url)
        let filePath = path.join(distPath, parsedUrl.pathname)
        
        // Si la ruta es un directorio, servir index.html
        try {
          if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html')
          }
        } catch (e) {
          // Si falla, seguimos con la ruta original
        }
        
        // Si el archivo no existe, fallback a index.html (SPA para React Router)
        if (!fs.existsSync(filePath)) {
          filePath = path.join(distPath, 'index.html')
        }
        
        // Determinar Content-Type correcto
        const ext = path.extname(filePath).toLowerCase()
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.wav': 'audio/wav',
          '.mp4': 'video/mp4',
          '.woff': 'application/font-woff',
          '.ttf': 'application/font-ttf',
          '.eot': 'application/vnd.ms-fontobject',
          '.otf': 'application/font-otf',
          '.wasm': 'application/wasm'
        }
        
        const contentType = mimeTypes[ext] || 'application/octet-stream'
        
        fs.readFile(filePath, (error, content) => {
          if (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            res.end('Error interno: ' + error.code)
          } else {
            res.writeHead(200, { 
              'Content-Type': contentType,
              'Cache-Control': 'no-store, no-cache, must-revalidate, private',
              'Access-Control-Allow-Origin': '*'
            })
            res.end(content, 'utf-8')
          }
        })
      })
      
      // ✅ Usar un puerto fijo (18080) para que el origen http://127.0.0.1:puerto sea constante.
      // Si el puerto cambia en cada reinicio (puerto 0), IndexedDB y LocalStorage
      // se aíslan por origen y se pierden los datos y la sesión del usuario.
      const basePort = 18080
      function intentarEscuchar(port) {
        localServer.removeAllListeners('error')
        
        localServer.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`[Server] Puerto ${port} ocupado, intentando con ${port + 1}...`)
            intentarEscuchar(port + 1)
          } else {
            console.error('[Server] Error en servidor nativo:', err)
            resolve(0)
          }
        })
        
        localServer.listen(port, '127.0.0.1', () => {
          localServerPort = port
          console.log(`[Server] Servidor nativo corriendo en http://127.0.0.1:${localServerPort}`)
          resolve(localServerPort)
        })
      }
      
      intentarEscuchar(basePort)
    } catch (e) {
      console.error('[Server] Error iniciando servidor local:', e)
      resolve(0) // fallback a file://
    }
  })
}

function crearVentana() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    frame: false,          // Frame custom (sin chrome de Windows)
    backgroundColor: '#141414',
    icon: path.join(__dirname, '../public/assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // OBLIGATORIO — Skill_ElectronVite
      nodeIntegration: false,    // OBLIGATORIO — Skill_ElectronVite
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else if (localServerPort > 0) {
    // ✅ Cargar desde la IP de loopback local para asegurar compatibilidad de Firebase Auth
    mainWindow.loadURL(`http://127.0.0.1:${localServerPort}`)
  } else {
    // Fallback a file:// si el servidor no pudo iniciar
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // ✅ Habilitar F12 para abrir las Herramientas de Desarrollo (DevTools) en cualquier entorno
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  // ── Permitir que Firebase abra su ventana OAuth de Google ─────────────────
  // signInWithPopup abre una ventana nueva; Electron debe permitirlo.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const esAuthGoogle =
      url === 'about:blank' ||
      url === '' ||
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com/__/auth') ||
      url.includes('google.com/o/oauth2') ||
      url.includes('daneri-boxing-analytics.firebaseapp.com')

    if (esAuthGoogle) {
      // Abrimos como ventana emergente real de Electron
      // sandbox: false es necesario para que Firebase pueda completar el flujo OAuth
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          resizable: true,
          minimizable: false,
          maximizable: false,
          title: 'Iniciar sesión con Google — Equipo Daneri',
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
          },
        },
      }
    }

    // Cualquier otro enlace externo → abrir en el navegador del sistema
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  // Iniciar Servidor MCP
  startMcpServer(4040, ipcMain).catch(err => {
    console.error("[MCP] Failed to start MCP Server:", err);
  });

  // ── CSP permisiva para Firebase Auth en producción ────────────────────────
  const { session } = require('electron')
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://127.0.0.1:* http://localhost:* 'unsafe-inline' 'unsafe-eval'; " +
          "script-src 'self' http://127.0.0.1:* http://localhost:* 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.googleapis.com; " +
          "style-src 'self' http://127.0.0.1:* http://localhost:* 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "font-src 'self' data: https://fonts.gstatic.com; " +
          "img-src 'self' data: blob: https: file: http://127.0.0.1:* http://localhost:*; " +
          "media-src 'self' blob: data: file: daneri-file: http://127.0.0.1:* http://localhost:*; " +
          "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://localhost:* ws://127.0.0.1:* https://*.googleapis.com https://*.google.com https://*.firebaseapp.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.google.com daneri-file:; " +
          "frame-src 'self' http://127.0.0.1:* http://localhost:* https://*.firebaseapp.com https://*.google.com https://accounts.google.com; " +
          "worker-src 'self' blob: http://127.0.0.1:* http://localhost:*;"
        ]
      }
    })
  })


  // 🔹 Protocolo personalizado para servir videos locales 🔹
  protocol.registerFileProtocol('daneri-file', (request, callback) => {
    try {
      const filePath = getAbsolutePathFromDaneriUrl(request.url)
      callback({ path: filePath })
    } catch (e) {
      console.error('[Protocol] Error cargando archivo local:', e)
      callback({ error: -2 }) // net::ERR_FAILED
    }
  })

  // ── Iniciar servidor HTTP local ANTES de crear la ventana ─────────────────
  const port = await iniciarServidorLocal()
  localServerPort = port

  crearVentana()

  // Auto-updater solo en producción
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })

  // ── Windows: capturar daneri-app:// desde argv al inicio ───────────────
  // Cuando el protocolo abre la app en Windows, el token viene en process.argv
  const argvUrl = process.argv.find(a => a.startsWith('daneri-app://'))
  if (argvUrl) procesarUrlAuth(argvUrl)
})


// ── Capturar protocolo en Mac/Linux (open-url) ─────────────────────────────
app.on('open-url', (event, urlStr) => {
  event.preventDefault()
  procesarUrlAuth(urlStr)
})

// ── Capturar protocolo en Windows (segunda instancia) ──────────────────────
const lockObtenido = app.requestSingleInstanceLock()
if (!lockObtenido) {
  app.quit()
} else {
  app.on('second-instance', (event, argv) => {
    const urlArg = argv.find(a => a.startsWith('daneri-app://'))
    if (urlArg) procesarUrlAuth(urlArg)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ── Procesar la URL de retorno de Google OAuth ─────────────────────────────
function procesarUrlAuth(urlStr) {
  // daneri-app://auth?token=CUSTOM_TOKEN
  try {
    const parsed = new URL(urlStr)
    const token = parsed.searchParams.get('token')
    if (token && mainWindow) {
      mainWindow.webContents.send('auth:token-recibido', token)
    }
  } catch(e) {
    console.error('[Auth] Error procesando URL:', e.message)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Auth — Abrir navegador del sistema ────────────────────────────────
ipcMain.handle('auth:abrirEnNavegador', (_, urlStr) => {
  shell.openExternal(urlStr)
})

// ── IPC: Registrar log de errores local (Antigravity Bridge) ───────────────
ipcMain.handle('errores:guardarLog', async (_, errorLog) => {
  try {
    const logsPath = path.join(app.getPath('userData'), 'logs_errores.json')
    let logsArray = []
    if (fs.existsSync(logsPath)) {
      const fileData = fs.readFileSync(logsPath, 'utf-8')
      try {
        logsArray = JSON.parse(fileData)
      } catch (pe) {
        logsArray = []
      }
    }
    logsArray.push({
      ...errorLog,
      fechaStr: new Date().toISOString()
    })
    if (logsArray.length > 50) logsArray.shift()
    fs.writeFileSync(logsPath, JSON.stringify(logsArray, null, 2), 'utf-8')
    return { ok: true }
  } catch (e) {
    console.error('[Electron] Error guardando log local:', e.message)
    return { ok: false, error: e.message }
  }
})

// ── IPC: Controles de ventana ──────────────────────────────────────────────
ipcMain.handle('ventana:minimizar', () => mainWindow.minimize())
ipcMain.handle('ventana:maximizar', () => {
  mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize()
})
ipcMain.handle('ventana:cerrar', () => mainWindow.close())
ipcMain.handle('app:getVersion', () => app.getVersion())

// ── IPC: Auto-updater ──────────────────────────────────────────────────────
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for update...')
})
autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Update available:', info?.version)
  mainWindow?.webContents.send('actualizacion:disponible', info)
})
autoUpdater.on('update-not-available', (info) => {
  console.log('[AutoUpdater] Update not available.')
  mainWindow?.webContents.send('actualizacion:no-disponible')
})
autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] Error:', err?.message)
  mainWindow?.webContents.send('actualizacion:error', err?.message || 'Error de conexión')
})
autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('actualizacion:progreso', {
    porcentaje: progressObj.percent,
    transferido: progressObj.transferred,
    total: progressObj.total,
    velocidad: progressObj.bytesPerSecond
  })
})
autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdater] Update downloaded:', info?.version)
  mainWindow?.webContents.send('actualizacion:lista', info)
})

ipcMain.handle('actualizacion:instalar', () => {
  autoUpdater.quitAndInstall()
})
ipcMain.handle('actualizacion:buscar', async () => {
  try {
    const res = await autoUpdater.checkForUpdates()
    return { ok: true, updateInfo: res?.updateInfo }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── IPC: Abrir archivo de video (diálogo del sistema) ────────────────────
const { dialog } = require('electron')
ipcMain.handle('dialogo:abrirVideo', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar Video de Análisis',
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
    ],
    properties: ['openFile'],
  })
  if (canceled) return null
  return filePaths[0]
})

// ── IPC: Cargar video desde ruta absoluta ────────────────────────────────
ipcMain.handle('video:cargarDesdeRuta', async (event, rutaAbsoluta) => {
  try {
    if (!fs.existsSync(rutaAbsoluta)) {
      return { ok: false, error: `Archivo no encontrado: ${rutaAbsoluta}` }
    }
    const stats = fs.statSync(rutaAbsoluta)
    // Convertir ruta Windows a URL daneri-file://
    const rutaUrl = 'daneri-file:///' + rutaAbsoluta.replace(/\\/g, '/')
    return {
      ok:     true,
      url:    rutaUrl,
      nombre: path.basename(rutaAbsoluta),
      tamano: stats.size,
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── IPC: Guardar Respaldo Automático en Documents ───────────────────────────
ipcMain.handle('backup:guardar', async (_, { filename, dataString }) => {
  try {
    const backupDir = path.join(app.getPath('documents'), 'EquipoDaneriBackups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    const backupPath = path.join(backupDir, filename)
    fs.writeFileSync(backupPath, dataString, 'utf-8')
    return { ok: true, path: backupPath }
  } catch (e) {
    console.error('[Electron] Error guardando backup automático:', e.message)
    return { ok: false, error: e.message }
  }
})

// ── IPC: Leer Respaldo Automático de Datos ─────────────────────────────────
ipcMain.handle('backup:leer', async () => {
  try {
    const backupPath = path.join(app.getPath('documents'), 'EquipoDaneriBackups', 'backup_automatico_daneri.json')
    if (fs.existsSync(backupPath)) {
      const dataString = fs.readFileSync(backupPath, 'utf-8')
      return { ok: true, data: JSON.parse(dataString) }
    }
    return { ok: false, error: 'No existe archivo de respaldo' }
  } catch (e) {
    console.error('[Electron] Error leyendo backup automático:', e.message)
    return { ok: false, error: e.message }
  }
})

// ── IPC: Abrir Visor de Video Desacoplado (segunda ventana) ─────────────────────
let videoViewerWindow = null

ipcMain.handle('video:abrirVisorDetachado', async () => {
  // Si ya existe la ventana, simplemente la muestra
  if (videoViewerWindow && !videoViewerWindow.isDestroyed()) {
    videoViewerWindow.show()
    videoViewerWindow.focus()
    return { ok: true, alreadyOpen: true }
  }

  videoViewerWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    title: 'Equipo Daneri — Visor de Video',
    backgroundColor: '#00000000', // Transparente para que tome el del HTML
    transparent: true,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const viewerPath = isDev
    ? path.join(__dirname, '../public/video-viewer.html')
    : path.join(__dirname, '../dist/video-viewer.html')

  videoViewerWindow.loadFile(viewerPath)

  videoViewerWindow.on('closed', () => {
    videoViewerWindow = null
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('video:visor-cerrado')
    }
  })

  return { ok: true, alreadyOpen: false }
})

ipcMain.handle('video:cerrarVisorDetachado', async () => {
  if (videoViewerWindow && !videoViewerWindow.isDestroyed()) {
    videoViewerWindow.close()
  }
  return { ok: true }
})

// ── IPC: Sincronización del Visor (Evita problemas de origen cruzado de BroadcastChannel) ──
ipcMain.on('video:sync-enviar', (event, data) => {
  if (videoViewerWindow && !videoViewerWindow.isDestroyed()) {
    videoViewerWindow.webContents.send('video:sync-recibir', data)
  }
})

ipcMain.on('video:sync-enviar-desde-viewer', (event, data) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('video:sync-recibir-desde-viewer', data)
  }
})
