document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias UI ---
    const authScreen = document.getElementById('auth-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const authError = document.getElementById('auth-error');
    const userEmailSpan = document.getElementById('user-email');
    const btnLogout = document.getElementById('btn-logout');

    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Lógica de Navegación ---
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');

            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // --- Gestión de Sesión ---
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

        const res = await window.devAPI.login(email, pass);
        if (res.success) {
            await checkAuth();
            await loadTeams();
        } else {
            authError.textContent = res.error || 'Credenciales inválidas';
        }
    });

    btnLogout.addEventListener('click', async () => {
        await window.devAPI.logout();
        location.reload();
    });

    // --- Crear Equipo ---
    const btnSaveTeam = document.getElementById('btn-save-team');
    const openCreateTeam = document.getElementById('open-create-team');
    const createTeamCard = document.getElementById('create-team-card');

    openCreateTeam.addEventListener('click', () => {
        createTeamCard.style.display = createTeamCard.style.display === 'none' ? 'block' : 'none';
    });

    btnSaveTeam.addEventListener('click', async () => {
        const name = document.getElementById('new-team-name').value;
        if (!name) return alert('El nombre es obligatorio');

        const res = await window.devAPI.createTeam(name);
        if (res.success) {
            alert('Equipo creado con éxito. Copia el ID desde la consola o DB.');
            document.getElementById('new-team-name').value = '';
            createTeamCard.style.display = 'none';
        } else {
            alert('Error: ' + res.message);
        }
    });

    // --- Registrar Juego ---
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
        if (!teamId) {
            teamGamesList.innerHTML = '';
            return;
        }
        const res = await window.devAPI.getGamesForTeam(teamId);
        if (res.success) {
            const games = res.data;
            if (games.length === 0) {
                teamGamesList.innerHTML = '<p class="empty-msg">Este equipo no tiene juegos registrados.</p>';
                return;
            }
            teamGamesList.innerHTML = games.map(game => `
                <div class="game-card ${game.gameIsPublic ? 'public' : 'private'}">
                    <div class="game-info">
                        <strong>${game.gameName}</strong>
                        <span class="game-price-tag">${game.itsFree ? 'GRATIS' : `$${game.price}`}</span>
                        <code class="mini-id">${game.gameId}</code>
                    </div>
                    <div class="game-actions">
                        <button onclick="copyToClipboard('${game.gameId}')" class="btn-icon" title="Copiar ID">📋</button>
                        <button onclick="setGamePublic('${teamId}', '${game.gameId}')" class="btn-icon" title="Visibilidad">🌐</button>
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
            alert('Estado de visibilidad actualizado');
            loadGamesForTeam(teamId);
        } else {
            alert('Error al actualizar visibilidad');
        }
    };

    btnCreateGame.addEventListener('click', async () => {
        const teamId = selectGameTeam.value;
        const gameData = {
            GameName: document.getElementById('game-name').value,
            GameDescription: document.getElementById('game-desc').value,
            ExeName: document.getElementById('game-exe').value,
            ItsFree: checkIsFree.checked,
            Price: parseFloat(document.getElementById('game-price').value || 0)
        };

        if (!teamId || !gameData.GameName) return alert('Equipo y nombre son obligatorios');

        const res = await window.devAPI.createGame(teamId, gameData);
        alert(res.message || 'Juego procesado');
        if (res.success) loadGamesForTeam(teamId);
    });

    // --- Subida de Archivos ---
    let selectedFilePath = null;
    const btnSelectFile = document.getElementById('btn-select-file');
    const pathLabel = document.getElementById('selected-file-path');
    const btnStartUpload = document.getElementById('btn-start-upload');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressFill = document.getElementById('upload-progress-fill');

    btnSelectFile.addEventListener('click', async () => {
        const path = await window.devAPI.openFile();
        if (path) {
            selectedFilePath = path;
            pathLabel.textContent = path;
        }
    });

    const selectUploadTeam = document.getElementById('upload-team-id');
    const selectUploadGame = document.getElementById('upload-game-id');

    selectUploadTeam.addEventListener('change', async (e) => {
        const teamId = e.target.value;
        if (!teamId) {
            selectUploadGame.innerHTML = '<option value="">Selecciona un equipo primero...</option>';
            return;
        }
        
        selectUploadGame.innerHTML = '<option value="">Cargando juegos...</option>';
        const res = await window.devAPI.getGamesForTeam(teamId);
        if (res.success) {
            if (res.data.length === 0) {
                selectUploadGame.innerHTML = '<option value="">Sin juegos en este equipo</option>';
            } else {
                selectUploadGame.innerHTML = res.data.map(g => 
                    `<option value="${g.gameId}">${g.gameName}</option>`
                ).join('');
            }
        } else {
            selectUploadGame.innerHTML = '<option value="">Error al cargar juegos</option>';
        }
    });

    btnStartUpload.addEventListener('click', async () => {
        const teamId = selectUploadTeam.value;
        const gameId = selectUploadGame.value;
        const version = document.getElementById('upload-version').value;
        const desc = document.getElementById('upload-desc').value;

        if (!selectedFilePath || !teamId || !gameId || !version) {
            return alert('Completa todos los campos (equipo, juego, versión y archivo)');
        }

        progressContainer.style.display = 'block';
        btnStartUpload.disabled = true;

        const res = await window.devAPI.uploadGame({
            teamId,
            gameId,
            version: document.getElementById('upload-version').value,
            filePath: selectedFilePath,
            description: desc
        });

        if (res.success) {
            alert('¡Versión publicada con éxito!');
            progressContainer.style.display = 'none';
            btnStartUpload.disabled = false;
            // location.reload(); // Evitar recarga si queremos seguir interactuando
        } else {
            alert('Error en la subida: ' + res.error);
            progressContainer.style.display = 'none';
            btnStartUpload.disabled = false;
        }
    });

    // --- Cargar Equipos ---
    const teamsList = document.getElementById('teams-list');

    const getRevokedReasonText = (reasonCode) => {
        const reasons = {
            0: "Virus detectado",
            1: "Eliminado por el usuario",
            2: "Baneado por administración",
            3: "Equipo disuelto"
        };
        return reasons[reasonCode] || "Violación de términos";
    };

    const loadTeams = async () => {
        const res = await window.devAPI.getTeams();
        if (res.success) {
            const teams = res.data;
            
            // Rellenar los dropdowns de selección de equipo
            const dropdowns = document.querySelectorAll('.team-selector-dropdown');
            dropdowns.forEach(dropdown => {
                const activeTeams = teams.filter(t => !t.itsRevoked);
                if (activeTeams.length === 0) {
                    dropdown.innerHTML = '<option value="">No tienes equipos activos</option>';
                } else {
                    dropdown.innerHTML = activeTeams.map(t => 
                        `<option value="${t.teamId}">${t.teamName}</option>`
                    ).join('');
                }
            });

            if (!teams || teams.length === 0) {
                teamsList.innerHTML = '<p class="empty-msg">No tienes equipos creados aún.</p>';
                return;
            }

            teamsList.innerHTML = teams.map(team => `
                <div class="team-card ${team.itsRevoked ? 'revoked' : ''}">
                    <div class="team-info">
                        <h4>
                            ${team.teamName} 
                            ${team.itsRevoked ? '<span class="badge-revoked">REVOCADO</span>' : ''}
                        </h4>
                        <span class="team-id">ID: ${team.teamId}</span>
                        ${team.itsRevoked ? `<p class="revoked-reason">Motivo: ${getRevokedReasonText(team.revokedReason)}</p>` : ''}
                    </div>
                    <div class="team-actions">
                        <button onclick="copyToClipboard('${team.teamId}')" title="Copiar ID" class="btn-icon">📋</button>
                        ${!team.itsRevoked ? `<button onclick="changeName('${team.teamId}')" title="Cambiar Nombre" class="btn-icon">✏️</button>` : ''}
                        <button onclick="confirmDeleteTeam('${team.teamId}')" title="Borrar Equipo" class="btn-icon btn-delete">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    };

    window.confirmDeleteTeam = async (id) => {
        if (confirm('¿Estás seguro de que quieres disolver este equipo? Los juegos asociados dejarán de ser públicos.')) {
            const res = await window.devAPI.deleteTeam(id);
            if (res.success) {
                alert('Equipo disuelto con éxito');
                loadTeams();
            } else {
                alert('Error al borrar: ' + res.error);
            }
        }
    };

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('ID copiado al portapapeles');
    };

    window.changeName = async (id) => {
        const newName = prompt('Introduce el nuevo nombre del equipo:');
        if (newName) {
            const res = await window.devAPI.changeTeamName(id, newName);
            alert(res.message);
            loadTeams();
        }
    };

    // Inicialización
    if (await window.devAPI.getEmail()) {
        await window.devAPI.refreshSession(); // Renovar sesión al arrancar
        await checkAuth();
        await loadTeams();
    }
});
