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
            checkAuth();
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
    btnCreateGame.addEventListener('click', async () => {
        const teamId = document.getElementById('game-team-id').value;
        const gameData = {
            GameName: document.getElementById('game-name').value,
            GameDescription: document.getElementById('game-desc').value,
            ExeName: document.getElementById('game-exe').value,
            GameIsPublic: true,
            Price: 0
        };

        const res = await window.devAPI.createGame(teamId, gameData);
        alert(res.message);
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

    btnStartUpload.addEventListener('click', async () => {
        const teamId = document.getElementById('upload-team-id').value;
        const gameId = document.getElementById('upload-game-id').value;
        const desc = document.getElementById('upload-desc').value;

        if (!selectedFilePath || !teamId || !gameId) {
            return alert('Completa todos los campos y selecciona un archivo .zip');
        }

        progressContainer.style.display = 'block';
        btnStartUpload.disabled = true;

        const res = await window.devAPI.uploadGame({
            teamId,
            gameId,
            filePath: selectedFilePath,
            description: desc
        });

        if (res.success) {
            alert('¡Versión publicada con éxito!');
            location.reload();
        } else {
            alert('Error en la subida: ' + res.error);
            btnStartUpload.disabled = false;
        }
    });

    // Inicialización
    checkAuth();
});
