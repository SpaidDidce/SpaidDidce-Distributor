document.addEventListener('DOMContentLoaded', async () => {
    const authScreen = document.getElementById('auth-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const authError = document.getElementById('auth-error');
    const userEmailSpan = document.getElementById('user-email');
    const btnLogout = document.getElementById('btn-logout');
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            if (targetTab === 'stripe-tab') {
                const stripeSelect = document.getElementById('stripe-team-id');
                if (stripeSelect && stripeSelect.value) stripeSelect.dispatchEvent(new Event('change'));
            } else if (targetTab === 'upload-tab') {
                const uploadSelect = document.getElementById('upload-team-id');
                if (uploadSelect && uploadSelect.value) uploadSelect.dispatchEvent(new Event('change'));
            } else if (targetTab === 'games-tab') {
                const gameSelect = document.getElementById('game-team-id');
                if (gameSelect && gameSelect.value) gameSelect.dispatchEvent(new Event('change'));
            }
        });
    });
    const checkAuth = async () => {
        const email = await window.devAPI.getEmail();
        if (email) {
            userEmailSpan.textContent = email;
            authScreen.classList.remove('active');
            mainScreen.classList.add('active');
        }
    };
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const btn = document.getElementById('btn-login');
        btn.textContent = 'Signing in...';
        btn.disabled = true;
        authError.textContent = '';
        const res = await window.devAPI.login(email, pass);
        if (res.success) {
            await checkAuth();
            await loadTeams();
        } else {
            authError.textContent = res.error || 'Invalid credentials';
            btn.textContent = 'Access Panel';
            btn.disabled = false;
        }
    });
    btnLogout.addEventListener('click', async () => {
        await window.devAPI.logout();
        location.reload();
    });
    const btnSaveTeam = document.getElementById('btn-save-team');
    const openCreateTeam = document.getElementById('open-create-team');
    const createTeamCard = document.getElementById('create-team-card');
    openCreateTeam.addEventListener('click', () => {
        const isVisible = createTeamCard.style.display !== 'none';
        createTeamCard.style.display = isVisible ? 'none' : 'block';
        openCreateTeam.textContent = isVisible ? '+ New Team' : '✖ Cancel';
    });
    btnSaveTeam.addEventListener('click', async () => {
        const name = document.getElementById('new-team-name').value.trim();
        if (!name) return alert('Team name is required');
        btnSaveTeam.textContent = 'Saving...';
        btnSaveTeam.disabled = true;
        const res = await window.devAPI.createTeam(name);
        if (res.success) {
            document.getElementById('new-team-name').value = '';
            createTeamCard.style.display = 'none';
            openCreateTeam.textContent = '+ New Team';
            await loadTeams();
        } else {
            alert('Error: ' + res.message);
        }
        btnSaveTeam.textContent = 'Save Team';
        btnSaveTeam.disabled = false;
    });
    const btnCreateGame = document.getElementById('btn-create-game');
    const selectGameTeam = document.getElementById('game-team-id');
    const teamGamesList = document.getElementById('team-games-list');
    const checkIsFree = document.getElementById('game-is-free');
    const priceContainer = document.getElementById('price-container');
    if (checkIsFree) {
        checkIsFree.addEventListener('change', () => {
            priceContainer.style.display = checkIsFree.checked ? 'none' : 'block';
        });
    }
    const loadGamesForTeam = async (teamId) => {
        if (!teamId) { teamGamesList.innerHTML = ''; return; }
        teamGamesList.innerHTML = '<p class="empty-msg"> Loading games...</p>';
        const res = await window.devAPI.getGamesForTeam(teamId);
        if (res.success) {
            const games = res.data;
            if (games.length === 0) {
                teamGamesList.innerHTML = '<p class="empty-msg"><span>🎮</span> This team has no registered games yet.</p>';
                return;
            }
            teamGamesList.innerHTML = '';
            games.forEach(game => {
                const card = document.createElement('div');
                card.className = `game-card ${game.gameIsPublic ? 'public' : 'private'}`;
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'game-info';
                
                const strongName = document.createElement('strong');
                strongName.textContent = game.gameName;
                
                const priceSpan = document.createElement('span');
                priceSpan.className = `game-price-tag ${game.itsFree ? 'free' : ''}`;
                priceSpan.textContent = game.itsFree ? 'FREE' : `€${game.price}`;
                
                const codeId = document.createElement('code');
                codeId.className = 'mini-id';
                codeId.textContent = game.gameId;
                
                infoDiv.appendChild(strongName);
                infoDiv.appendChild(priceSpan);
                infoDiv.appendChild(codeId);
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'team-actions';
                
                const btnCopy = document.createElement('button');
                btnCopy.className = 'btn-icon';
                btnCopy.title = 'Copy ID';
                btnCopy.textContent = '📋';
                btnCopy.onclick = () => copyToClipboard(game.gameId);
                
                const btnToggle = document.createElement('button');
                btnToggle.className = 'btn-icon';
                btnToggle.title = 'Toggle Visibility';
                btnToggle.textContent = '🌐';
                btnToggle.onclick = () => setGamePublic(teamId, game.gameId);
                
                actionsDiv.appendChild(btnCopy);
                actionsDiv.appendChild(btnToggle);
                
                card.appendChild(infoDiv);
                card.appendChild(actionsDiv);
                teamGamesList.appendChild(card);
            });
        }
    };
    if (selectGameTeam) {
        selectGameTeam.addEventListener('change', (e) => loadGamesForTeam(e.target.value));
    }
    window.setGamePublic = async (teamId, gameId) => {
        const res = await window.devAPI.publicGame(teamId, gameId);
        if (res.success) {
            loadGamesForTeam(teamId);
        } else {
            alert('Failed to update visibility');
        }
    };
    btnCreateGame.addEventListener('click', async () => {
        const teamId = selectGameTeam.value;
        const gameData = {
            GameName: document.getElementById('game-name').value.trim(),
            GameDescription: document.getElementById('game-desc').value.trim(),
            ExeName: document.getElementById('game-exe').value.trim(),
            ItsFree: checkIsFree.checked,
            Price: parseFloat(document.getElementById('game-price').value || 0)
        };
        if (!teamId || !gameData.GameName) return alert('Team and game name are required');
        btnCreateGame.textContent = 'Registering...';
        btnCreateGame.disabled = true;
        const res = await window.devAPI.createGame(teamId, gameData);
        alert(res.message || 'Game processed');
        if (res.success) loadGamesForTeam(teamId);
        btnCreateGame.textContent = 'Register Game';
        btnCreateGame.disabled = false;
    });
    let selectedFilePath = null;
    const btnSelectFile = document.getElementById('btn-select-file');
    const pathLabel = document.getElementById('selected-file-path');
    const btnStartUpload = document.getElementById('btn-start-upload');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressFill = document.getElementById('upload-progress-fill');
    const uploadStatus = document.getElementById('upload-status');
    const uploadPercent = document.getElementById('upload-percent');
    const fileDropZone = document.getElementById('file-drop-zone');
    btnSelectFile.addEventListener('click', async () => {
        const filePath = await window.devAPI.openFile();
        if (filePath) {
            selectedFilePath = filePath;
            pathLabel.textContent = filePath.split(/[\\/]/).pop();
            pathLabel.title = filePath;
            fileDropZone.classList.add('drag-over');
            setTimeout(() => fileDropZone.classList.remove('drag-over'), 600);
        }
    });
    const selectUploadTeam = document.getElementById('upload-team-id');
    const selectUploadGame = document.getElementById('upload-game-id');
    selectUploadTeam.addEventListener('change', async (e) => {
        const teamId = e.target.value;
        if (!teamId) {
            selectUploadGame.innerHTML = '<option value="">Select a team first...</option>';
            return;
        }
        selectUploadGame.innerHTML = '<option value="">Loading games...</option>';
        const res = await window.devAPI.getGamesForTeam(teamId);
        if (res.success) {
            selectUploadGame.innerHTML = '';
            if (res.data.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'No games in this team';
                selectUploadGame.appendChild(opt);
            } else {
                res.data.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g.gameId;
                    opt.textContent = g.gameName;
                    selectUploadGame.appendChild(opt);
                });
            }
        } else {
            selectUploadGame.innerHTML = '<option value="">Error loading games</option>';
        }
    });
    btnStartUpload.addEventListener('click', async () => {
        const teamId = selectUploadTeam.value;
        const gameId = selectUploadGame.value;
        const version = document.getElementById('upload-version').value.trim();
        const desc = document.getElementById('upload-desc').value.trim();
        if (!selectedFilePath || !teamId || !gameId || !version) {
            return alert('Please fill in all fields: team, game, version, and file.');
        }
        progressContainer.style.display = 'block';
        btnStartUpload.disabled = true;
        uploadStatus.textContent = 'Uploading...';
        progressFill.style.width = '0%';
        if (uploadPercent) uploadPercent.textContent = '0%';
        const res = await window.devAPI.uploadGame({ teamId, gameId, version, filePath: selectedFilePath, description: desc });
        if (res.success) {
            progressFill.style.width = '100%';
            if (uploadPercent) uploadPercent.textContent = '100%';
            uploadStatus.textContent = '✓ Published!';
            uploadStatus.style.color = 'var(--success)';
            setTimeout(() => {
                progressContainer.style.display = 'none';
                uploadStatus.style.color = '';
            }, 2500);
        } else {
            uploadStatus.textContent = '✖ Upload failed: ' + res.error;
            uploadStatus.style.color = 'var(--error)';
        }
        btnStartUpload.disabled = false;
    });
    const teamsList = document.getElementById('teams-list');
    const getRevokedReasonText = (code) => {
        const reasons = {
            0: 'Malware detected',
            1: 'Deleted by user',
            2: 'Banned by administration',
            3: 'Team dissolved'
        };
        return reasons[code] ?? 'Terms of service violation';
    };
    const loadTeams = async () => {
        teamsList.innerHTML = '<p class="empty-msg"><span>â³</span> Loading teams...</p>';
        const res = await window.devAPI.getTeams();
        if (!res.success) {
            teamsList.innerHTML = '<p class="empty-msg"><span>🔌</span> Failed to load teams.</p>';
            return;
        }
        const teams = res.data;
        document.querySelectorAll('.team-selector-dropdown').forEach(dropdown => {
            const active = teams.filter(t => !t.itsRevoked);
            dropdown.innerHTML = '';
            if (active.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'No active teams';
                dropdown.appendChild(opt);
            } else {
                active.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.teamId;
                    opt.textContent = t.teamName;
                    dropdown.appendChild(opt);
                });
            }
        });
        if (!teams || teams.length === 0) {
            teamsList.innerHTML = '<p class="empty-msg"><span>👥</span> You have no teams yet.</p>';
            return;
        }
        teamsList.innerHTML = '';
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = `team-card ${team.itsRevoked ? 'revoked' : ''}`;
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'team-info';
            
            const h4 = document.createElement('h4');
            h4.textContent = team.teamName + ' ';
            if (team.itsRevoked) {
                const badge = document.createElement('span');
                badge.className = 'badge-revoked';
                badge.textContent = 'Revoked';
                h4.appendChild(badge);
            }
            
            const spanId = document.createElement('span');
            spanId.className = 'team-id';
            spanId.textContent = 'ID: ' + team.teamId;
            
            infoDiv.appendChild(h4);
            infoDiv.appendChild(spanId);
            
            if (team.itsRevoked) {
                const pReason = document.createElement('p');
                pReason.className = 'revoked-reason';
                pReason.textContent = 'Reason: ' + getRevokedReasonText(team.revokedReason);
                infoDiv.appendChild(pReason);
            }
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'team-actions';
            
            const btnCopy = document.createElement('button');
            btnCopy.className = 'btn-icon';
            btnCopy.title = 'Copy ID';
            btnCopy.textContent = '📋';
            btnCopy.onclick = () => copyToClipboard(team.teamId);
            actionsDiv.appendChild(btnCopy);
            
            if (!team.itsRevoked) {
                const btnRename = document.createElement('button');
                btnRename.className = 'btn-icon';
                btnRename.title = 'Rename';
                btnRename.textContent = '✏️';
                btnRename.onclick = () => changeName(team.teamId);
                actionsDiv.appendChild(btnRename);
            }
            
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-icon btn-delete';
            btnDelete.title = 'Dissolve Team';
            btnDelete.textContent = '🗑️';
            btnDelete.onclick = () => confirmDeleteTeam(team.teamId);
            actionsDiv.appendChild(btnDelete);
            
            card.appendChild(infoDiv);
            card.appendChild(actionsDiv);
            teamsList.appendChild(card);
        });
    };
    window.confirmDeleteTeam = async (id) => {
        if (confirm('Are you sure you want to dissolve this team? Associated games will be unpublished.')) {
            const res = await window.devAPI.deleteTeam(id);
            if (res.success) {
                await loadTeams();
            } else {
                alert('Failed to delete: ' + res.error);
            }
        }
    };
    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };
    window.changeName = async (id) => {
        const newName = prompt('Enter the new team name:');
        if (newName && newName.trim()) {
            const res = await window.devAPI.changeTeamName(id, newName.trim());
            alert(res.message);
            loadTeams();
        }
    };
    const savedEmail = await window.devAPI.getEmail();
    if (savedEmail) {
        await window.devAPI.refreshSession();
        await checkAuth();
        await loadTeams();
    }
    const stripeTeamSelect = document.getElementById('stripe-team-id');
    const btnStripeConnect = document.getElementById('btn-stripe-connect');
    const btnStripeRefresh = document.getElementById('btn-stripe-refresh');
    const stripeStatusBox = document.getElementById('stripe-status-container');
    const stripeStatusText = document.getElementById('stripe-status-text');
    async function checkStripeStatus(teamId) {
        stripeStatusBox.style.display = 'block';
        stripeStatusText.textContent = '⏳ Comprobando estado con Stripe...';
        stripeStatusBox.style.background = 'var(--bg-input)';
        const res = await window.devAPI.getStripeStatus(teamId);
        if (!res.connected && res.status === 'not_configured') {
            stripeStatusText.textContent = '⚠️ Este equipo aún no tiene Stripe Connect configurado.';
            stripeStatusBox.style.background = 'rgba(245,158,11,0.1)';
            btnStripeConnect.textContent = '💳 Conectar con Stripe';
        } else if (res.connected && res.status === 'pending_verification') {
            stripeStatusText.textContent = '🔄 Cuenta creada pero pendiente de verificación. Completa el formulario de Stripe para activar los pagos.';
            stripeStatusBox.style.background = 'rgba(99,91,255,0.1)';
            btnStripeConnect.textContent = '📝 Completar verificación en Stripe';
        } else if (res.connected && res.status === 'active') {
            stripeStatusText.textContent = '✅ Cuenta de Stripe activa y lista para recibir pagos.';
            stripeStatusBox.style.background = 'rgba(16,185,129,0.1)';
            btnStripeConnect.textContent = '🔗 Ver en Stripe Dashboard';
        }
        btnStripeConnect.disabled = false;
        btnStripeRefresh.style.display = 'inline-block';
    }
    stripeTeamSelect.addEventListener('change', () => {
        const teamId = stripeTeamSelect.value;
        if (teamId) checkStripeStatus(teamId);
        else {
            stripeStatusBox.style.display = 'none';
            btnStripeConnect.disabled = true;
        }
    });
    btnStripeConnect.addEventListener('click', async () => {
        const teamId = stripeTeamSelect.value;
        if (!teamId) return;
        btnStripeConnect.textContent = 'Redirigiendo a Stripe...';
        btnStripeConnect.disabled = true;
        const res = await window.devAPI.createStripeOnboarding(teamId);
        if (res.url) {
            window.devAPI.openExternalLink(res.url);
            btnStripeConnect.textContent = '⏳ Completando en el navegador...';
        } else {
            alert('Error al iniciar Stripe Connect: ' + (res.error || 'Error desconocido'));
            btnStripeConnect.disabled = false;
        }
    });
    btnStripeRefresh.addEventListener('click', () => {
        const teamId = stripeTeamSelect.value;
        if (teamId) checkStripeStatus(teamId);
    });
});
