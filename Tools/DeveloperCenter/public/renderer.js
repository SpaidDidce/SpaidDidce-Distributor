document.addEventListener('DOMContentLoaded', async () => {
    const authScreen    = document.getElementById('auth-screen');
    const mainScreen    = document.getElementById('main-screen');
    const loginForm     = document.getElementById('login-form');
    const authError     = document.getElementById('auth-error');
    const userEmailSpan = document.getElementById('user-email');
    const btnLogout     = document.getElementById('btn-logout');
    const navLinks      = document.querySelectorAll('.nav-links li');
    const tabContents   = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
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
        const pass  = document.getElementById('password').value;
        const btn   = document.getElementById('btn-login');

        btn.textContent = 'Signing in...';
        btn.disabled    = true;
        authError.textContent = '';

        const res = await window.devAPI.login(email, pass);
        if (res.success) {
            await checkAuth();
            await loadTeams();
        } else {
            authError.textContent = res.error || 'Invalid credentials';
            btn.textContent = 'Access Panel';
            btn.disabled    = false;
        }
    });

    btnLogout.addEventListener('click', async () => {
        await window.devAPI.logout();
        location.reload();
    });

    const btnSaveTeam    = document.getElementById('btn-save-team');
    const openCreateTeam = document.getElementById('open-create-team');
    const createTeamCard = document.getElementById('create-team-card');

    openCreateTeam.addEventListener('click', () => {
        const isVisible = createTeamCard.style.display !== 'none';
        createTeamCard.style.display = isVisible ? 'none' : 'block';
        openCreateTeam.textContent   = isVisible ? '+ New Team' : 'âœ• Cancel';
    });

    btnSaveTeam.addEventListener('click', async () => {
        const name = document.getElementById('new-team-name').value.trim();
        if (!name) return alert('Team name is required');

        btnSaveTeam.textContent = 'Saving...';
        btnSaveTeam.disabled    = true;

        const res = await window.devAPI.createTeam(name);
        if (res.success) {
            document.getElementById('new-team-name').value = '';
            createTeamCard.style.display = 'none';
            openCreateTeam.textContent   = '+ New Team';
            await loadTeams();
        } else {
            alert('Error: ' + res.message);
        }
        btnSaveTeam.textContent = 'Save Team';
        btnSaveTeam.disabled    = false;
    });

    const btnCreateGame   = document.getElementById('btn-create-game');
    const selectGameTeam  = document.getElementById('game-team-id');
    const teamGamesList   = document.getElementById('team-games-list');
    const checkIsFree     = document.getElementById('game-is-free');
    const priceContainer  = document.getElementById('price-container');

    if (checkIsFree) {
        checkIsFree.addEventListener('change', () => {
            priceContainer.style.display = checkIsFree.checked ? 'none' : 'block';
        });
    }

    const loadGamesForTeam = async (teamId) => {
        if (!teamId) { teamGamesList.innerHTML = ''; return; }

        teamGamesList.innerHTML = '<p class="empty-msg"><span>â³</span> Loading games...</p>';
        const res = await window.devAPI.getGamesForTeam(teamId);

        if (res.success) {
            const games = res.data;
            if (games.length === 0) {
                teamGamesList.innerHTML = '<p class="empty-msg"><span>ðŸŽ®</span> This team has no registered games yet.</p>';
                return;
            }
            teamGamesList.innerHTML = games.map(game => `
                <div class="game-card ${game.gameIsPublic ? 'public' : 'private'}">
                    <div class="game-info">
                        <strong>${game.gameName}</strong>
                        <span class="game-price-tag ${game.itsFree ? 'free' : ''}">${game.itsFree ? 'FREE' : `â‚¬${game.price}`}</span>
                        <code class="mini-id">${game.gameId}</code>
                    </div>
                    <div class="team-actions">
                        <button onclick="copyToClipboard('${game.gameId}')" class="btn-icon" title="Copy ID">ðŸ“‹</button>
                        <button onclick="setGamePublic('${teamId}', '${game.gameId}')" class="btn-icon" title="Toggle Visibility">ðŸŒ</button>
                    </div>
                </div>
            `).join('');
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
        const teamId   = selectGameTeam.value;
        const gameData = {
            GameName:        document.getElementById('game-name').value.trim(),
            GameDescription: document.getElementById('game-desc').value.trim(),
            ExeName:         document.getElementById('game-exe').value.trim(),
            ItsFree:         checkIsFree.checked,
            Price:           parseFloat(document.getElementById('game-price').value || 0)
        };

        if (!teamId || !gameData.GameName) return alert('Team and game name are required');

        btnCreateGame.textContent = 'Registering...';
        btnCreateGame.disabled    = true;

        const res = await window.devAPI.createGame(teamId, gameData);
        alert(res.message || 'Game processed');
        if (res.success) loadGamesForTeam(teamId);

        btnCreateGame.textContent = 'Register Game';
        btnCreateGame.disabled    = false;
    });

    let selectedFilePath = null;
    const btnSelectFile       = document.getElementById('btn-select-file');
    const pathLabel           = document.getElementById('selected-file-path');
    const btnStartUpload      = document.getElementById('btn-start-upload');
    const progressContainer   = document.getElementById('upload-progress-container');
    const progressFill        = document.getElementById('upload-progress-fill');
    const uploadStatus        = document.getElementById('upload-status');
    const uploadPercent       = document.getElementById('upload-percent');
    const fileDropZone        = document.getElementById('file-drop-zone');

    btnSelectFile.addEventListener('click', async () => {
        const filePath = await window.devAPI.openFile();
        if (filePath) {
            selectedFilePath   = filePath;
            pathLabel.textContent = filePath.split(/[\\/]/).pop(); // show only filename
            pathLabel.title    = filePath;
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
            selectUploadGame.innerHTML = res.data.length === 0
                ? '<option value="">No games in this team</option>'
                : res.data.map(g => `<option value="${g.gameId}">${g.gameName}</option>`).join('');
        } else {
            selectUploadGame.innerHTML = '<option value="">Error loading games</option>';
        }
    });

    btnStartUpload.addEventListener('click', async () => {
        const teamId  = selectUploadTeam.value;
        const gameId  = selectUploadGame.value;
        const version = document.getElementById('upload-version').value.trim();
        const desc    = document.getElementById('upload-desc').value.trim();

        if (!selectedFilePath || !teamId || !gameId || !version) {
            return alert('Please fill in all fields: team, game, version, and file.');
        }

        progressContainer.style.display = 'block';
        btnStartUpload.disabled         = true;
        uploadStatus.textContent        = 'Uploading...';
        progressFill.style.width        = '0%';
        if (uploadPercent) uploadPercent.textContent = '0%';

        const res = await window.devAPI.uploadGame({ teamId, gameId, version, filePath: selectedFilePath, description: desc });

        if (res.success) {
            progressFill.style.width = '100%';
            if (uploadPercent) uploadPercent.textContent = '100%';
            uploadStatus.textContent = 'âœ“ Published!';
            uploadStatus.style.color = 'var(--success)';
            setTimeout(() => {
                progressContainer.style.display = 'none';
                uploadStatus.style.color = '';
            }, 2500);
        } else {
            uploadStatus.textContent = 'âœ• Upload failed: ' + res.error;
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
            teamsList.innerHTML = '<p class="empty-msg"><span>ðŸ”Œ</span> Failed to load teams.</p>';
            return;
        }

        const teams = res.data;

        document.querySelectorAll('.team-selector-dropdown').forEach(dropdown => {
            const active = teams.filter(t => !t.itsRevoked);
            dropdown.innerHTML = active.length === 0
                ? '<option value="">No active teams</option>'
                : active.map(t => `<option value="${t.teamId}">${t.teamName}</option>`).join('');
        });

        if (!teams || teams.length === 0) {
            teamsList.innerHTML = '<p class="empty-msg"><span>ðŸ‘¥</span> You have no teams yet.</p>';
            return;
        }

        teamsList.innerHTML = teams.map(team => `
            <div class="team-card ${team.itsRevoked ? 'revoked' : ''}">
                <div class="team-info">
                    <h4>
                        ${team.teamName}
                        ${team.itsRevoked ? '<span class="badge-revoked">Revoked</span>' : ''}
                    </h4>
                    <span class="team-id">ID: ${team.teamId}</span>
                    ${team.itsRevoked ? `<p class="revoked-reason">Reason: ${getRevokedReasonText(team.revokedReason)}</p>` : ''}
                </div>
                <div class="team-actions">
                    <button onclick="copyToClipboard('${team.teamId}')" title="Copy ID" class="btn-icon">ðŸ“‹</button>
                    ${!team.itsRevoked ? `<button onclick="changeName('${team.teamId}')" title="Rename" class="btn-icon">âœï¸</button>` : ''}
                    <button onclick="confirmDeleteTeam('${team.teamId}')" title="Dissolve Team" class="btn-icon btn-delete">ðŸ—‘ï¸</button>
                </div>
            </div>
        `).join('');
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
});
