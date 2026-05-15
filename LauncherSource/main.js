const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pipeline } = require('stream/promises');

let store;

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#0a0a0a', // Prevents white flicker on load
        webPreferences: {
            nodeIntegration: false, // IMPORTANT FOR SECURITY
            contextIsolation: true, // IMPORTANT FOR SECURITY
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('public/index.html');
}

app.whenReady().then(async () => {
    const { default: Store } = await import('electron-store');

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


const API_URL = 'https://localhost:7045'; // Backend URL (see launchSettings.json)

ipcMain.handle('api:register', async (event, username, email, password) => {
    console.log(`Attempting registration for: ${email}`);

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
            }
            return { success: true, email: email };
        } else {
            const errorText = await response.text();
            return { success: false, error: errorText || 'Registration failed' };
        }
    } catch (err) {
        console.error(err);
        return { success: false, error: 'Could not connect to the server' };
    }
});

ipcMain.handle('api:login', async (event, email, password) => {
    console.log(`Attempting login for: ${email}`);

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
            return { success: true, email: email };
        } else {
            const errorText = await response.text();
            return { success: false, error: errorText || 'Invalid credentials' };
        }
    } catch (err) {
        console.error(err);
        return { success: false, error: 'Could not connect to the server (is it running?)' };
    }
});

ipcMain.handle('api:getSessionStatus', async () => {
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
            console.log("Player session refreshed.");
            return { success: true };
        } else {
            console.log("Session expired, clearing tokens...");
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
                headers: { 'refresh_token': token }
            });
        } catch (err) {
            console.error("Error disconnecting from backend:", err);
        }
    }

    store.delete('auth.accessToken');
    store.delete('auth.refreshToken');
    store.delete('auth.email');
    return { success: true };
});


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
        return { success: false, error: 'Connection error.' };
    }
});

ipcMain.handle('api:getMyLibrary', async () => {
    try {
        const response = await fetch(`${API_URL}/Me`, { headers: getAuthHeaders() });
        if (response.ok) return { success: true, games: await response.json() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Connection error.' };
    }
});

ipcMain.handle('api:buyGame', async (event, gameId) => {
    try {
        const response = await fetch(`${API_URL}/Me`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(gameId) // Send the GUID directly
        });
        if (response.ok) return { success: true };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Connection error.' };
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
        return { success: false, error: 'Connection error.' };
    }
});

ipcMain.handle('api:getLatestDescription', async (event, gameId) => {
    try {
        const response = await fetch(`${API_URL}/games/${gameId}/latest/description`, { headers: getAuthHeaders() });
        if (response.ok) return { success: true, description: await response.text() };
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Connection error.' };
    }
});

ipcMain.handle('api:downloadLatestGame', async (event, gameId) => {
    try {
        event.sender.send('download-progress', { status: 'starting', percent: 0 });

        const response = await fetch(`${API_URL}/games/${gameId}/latest/download`, { headers: getAuthHeaders() });

        if (!response.ok) {
            return { success: false, error: await response.text() };
        }

        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${gameId}-latest.zip`;

        if (contentDisposition) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/[\"']/g, '').split(';')[0].trim();
            }
        }

        const downloadDir = path.join(os.homedir(), 'LauncherGames');
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        const finalPath = path.join(downloadDir, filename);
        const totalBytes = Number(response.headers.get('content-length')) || 0;
        let downloadedBytes = 0;

        const fileStream = fs.createWriteStream(finalPath);

        const { Transform } = require('stream');
        let lastPercent = 0;
        const progressStream = new Transform({
            transform(chunk, encoding, callback) {
                downloadedBytes += chunk.length;
                if (totalBytes > 0) {
                    const percent = Math.round((downloadedBytes / totalBytes) * 100);
                    if (percent !== lastPercent) {
                        lastPercent = percent;
                        event.sender.send('download-progress', { status: 'downloading', percent, downloadedBytes, totalBytes });
                    }
                }
                callback(null, chunk);
            }
        });

        const { Readable } = require('stream');
        let nodeReadable;

        try {
            nodeReadable = Readable.fromWeb(response.body);
        } catch (e) {
            nodeReadable = response.body;
        }

        await pipeline(nodeReadable, progressStream, fileStream);

        try {
            event.sender.send('download-progress', { status: 'extracting', percent: 100 });
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(finalPath);

            const extractPath = path.join(downloadDir, gameId);
            if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });

            zip.extractAllTo(extractPath, true);
            console.log(`Game extracted to: ${extractPath}`);

            fs.unlinkSync(finalPath);

            event.sender.send('download-progress', { status: 'completed', percent: 100, path: extractPath });
            return { success: true, path: extractPath };
        } catch (unzipErr) {
            console.error("Extraction error:", unzipErr);
            return { success: false, error: 'Download complete, but extraction failed.' };
        }

    } catch (err) {
        console.error("Download error:", err);
        event.sender.send('download-progress', { status: 'error', message: err.message });
        return { success: false, error: 'Download error: ' + err.message };
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

ipcMain.handle('api:createCheckoutSession', async (event, gameId) => {
    try {
        const response = await fetch(`${API_URL}/Stripe/create-checkout-session`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(gameId)
        });
        if (response.ok) return await response.json();
        return { success: false, error: await response.text() };
    } catch (err) {
        return { success: false, error: 'Connection error with the payment gateway.' };
    }
});

ipcMain.handle('api:openExternalLink', async (event, url) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
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
            return { success: false, error: `Executable not found: ${exeName}` };
        }

        console.log(`Launching game: ${exePath}`);

        const gameProcess = spawn(exePath, [], {
            cwd: gameFolder, // Important so the game can find its assets
            detached: true,
            stdio: 'ignore'
        });

        gameProcess.unref(); // Allow the launcher to stay open after the game closes

        return { success: true };
    } catch (err) {
        console.error("Error launching game:", err);
        return { success: false, error: err.message };
    }
});
