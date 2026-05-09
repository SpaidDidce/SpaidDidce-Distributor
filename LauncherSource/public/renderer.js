// Elementos del DOM
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const authTitle = document.getElementById('auth-subtitle');
const displayEmail = document.getElementById('display-email');
const logoutBtn = document.getElementById('logout-btn');

// Elementos de la Biblioteca
const gamesGrid = document.getElementById('games-grid');
const gamesLoading = document.getElementById('games-loading');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// Elementos del Modal
const gameModal = document.getElementById('game-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalGameTitle = document.getElementById('modal-game-title');
const modalGameDesc = document.getElementById('modal-game-desc');
const downloadBtn = document.getElementById('download-btn');
const downloadProgressContainer = document.getElementById('download-progress-container');
const downloadStatus = document.getElementById('download-status');
const downloadProgressFill = document.getElementById('download-progress-fill');

let currentGameId = null;

// Toggles
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');

// Al iniciar, verificamos al Main Process si ya hay una sesión guardada en electron-store
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const session = await window.launcherAPI.getSessionStatus();
        if (session.loggedIn) {
            showMainView(session.email);
        }
    } catch (error) {
        console.error("Error al verificar sesión:", error);
    }
});

// Cambiar a vista de registro
goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authTitle.textContent = 'Crea una cuenta nueva';
    authError.textContent = '';
    authSuccess.textContent = '';
});

// Cambiar a vista de login
goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    authTitle.textContent = 'Inicia sesión para continuar';
    authError.textContent = '';
    authSuccess.textContent = '';
});

// Manejar el formulario de Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button');
    
    submitBtn.textContent = "Iniciando...";
    submitBtn.disabled = true;
    authError.textContent = "";
    authSuccess.textContent = "";

    try {
        const response = await window.launcherAPI.login(email, password);
        
        if (response.success) {
            showMainView(response.email);
            loginForm.reset();
        } else {
            authError.textContent = response.error || "Error al iniciar sesión";
        }
    } catch (error) {
        authError.textContent = "Error de conexión con el cliente local.";
        console.error(error);
    } finally {
        submitBtn.textContent = "Iniciar Sesión";
        submitBtn.disabled = false;
    }
});

// Manejar el formulario de Registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const submitBtn = registerForm.querySelector('button');
    
    submitBtn.textContent = "Creando...";
    submitBtn.disabled = true;
    authError.textContent = "";
    authSuccess.textContent = "";

    try {
        const response = await window.launcherAPI.register(username, email, password);
        
        if (response.success) {
            authSuccess.textContent = "Cuenta creada con éxito. Entrando...";
            registerForm.reset();
            setTimeout(() => {
                // Auto-login directo a la biblioteca
                showMainView(response.email);
            }, 1000);
        } else {
            authError.textContent = response.error || "Error al crear cuenta";
        }
    } catch (error) {
        authError.textContent = "Error de conexión con el cliente local.";
        console.error(error);
    } finally {
        submitBtn.textContent = "Crear Cuenta";
        submitBtn.disabled = false;
    }
});

// Manejar el Logout
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await window.launcherAPI.logout();
        showAuthView();
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
});

// Animaciones de cambio de vista
function showMainView(email) {
    displayEmail.textContent = email;
    authView.classList.remove('active');
    
    setTimeout(() => {
        authView.style.display = 'none';
        mainView.style.display = 'flex';
        void mainView.offsetWidth;
        mainView.classList.add('active');
        
        loadGames();
    }, 300);
}

function showAuthView() {
    mainView.classList.remove('active');
    
    setTimeout(() => {
        mainView.style.display = 'none';
        authView.style.display = 'flex';
        void authView.offsetWidth;
        authView.classList.add('active');
    }, 300);
}

// Lógica de Biblioteca de Juegos
async function loadGames() {
    gamesGrid.innerHTML = '';
    gamesLoading.style.display = 'block';
    
    const response = await window.launcherAPI.getPublicGames();
    gamesLoading.style.display = 'none';
    
    if(response.success) {
        renderGames(response.games);
    } else {
        gamesLoading.style.display = 'block';
        gamesLoading.textContent = "Error al cargar la biblioteca: " + response.error;
    }
}

async function searchGames() {
    const query = searchInput.value.trim();
    if (!query) return loadGames();
    
    gamesGrid.innerHTML = '';
    gamesLoading.style.display = 'block';
    gamesLoading.textContent = "Buscando...";
    
    const response = await window.launcherAPI.searchGame(query);
    gamesLoading.style.display = 'none';
    
    if(response.success) {
        renderGames(response.games);
    } else {
        gamesLoading.style.display = 'block';
        gamesLoading.textContent = "No se encontraron juegos.";
    }
}

searchBtn.addEventListener('click', searchGames);
searchInput.addEventListener('keyup', (e) => {
    if(e.key === 'Enter') searchGames();
});

function renderGames(games) {
    gamesGrid.innerHTML = '';
    if(!games || games.length === 0) {
        gamesGrid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1;">No hay juegos disponibles.</p>';
        return;
    }
    
    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-icon">${game.gameName ? game.gameName.charAt(0).toUpperCase() : '?'}</div>
            <div class="game-title">${game.gameName}</div>
        `;
        
        card.addEventListener('click', () => openGameModal(game));
        gamesGrid.appendChild(card);
    });
}

async function openGameModal(game) {
    currentGameId = game.gameId;
    modalGameTitle.textContent = game.gameName;
    modalGameDesc.textContent = "Cargando descripción...";
    gameModal.style.display = 'flex';
    
    downloadProgressContainer.style.display = 'none';
    downloadBtn.style.display = 'block';
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Descargar Última Versión';
    
    const res = await window.launcherAPI.getLatestDescription(game.gameId);
    if(res.success) {
        // En C# se devuelve en JSON así: "{ "gameDescription": "..." }" si se serializa,
        // pero vamos a tratar de parsear si es JSON.
        let desc = res.description;
        try { desc = JSON.parse(desc); } catch (e) {}
        modalGameDesc.textContent = desc;
    } else {
        modalGameDesc.textContent = "No hay descripción disponible. (" + res.error + ")";
    }
}

closeModalBtn.addEventListener('click', () => {
    gameModal.style.display = 'none';
    currentGameId = null;
});

downloadBtn.addEventListener('click', async () => {
    if(!currentGameId) return;
    
    downloadBtn.disabled = true;
    downloadProgressContainer.style.display = 'block';
    downloadStatus.textContent = 'Solicitando descarga...';
    downloadProgressFill.style.width = '0%';
    
    const res = await window.launcherAPI.downloadLatestGame(currentGameId);
    if(!res.success) {
        downloadStatus.textContent = "Error: " + res.error;
        downloadStatus.style.color = 'var(--error)';
    }
});

// Escuchar progreso de descarga
window.launcherAPI.onDownloadProgress((data) => {
    if(data.status === 'downloading') {
        downloadStatus.textContent = `Descargando... ${data.percent}%`;
        downloadStatus.style.color = 'var(--text-muted)';
        downloadProgressFill.style.width = `${data.percent}%`;
    } else if(data.status === 'completed') {
        downloadStatus.textContent = `¡Completado! Guardado en:\n${data.path}`;
        downloadStatus.style.color = '#10b981';
        downloadProgressFill.style.width = `100%`;
        downloadBtn.style.display = 'none';
    } else if(data.status === 'error') {
        downloadStatus.textContent = "Fallo en la descarga.";
        downloadStatus.style.color = 'var(--error)';
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Reintentar Descarga';
    }
});
