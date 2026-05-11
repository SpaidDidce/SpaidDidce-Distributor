const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pipeline } = require('stream/promises');

// IGNORAR ERRORES DE CERTIFICADOS HTTPS PARA DESARROLLO LOCAL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Variable global para el store
let store;

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#0a0a0a', // Evita parpadeos blancos al cargar
        webPreferences: {
            nodeIntegration: false, // ¡IMPORTANTE PARA SEGURIDAD!
            contextIsolation: true, // ¡IMPORTANTE PARA SEGURIDAD!
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('public/index.html');
}

app.whenReady().then(async () => {
    // Importamos electron-store de forma asíncrona (requerido para versiones modernas ESM)
    const { default: Store } = await import('electron-store');

    // Inicializamos el almacenamiento seguro
    store = new Store({
        encryptionKey: 'mi-clave-secreta-super-segura-del-launcher'
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==========================================
// IPC HANDLERS: Comunicación Frontend <-> Backend Local
// ==========================================

const API_URL = 'https://localhost:7045'; // URL de tu Backend (revisado en launchSettings.json)

ipcMain.handle('api:register', async (event, username, email, password) => {
    console.log(`Intentando registro para: ${email}`);

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ UserName: username, Email: email, Password: password })
        });

        if (response.ok) {
            try {
                const data = await response.json();
                if (data.accessToken && data.refreshToken) {
                    store.set('auth.accessToken', data.accessToken);
                    store.set('auth.refreshToken', data.refreshToken);
                    store.set('auth.email', email);
                }
            } catch (e) {
                // Por si el backend no devuelve un JSON válido
            }
            return { success: true, email: email };
        } else {
            const errorText = await response.text();
            return { success: false, error: errorText || 'Error al registrarse' };
        }
    } catch (err) {
        console.error(err);
        return { success: false, error: 'No se pudo conectar con el servidor' };
    }
});

ipcMain.handle('api:login', async (event, email, password) => {
    console.log(`Intentando login real para: ${email}`);

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email, Password: password })
        });

        if (response.ok) {
            const data = await response.json();
            // Guardamos el token y el email localmente
            store.set('auth.accessToken', data.accessToken);
            store.set('auth.refreshToken', data.refreshToken);
            store.set('auth.email', email);
            return { success: true, email: email };
        } else {
            const errorText = await response.text();
            return { success: false, error: errorText || 'Credenciales incorrectas' };
        }
    } catch (err) {
        console.error(err);
        return { success: false, error: 'No se pudo conectar con el servidor (¿Está apagado?)' };
    }
});

ipcMain.handle('api:getSessionStatus', async () => {
    // Verificamos si tenemos un token guardado
    const refreshToken = store.get('auth.refreshToken');
    const email = store.get('auth.email');

    if (refreshToken && email) {
        return { loggedIn: true, email: email };
    }
    return { loggedIn: false };
});

ipcMain.handle('api:refresh-session', async () => {
    const refreshToken = store.get('auth.refreshToken');
    if (!refreshToken) return { success: false };

    try {
        const response = await fetch(`${API_URL}/Refresh/refresh`, {
            method: 'POST',
            headers: { 'refresh_token': refreshToken }
        });

        if (response.ok) {
            const data = await response.json();
            store.set('auth.accessToken', data.accessToken);
            store.set('auth.refreshToken', data.refreshToken);
            console.log("Sesión de jugador renovada.");
            return { success: true };
        } else {
            console.log("Sesión expirada, cerrando...");
            store.delete('auth.accessToken');
            store.delete('auth.refreshToken');
            store.delete('auth.email');
            return { success: false };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:logout', async () => {
    const token = store.get('auth.refreshToken');

    if (token) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'GET',
                // Tu AuthController espera el refresh_token en las cabeceras
                headers: { 'refresh_token': token }
            });
        } catch (err) {
            console.error("Error desconectando del backend:", err);
            // Ignoramos el error para forzar el cierre de sesión local de todos modos
        }
    }

    store.delete('auth.accessToken');
    store.delete('auth.refreshToken');
    store.delete('auth.email');
    return { success: true };
});

// ==========================================
// IPC HANDLERS: Biblioteca de Juegos
// ==========================================

function getAuthHeaders() {
    const token = store.get('auth.accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

ipcMain.handle('api:getPublicGames', async () => {
    try {
        const response = await fetch(`${API_URL}/games`, { headers: getAuthHeaders() });
        if (response.ok) return { success: true, games: await response.json() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Error de conexión.' };
    }
});

ipcMain.handle('api:getMyLibrary', async () => {
    try {
        const response = await fetch(`${API_URL}/Me`, { headers: getAuthHeaders() });
        if (response.ok) return { success: true, games: await response.json() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Error de conexión.' };
    }
});

ipcMain.handle('api:buyGame', async (event, gameId) => {
    try {
        const response = await fetch(`${API_URL}/Me`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(gameId) // Enviamos el GUID directamente
        });
        if (response.ok) return { success: true };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Error de conexión.' };
    }
});

ipcMain.handle('api:searchGame', async (event, name) => {
    try {
        const response = await fetch(`${API_URL}/games/searchbyname`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ gameName: name })
        });
        if (response.ok) return { success: true, games: await response.json() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Error de conexión.' };
    }
});

ipcMain.handle('api:getLatestDescription', async (event, gameId) => {
    try {
        const response = await fetch(`${API_URL}/games/${gameId}/latest/description`, { headers: getAuthHeaders() });
        if (response.ok) return { success: true, description: await response.text() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Error de conexión.' };
    }
});

ipcMain.handle('api:downloadLatestGame', async (event, gameId) => {
    try {
        // Enviar evento de inicio al renderer
        event.sender.send('download-progress', { status: 'starting', percent: 0 });

        const response = await fetch(`${API_URL}/games/${gameId}/latest/download`, { headers: getAuthHeaders() });

        if (!response.ok) {
            return { success: false, error: await response.text() };
        }

        // Obtener nombre del archivo de la cabecera (o genérico si no lo manda el backend)
        // Obtener nombre del archivo de la cabecera de forma más robusta
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${gameId}-latest.zip`;
        
        if (contentDisposition) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/["']/g, '').split(';')[0].trim();
            }
        }

        const downloadDir = path.join(os.homedir(), 'LauncherGames');
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        const finalPath = path.join(downloadDir, filename);
        const totalBytes = Number(response.headers.get('content-length')) || 0;
        let downloadedBytes = 0;

        const fileStream = fs.createWriteStream(finalPath);

        // Transform stream para calcular el progreso
        const { Transform } = require('stream');
        let lastPercent = 0;
        const progressStream = new Transform({
            transform(chunk, encoding, callback) {
                downloadedBytes += chunk.length;
                if (totalBytes > 0) {
                    const percent = Math.round((downloadedBytes / totalBytes) * 100);
                    // Enviamos progreso solo si cambia para no saturar el IPC
                    if (percent !== lastPercent) {
                        lastPercent = percent;
                        event.sender.send('download-progress', { status: 'downloading', percent, downloadedBytes, totalBytes });
                    }
                }
                callback(null, chunk);
            }
        });

        // Usar pipeline nativo de stream Web/Node compatible
        const { Readable } = require('stream');
        let nodeReadable;
        
        try {
            nodeReadable = Readable.fromWeb(response.body);
        } catch (e) {
            // Fallback para versiones de Node que no tengan fromWeb o tengan problemas
            nodeReadable = response.body; 
        }

        await pipeline(nodeReadable, progressStream, fileStream);

        // --- INICIO DE DESCOMPRESIÓN ---
        try {
            event.sender.send('download-progress', { status: 'extracting', percent: 100 });
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(finalPath);
            
            // Usamos el gameId para el nombre de la carpeta (estilo Steam)
            const extractPath = path.join(downloadDir, gameId);
            if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
            
            zip.extractAllTo(extractPath, true);
            console.log(`Juego extraído en: ${extractPath}`);
            
            // Borramos el ZIP original
            fs.unlinkSync(finalPath);

            event.sender.send('download-progress', { status: 'completed', percent: 100, path: extractPath });
            return { success: true, path: extractPath };
        } catch (unzipErr) {
            console.error("Error al descomprimir:", unzipErr);
            return { success: false, error: 'Descarga completa, pero falló la descompresión.' };
        }
        // --- FIN DE DESCOMPRESIÓN ---

    } catch (err) {
        console.error("Error en la descarga:", err);
        event.sender.send('download-progress', { status: 'error', message: err.message });
        return { success: false, error: 'Error durante la descarga: ' + err.message };
    }
});

ipcMain.handle('api:checkIfGameDownloaded', async (event, gameId) => {
    const os = require('os');
    const path = require('path');
    const downloadDir = path.join(os.homedir(), 'LauncherGames');
    const gameFolder = path.join(downloadDir, gameId);
    return fs.existsSync(gameFolder);
});

ipcMain.handle('api:checkIfGameOwned', async (event, gameId) => {
    try {
        const response = await fetch(`${API_URL}/Me/getifgameihaveit?GameId=${gameId}`, { headers: getAuthHeaders() });
        if (response.ok) return await response.json();
        return false;
    } catch (err) {
        return false;
    }
});

ipcMain.handle('api:launchGame', async (event, { gameId, exeName }) => {
    const { spawn } = require('child_process');
    const os = require('os');
    const path = require('path');
    
    try {
        const downloadDir = path.join(os.homedir(), 'LauncherGames');
        const gameFolder = path.join(downloadDir, gameId);
        const exePath = path.join(gameFolder, exeName);

        if (!fs.existsSync(exePath)) {
            return { success: false, error: `No se encuentra el ejecutable: ${exeName}` };
        }

        console.log(`Iniciando juego: ${exePath}`);
        
        const gameProcess = spawn(exePath, [], {
            cwd: gameFolder, // Importante para que el juego encuentre sus assets
            detached: true,
            stdio: 'ignore'
        });

        gameProcess.unref(); // Permite que el launcher siga vivo aunque el juego se cierre

        return { success: true };
    } catch (err) {
        console.error("Error al lanzar el juego:", err);
        return { success: false, error: err.message };
    }
});