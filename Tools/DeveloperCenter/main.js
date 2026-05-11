const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Fix para electron-store en CommonJS
let store;
(async () => {
    const Store = (await import('electron-store')).default;
    store = new Store();
})();

// Desactivar validación de certificados para desarrollo (Localhost)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        backgroundColor: '#0f111a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f111a',
            symbolColor: '#ffffff'
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const API_URL = 'https://localhost:7045';

// --- Auth Handlers (Reutilizados del Launcher) ---
ipcMain.handle('api:login', async (event, email, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email, Password: password })
        });

        if (response.ok) {
            const data = await response.json();
            store.set('auth.accessToken', data.accessToken);
            store.set('auth.refreshToken', data.refreshToken);
            store.set('auth.email', email);
            return { success: true, email };
        }
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// --- Developer Center Handlers ---

ipcMain.handle('api:create-team', async (event, teamName) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/createteam`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ TeamName: teamName })
        });
        return { success: response.ok, message: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:create-game', async (event, teamId, gameData) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/creategame?TeamId=${teamId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(gameData)
        });
        return { success: response.ok, message: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:upload-game', async (event, { teamId, gameId, filePath, description }) => {
    const token = store.get('auth.accessToken');
    const fs = require('fs');
    const FormData = require('form-data'); // Necesitarás instalar esto: npm install form-data

    try {
        const formData = new FormData();
        formData.append('TeamId', teamId);
        formData.append('Gameid', gameId);
        formData.append('versionDescription', description);
        formData.append('gameFile', fs.createReadStream(filePath));

        const response = await fetch(`${API_URL}/Programer/uploadgame`, {
            method: 'POST',
            headers: { 
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        return { success: response.ok, data: await response.json() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Selector de archivos para la subida
ipcMain.handle('dialog:open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Zip Files', extensions: ['zip'] }]
    });
    if (!canceled) return filePaths[0];
});

ipcMain.handle('auth:get-email', () => store.get('auth.email'));
ipcMain.handle('auth:logout', () => store.clear());
