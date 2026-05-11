const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('devAPI', {
    // Auth
    login: (email, password) => ipcRenderer.invoke('api:login', email, password),
    getEmail: () => ipcRenderer.invoke('auth:get-email'),
    logout: () => ipcRenderer.invoke('auth:logout'),

    // Developer actions
    createTeam: (teamName) => ipcRenderer.invoke('api:create-team', teamName),
    createGame: (teamId, gameData) => ipcRenderer.invoke('api:create-game', teamId, gameData),
    uploadGame: (payload) => ipcRenderer.invoke('api:upload-game', payload),
    
    // Utils
    openFile: () => ipcRenderer.invoke('dialog:open-file')
});
