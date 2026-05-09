const { contextBridge, ipcRenderer } = require('electron');

// Exponemos una API segura al Renderer Process (Nuestra UI de HTML/JS)
// Con contextIsolation activado, esta es la ÚNICA forma en que la web puede hablar con Node.js
contextBridge.exposeInMainWorld('launcherAPI', {
    // Solicita un inicio de sesión
    login: (email, password) => ipcRenderer.invoke('api:login', email, password),
    
    // Solicita un registro
    register: (username, email, password) => ipcRenderer.invoke('api:register', username, email, password),
    
    // Comprueba si ya estamos logueados leyendo el store encriptado
    getSessionStatus: () => ipcRenderer.invoke('api:getSessionStatus'),
    
    // Cierra sesión
    logout: () => ipcRenderer.invoke('api:logout'),

    // ==========================================
    // API de Biblioteca de Juegos
    // ==========================================
    getPublicGames: () => ipcRenderer.invoke('api:getPublicGames'),
    searchGame: (name) => ipcRenderer.invoke('api:searchGame', name),
    getLatestDescription: (gameId) => ipcRenderer.invoke('api:getLatestDescription', gameId),
    downloadLatestGame: (gameId) => ipcRenderer.invoke('api:downloadLatestGame', gameId),
    
    // Escuchar el progreso de descarga desde Node.js al frontend
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data))
});
