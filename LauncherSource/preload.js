const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
    login: (email, password) => ipcRenderer.invoke('api:login', email, password),
    
    register: (username, email, password) => ipcRenderer.invoke('api:register', username, email, password),
    
    getSessionStatus: () => ipcRenderer.invoke('api:getSessionStatus'),

    refreshSession: () => ipcRenderer.invoke('api:refresh-session'),
    
    logout: () => ipcRenderer.invoke('api:logout'),

    getPublicGames: () => ipcRenderer.invoke('api:getPublicGames'),
    getMyLibrary: () => ipcRenderer.invoke('api:getMyLibrary'),
    buyGame: (gameId) => ipcRenderer.invoke('api:buyGame', gameId),
    searchGame: (name) => ipcRenderer.invoke('api:searchGame', name),
    getLatestDescription: (gameId) => ipcRenderer.invoke('api:getLatestDescription', gameId),
    downloadLatestGame: (gameId) => ipcRenderer.invoke('api:downloadLatestGame', gameId),
    launchGame: (gameId, exeName) => ipcRenderer.invoke('api:launchGame', { gameId, exeName }),
    checkIfGameDownloaded: (gameId) => ipcRenderer.invoke('api:checkIfGameDownloaded', gameId),
    checkIfGameOwned: (gameId) => ipcRenderer.invoke('api:checkIfGameOwned', gameId),
    createCheckoutSession: (gameId) => ipcRenderer.invoke('api:createCheckoutSession', gameId),
    openExternalLink: (url) => ipcRenderer.invoke('api:openExternalLink', url),
    
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data))
});
