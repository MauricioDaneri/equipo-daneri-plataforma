const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs   = require('fs')
const url  = require('url')

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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  // ── Protocolo personalizado para servir videos locales ─────────────────
  protocol.handle('daneri-file', (request) => {
    const rutaRaw = request.url.replace('daneri-file:///', '').replace('daneri-file://', '')
    const rutaDecoded = decodeURIComponent(rutaRaw)
    const rutaFinal = rutaDecoded.startsWith('/') ? rutaDecoded : '/' + rutaDecoded
    return net.fetch('file://' + rutaFinal)
  })

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

// ── IPC: Controles de ventana ──────────────────────────────────────────────
ipcMain.handle('ventana:minimizar', () => mainWindow.minimize())
ipcMain.handle('ventana:maximizar', () => {
  mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize()
})
ipcMain.handle('ventana:cerrar', () => mainWindow.close())

// ── IPC: Auto-updater ──────────────────────────────────────────────────────
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('actualizacion:disponible')
})
autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('actualizacion:lista')
})
ipcMain.handle('actualizacion:instalar', () => {
  autoUpdater.quitAndInstall()
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
