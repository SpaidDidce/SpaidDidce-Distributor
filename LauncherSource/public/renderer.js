const authView     = document.getElementById('auth-view');
const mainView     = document.getElementById('main-view');
const loginForm    = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError    = document.getElementById('auth-error');
const authSuccess  = document.getElementById('auth-success');
const authTitle    = document.getElementById('auth-subtitle');
const displayEmail = document.getElementById('display-email');
const logoutBtn    = document.getElementById('logout-btn');
const userAvatar   = document.getElementById('user-avatar-letter');

const gamesGrid   = document.getElementById('games-grid');
const gamesLoading = document.getElementById('games-loading');
const searchInput = document.getElementById('search-input');
const searchBtn   = document.getElementById('search-btn');
const viewTitle   = document.getElementById('view-title');
const navItems    = document.querySelectorAll('.nav-item');

let currentView = 'store';

const gameModal               = document.getElementById('game-modal');
const closeModalBtn           = document.getElementById('close-modal');
const modalGameTitle          = document.getElementById('modal-game-title');
const modalGameDesc           = document.getElementById('modal-game-desc');
const modalIconLetter         = document.getElementById('modal-icon-letter');
const modalGameBadge          = document.getElementById('modal-game-badge');
const downloadBtn             = document.getElementById('download-btn');
const downloadProgressContainer = document.getElementById('download-progress-container');
const downloadStatus          = document.getElementById('download-status');
const downloadProgressFill    = document.getElementById('download-progress-fill');

let currentGameId  = null;
let currentExeName = null;

const goToRegister = document.getElementById('go-to-register');
const goToLogin    = document.getElementById('go-to-login');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const session = await window.launcherAPI.getSessionStatus();
        if (session.loggedIn) {
            const refreshed = await window.launcherAPI.refreshSession();
            if (refreshed.success) showMainView(session.email);
            else showAuthView();
        }
    } catch (error) {
        console.error("Error checking session:", error);
    }
});

goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display    = 'none';
    registerForm.style.display = 'block';
    authTitle.textContent      = 'Create a new account';
    authError.textContent      = '';
    authSuccess.textContent    = '';
});

goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display    = 'block';
    authTitle.textContent      = 'Sign in to continue';
    authError.textContent      = '';
    authSuccess.textContent    = '';
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email     = document.getElementById('email').value;
    const password  = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.textContent = "Signing in...";
    submitBtn.disabled    = true;
    authError.textContent = "";

    try {
        const response = await window.launcherAPI.login(email, password);
        if (response.success) {
            showMainView(response.email);
            loginForm.reset();
        } else {
            authError.textContent = response.error || "Failed to sign in";
        }
    } catch {
        authError.textContent = "Connection error with local client.";
    } finally {
        submitBtn.textContent = "Sign In";
        submitBtn.disabled    = false;
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username  = document.getElementById('reg-username').value;
    const email     = document.getElementById('reg-email').value;
    const password  = document.getElementById('reg-password').value;
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    submitBtn.textContent = "Creating...";
    submitBtn.disabled    = true;
    authError.textContent = "";

    try {
        const response = await window.launcherAPI.register(username, email, password);
        if (response.success) {
            authSuccess.textContent = "Account created! Entering...";
            registerForm.reset();
            setTimeout(() => showMainView(response.email), 900);
        } else {
            authError.textContent = response.error || "Failed to create account";
        }
    } catch {
        authError.textContent = "Connection error with local client.";
    } finally {
        submitBtn.textContent = "Create Account";
        submitBtn.disabled    = false;
    }
});

logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await window.launcherAPI.logout();
        showAuthView();
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

function showMainView(email) {
    displayEmail.textContent = email;
    if (userAvatar) userAvatar.textContent = email.charAt(0).toUpperCase();

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

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view === currentView) return;

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentView = view;

        if (view === 'store') {
            viewTitle.textContent = 'Global Store';
            loadStore();
        } else {
            viewTitle.textContent = 'My Library';
            loadLibrary();
        }
    });
});

async function loadStore() {
    showGridLoading();
    const response = await window.launcherAPI.getPublicGames();
    hideGridLoading();
    if (response.success) renderGames(response.games);
    else showGridEmpty('ðŸ”Œ', 'Could not connect to the store.');
}

async function loadLibrary() {
    showGridLoading();
    const response = await window.launcherAPI.getMyLibrary();
    hideGridLoading();
    if (response.success) renderGames(response.games);
    else showGridEmpty('ðŸ“¦', 'Failed to load library.');
}

async function loadGames() {
    showGridLoading();
    const response = await window.launcherAPI.getPublicGames();
    hideGridLoading();
    if (response.success) renderGames(response.games);
    else showGridEmpty('ðŸ”Œ', 'Could not connect to the store.');
}

async function searchGames() {
    const query = searchInput.value.trim();
    if (!query) return loadGames();

    showGridLoading();
    const response = await window.launcherAPI.searchGame(query);
    hideGridLoading();
    if (response.success) renderGames(response.games);
    else showGridEmpty('ðŸ”', 'No games found.');
}

searchBtn.addEventListener('click', searchGames);
searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') searchGames(); });

function showGridLoading() {
    gamesGrid.innerHTML = '';
    gamesLoading.style.display = 'flex';
}

function hideGridLoading() {
    gamesLoading.style.display = 'none';
}

function showGridEmpty(icon, msg) {
    gamesGrid.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">${icon}</span>
            <span>${msg}</span>
        </div>`;
}

const GRADIENTS = [
    ['#7c5cfc','#5b8af8'],
    ['#f472b6','#a855f7'],
    ['#34d399','#3b82f6'],
    ['#fb923c','#f43f5e'],
    ['#22d3ee','#6366f1'],
    ['#a78bfa','#ec4899'],
];

function gradientForName(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const [a, b] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
    return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

function renderGames(games) {
    gamesGrid.innerHTML = '';
    if (!games || games.length === 0) {
        showGridEmpty('ðŸŽ®', 'No games available.');
        return;
    }

    games.forEach(game => {
        const grad  = gradientForName(game.gameName);
        const letter = game.gameName ? game.gameName.charAt(0).toUpperCase() : '?';
        const priceLabel = game.gameItsFree ? 'Free' : `${game.price ?? '?'}â‚¬`;
        const priceClass = game.gameItsFree ? 'free' : '';

        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-icon" style="background: ${grad};">${letter}</div>
            <div class="game-title">${game.gameName}</div>
            <span class="game-price ${priceClass}">${priceLabel}</span>
        `;
        card.addEventListener('click', () => openGameModal(game));
        gamesGrid.appendChild(card);
    });
}

async function openGameModal(game) {
    currentGameId  = game.gameId;
    currentExeName = game.exeName;

    modalGameTitle.textContent          = game.gameName;
    modalGameDesc.textContent           = "Loading information...";
    modalIconLetter.textContent         = game.gameName ? game.gameName.charAt(0).toUpperCase() : '?';
    modalIconLetter.parentElement.style.background = gradientForName(game.gameName);
    modalGameBadge.textContent          = '';
    modalGameBadge.className            = 'game-badge';
    downloadProgressContainer.style.display = 'none';
    downloadBtn.disabled                = false;
    downloadBtn.style.background        = '';
    downloadBtn.style.opacity           = '';
    gameModal.style.display             = 'flex';

    const [isOwned, isDownloaded] = await Promise.all([
        window.launcherAPI.checkIfGameOwned(game.gameId),
        window.launcherAPI.checkIfGameDownloaded(game.gameId)
    ]);

    if (isOwned) {
        modalGameBadge.textContent = 'Owned';
        modalGameBadge.classList.add('badge-owned');
    } else if (game.gameItsFree) {
        modalGameBadge.textContent = 'Free';
        modalGameBadge.classList.add('badge-free');
    } else {
        modalGameBadge.textContent = `${game.price ?? '?'}â‚¬`;
        modalGameBadge.classList.add('badge-paid');
    }

    if (currentView === 'store') {
        if (isOwned) {
            downloadBtn.textContent = 'Already in your library';
            downloadBtn.disabled    = true;
            downloadBtn.style.background = 'rgba(255,255,255,0.05)';
            downloadBtn.style.opacity    = '0.6';
        } else if (game.gameItsFree) {
            downloadBtn.textContent = 'Add to Library â€” Free';
            downloadBtn.onclick = () => handleBuy(game);
        } else {
            downloadBtn.textContent = `Buy Now â€” ${game.price ?? '?'}â‚¬`;
            downloadBtn.onclick = () => handleBuy(game);
        }
    } else {
        if (isDownloaded) {
            downloadBtn.textContent      = 'â–¶  Play Now';
            downloadBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            downloadBtn.onclick = async () => {
                const res = await window.launcherAPI.launchGame(currentGameId, currentExeName);
                if (!res.success) alert("Failed to launch: " + res.error);
            };
        } else {
            downloadBtn.textContent = 'â¬‡  Download Latest Version';
            downloadBtn.onclick = () => handleDownload();
        }
    }

    const res = await window.launcherAPI.getLatestDescription(game.gameId);
    if (res.success) {
        let desc = res.description;
        try { desc = JSON.parse(desc); } catch {}
        modalGameDesc.textContent = desc;
    } else {
        modalGameDesc.textContent = "No description available.";
    }
}

closeModalBtn.addEventListener('click', () => {
    gameModal.style.display = 'none';
    currentGameId = null;
});

async function handleBuy(game) {
    downloadBtn.disabled    = true;
    downloadBtn.textContent = 'Processing...';

    if (game.gameItsFree) {
        const res = await window.launcherAPI.buyGame(game.gameId);
        if (res.success) {
            alert('Game added to your library!');
            gameModal.style.display = 'none';
            loadLibrary();
        } else {
            alert('Failed to add game: ' + res.error);
            downloadBtn.disabled    = false;
            downloadBtn.textContent = 'Retry';
        }
    } else {
        const res = await window.launcherAPI.createCheckoutSession(game.gameId);
        if (res.url) {
            window.launcherAPI.openExternalLink(res.url);
            downloadBtn.textContent = 'Waiting for payment...';
            alert('The payment page has been opened in your browser. Once completed, the game will appear in your Library.');
        } else {
            alert('Failed to connect to Stripe: ' + res.error);
            downloadBtn.disabled    = false;
            downloadBtn.textContent = 'Retry';
        }
    }
}

async function handleDownload() {
    if (!currentGameId) return;

    downloadBtn.disabled                = true;
    downloadProgressContainer.style.display = 'block';
    downloadStatus.textContent          = 'Requesting download...';
    downloadStatus.style.color          = 'var(--text-muted)';
    downloadProgressFill.style.width    = '0%';

    const res = await window.launcherAPI.downloadLatestGame(currentGameId);
    if (!res.success) {
        downloadStatus.textContent = "Error: " + res.error;
        downloadStatus.style.color = 'var(--error)';
    }
}

window.launcherAPI.onDownloadProgress((data) => {
    if (data.status === 'downloading') {
        downloadStatus.textContent = `Downloading... ${data.percent}%`;
        downloadStatus.style.color = 'var(--text-muted)';
        downloadProgressFill.style.width = `${data.percent}%`;
    } else if (data.status === 'extracting') {
        downloadStatus.textContent = 'Installing (Extracting files)...';
        downloadStatus.style.color = '#f59e0b';
        downloadProgressFill.style.width = '100%';
    } else if (data.status === 'completed') {
        downloadStatus.textContent = 'âœ“ Ready to play!';
        downloadStatus.style.color = 'var(--success)';
        downloadProgressFill.style.width = '100%';

        downloadBtn.textContent      = 'â–¶  Play Now';
        downloadBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        downloadBtn.disabled         = false;
        downloadBtn.onclick = async () => {
            const res = await window.launcherAPI.launchGame(currentGameId, currentExeName);
            if (!res.success) alert("Failed to launch game: " + res.error);
        };
    } else if (data.status === 'error') {
        downloadStatus.textContent = 'âœ• Download failed.';
        downloadStatus.style.color = 'var(--error)';
        downloadBtn.disabled       = false;
        downloadBtn.textContent    = 'Retry Download';
    }
});
