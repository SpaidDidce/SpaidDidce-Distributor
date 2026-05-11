const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('devAPI', {
    // Auth
    login: (email, password) => ipcRenderer.invoke('api:login', email, password),
    refreshSession: () => ipcRenderer.invoke('auth:refresh-session'),
    getEmail: () => ipcRenderer.invoke('auth:get-email'),
    logout: () => ipcRenderer.invoke('auth:logout'),

    // Developer actions
    createTeam: (teamName) => ipcRenderer.invoke('api:create-team', teamName),
    getTeams: () => ipcRenderer.invoke('api:get-teams'),
    changeTeamName: (teamId, newName) => ipcRenderer.invoke('api:change-team-name', teamId, newName),
    addPlayerToTeam: (teamId, playerId) => ipcRenderer.invoke('api:add-player-to-team', teamId, playerId),
    createGame: (teamId, gameData) => ipcRenderer.invoke('api:create-game', teamId, gameData),
    getGamesForTeam: (teamId) => ipcRenderer.invoke('api:get-games-for-team', teamId),
    deleteTeam: (teamId) => ipcRenderer.invoke('api:delete-team', teamId),
    publicGame: (teamId, gameId) => ipcRenderer.invoke('api:public-game', teamId, gameId),
    uploadGame: (payload) => ipcRenderer.invoke('api:upload-game', payload),
    
    // Utils
    openFile: () => ipcRenderer.invoke('dialog:open-file')
});
