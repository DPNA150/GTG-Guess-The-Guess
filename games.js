// games.js — padronizado com filmes.js / animacoes.js / esportes.js

// Configurações
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

// Variáveis globais
let game = {}; // Objeto para armazenar o game atual
let gamesList = []; // Lista de todos os games carregados
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 12; // tentativas iniciais

// ------------ Funções principais ------------
// Carrega o JSON de games e inicializa tudo
async function loadGameData() {
    console.log('[games.js] Carregando games.json...');
    try {
        const response = await fetch('games.json');
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        gamesList = await response.json();
        console.log(`[games.js] games.json carregado — total: ${gamesList.length}`);

        // filtra objetos válidos
        gamesList = gamesList.filter(g => g && typeof g.title === 'string');
        console.log(`[games.js] títulos válidos: ${gamesList.length}`);

    } catch (err) {
        console.error('[games.js] Erro ao carregar games.json:', err);
        gamesList = [];
    } finally {
        initSuggestions();
        if (gamesList.length > 0) game = selectRandomGame(gamesList);
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');
    if (!input || !suggestionsList) {
        console.warn('[games.js] initSuggestions: elementos DOM não encontrados');
        return;
    }

    let debounceTimer = null;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const termo = input.value.trim().toLowerCase();
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';

            if (termo.length === 0) return;

            const titulos = gamesList
                .map(g => g.title && g.title.trim())
                .filter(Boolean);

            const filtrados = Array.from(new Set(titulos))
                .filter(title => title.toLowerCase().includes(termo))
                .slice(0, SUGGESTION_LIMIT);

            if (filtrados.length === 0) return;

            filtrados.forEach(title => {
                const li = document.createElement('li');
                li.textContent = title;
                li.classList.add('suggestion-item');
                li.setAttribute('role', 'option');
                li.setAttribute('tabindex', '0');

                li.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    input.value = title;
                    suggestionsList.innerHTML = '';
                    suggestionsList.style.display = 'none';
                    input.focus();
                });

                li.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        input.value = title;
                        suggestionsList.innerHTML = '';
                        suggestionsList.style.display = 'none';
                        input.focus();
                    }
                });

                suggestionsList.appendChild(li);
            });

            suggestionsList.style.display = 'block';
        }, DEBOUNCE_MS);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }, 150);
    });
}

// Seleciona um game aleatório
function selectRandomGame(games) {
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
}

// ------------ Funções do jogo ------------
function checkGuess(guessedGame) {
    const feedback = document.getElementById('feedback');

    if (guessedGame.title === game.title) {
        feedback.textContent = `Parabéns! Você acertou: ${game.title}`;
        feedback.className = 'feedback correct';
        revealAllHints();
        document.getElementById('hintButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        tentativas = 0;
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else if (tentativas === 1) {
        feedback.textContent = `Você Perdeu! O game era: ${game.title}`;
        feedback.className = 'feedback incorrect';
        revealAllHints();
        document.getElementById('hintButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else {
        feedback.textContent = 'Palpite incorreto. Tente novamente!';
        feedback.className = 'feedback incorrect';
        tentativas--;
        const guessedTitle = guessedGame && guessedGame.title;
        if (guessedTitle) {
            if (game.estudio === guessedGame.estudio) updateHint('hint1', `- Estúdio criador: ${game.estudio}`);
            if (game.genero === guessedGame.genero) updateHint('hint2', `- Gênero: ${game.genero}`);
            if (game.year === guessedGame.year) updateHint('hint3', `- Ano de lançamento: ${game.year}`);
            if (game.protagonista === guessedGame.protagonista) updateHint('hint4', `- Protagonista: ${game.protagonista}`);
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function revealAllHints() {
    updateHint('hint1', `- Estúdio criador: ${game.estudio}`);
    updateHint('hint2', `- Gênero: ${game.genero}`);
    updateHint('hint3', `- Ano de lançamento: ${game.year}`);
    updateHint('hint4', `- Protagonista: ${game.protagonista}`);
    updateHint('hint5', `- Sinopse: ${game.synopse}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function startNewGame() {
    location.reload();
}

function giveUp() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Você desistiu! O game era: ${game.title}`;
    feedback.className = 'feedback incorrect';
    revealAllHints();
    document.getElementById('hintButton').style.display = 'none';
    document.getElementById('giveUpButton').style.display = 'none';
    const guessInput = document.getElementById('guessInput');
    guessInput.disabled = true;
    guessInput.placeholder = 'O jogo terminou!';
    guessInput.style.backgroundColor = '#f0f0f0';
}

function revealHint() {
    const hints = [
        { id: 'hint1', text: `- Estúdio criador: ${game.estudio}` },
        { id: 'hint2', text: `- Gênero: ${game.genero}` },
        { id: 'hint3', text: `- Ano de lançamento: ${game.year}` },
        { id: 'hint4', text: `- Protagonista: ${game.protagonista}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);
        return hintElement && hintElement.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text);
        tentativas -= 2;
    } else {
        updateHint('hint5', `- Sinopse: ${game.synopse}`);
        allHintsRevealed = true;
        tentativas = 1;
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function updateHint(id, text) {
    const hint = document.getElementById(id);
    if (!hint) return;
    hint.textContent = text;
    hint.classList.add('revealed');
}

// ------------ Inicialização ------------
document.addEventListener('DOMContentLoaded', () => {
    const voltar = document.getElementById('voltar');
    if (voltar) voltar.addEventListener('click', () => window.history.back());

    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) newGameButton.addEventListener('click', startNewGame);

    const giveUpButton = document.getElementById('giveUpButton');
    if (giveUpButton) giveUpButton.addEventListener('click', giveUp);

    const hintButton = document.getElementById('hintButton');
    if (hintButton) hintButton.addEventListener('click', () => {
        revealHint();
    });

    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const guess = guessInput.value.trim();
                const feedback = document.getElementById('feedback');
                const guessedGame = gamesList.find(g => g.title === guess);

                if (guessedGame) {
                    checkGuess(guessedGame);
                } else {
                    if (feedback) {
                        feedback.textContent = 'Game não encontrado. Tente novamente!';
                        feedback.className = 'feedback incorrect';
                        const giveUpBtn = document.getElementById('giveUpButton');
                        if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                    }
                }
                guessInput.value = '';
            }
        });
    }

    const enviarButton = document.getElementById('enviarButton');
    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();
            const feedback = document.getElementById('feedback');
            const guessedGame = gamesList.find(g => g.title === guess);

            if (guessedGame) {
                checkGuess(guessedGame);
            } else {
                if (feedback) {
                    feedback.textContent = 'Game não encontrado. Tente novamente!';
                    feedback.className = 'feedback incorrect';
                    const giveUpBtn = document.getElementById('giveUpButton');
                    if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                }
            }
            guessInput.value = '';
        });
    }

    loadGameData();
});
