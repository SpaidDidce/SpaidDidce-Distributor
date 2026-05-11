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

ipcMain.handle('auth:refresh-session', async () => {
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
            console.log("Sesión renovada automáticamente.");
            return { success: true };
        } else {
            console.log("Sesión expirada, limiando credenciales.");
            store.clear();
            return { success: false };
        }
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

ipcMain.handle('api:upload-game', async (event, { teamId, gameId, version, filePath, description }) => {
    const token = store.get('auth.accessToken');
    const fs = require('fs');
    const FormData = require('form-data');
    const axios = require('axios');

    try {
        const formData = new FormData();
        formData.append('gameFile', fs.createReadStream(filePath));

        const queryParams = new URLSearchParams({
            TeamId: teamId,
            Gameid: gameId,
            version: version,
            versionDescription: description
        });

        const url = `${API_URL}/Programer/uploadgame?${queryParams.toString()}`;

        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return { success: true, data: response.data };
    } catch (err) {
        console.error("Error en upload-game (Axios):", err.message);
        if (err.response) {
            // El servidor respondió con un error (400, 500, etc)
            const errorMsg = typeof err.response.data === 'string' 
                ? err.response.data 
                : JSON.stringify(err.response.data);
            return { success: false, error: errorMsg };
        }
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

ipcMain.handle('api:get-teams', async (event) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/getteam`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return { success: true, data: await response.json() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:change-team-name', async (event, teamId, newName) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/changeteamname?TeamId=${teamId}&NewName=${newName}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return { success: response.ok, message: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:add-player-to-team', async (event, teamId, playerId) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/addplayertoteam?TeamId=${teamId}&NewPlayerId=${playerId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return { success: response.ok, message: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:delete-team', async (event, teamId) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/deleteteam?TeamId=${teamId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            return { success: true, message: await response.text() };
        }
        
        const errorText = await response.text();
        console.log(`Error en Backend (Status ${response.status}): ${errorText}`);
        return { success: false, error: errorText || `Error ${response.status}` };
    } catch (err) {
        console.error(`Error de red: ${err.message}`);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:public-game', async (event, teamId, gameId) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/publicgame?TeamId=${teamId}`, {
            method: 'POST', // Cambiado a POST
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ GameId: gameId })
        });
        return { success: response.ok, message: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:get-games-for-team', async (event, teamId) => {
    const token = store.get('auth.accessToken');
    try {
        const response = await fetch(`${API_URL}/Programer/getgamesfromteam?TeamId=${teamId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return { success: true, data: await response.json() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('auth:get-email', () => store.get('auth.email'));
ipcMain.handle('auth:logout', () => store.clear());
