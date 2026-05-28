const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

let game = {};
let gamesList = [];
let allHintsRevealed = false;
let tentativas = 12;

async function loadGameData() {
    console.log('[games.js] Carregando games.json...');

    try {
        const response = await fetch('https://dpna150.github.io/GTG-Guess-The-Guess//BD/games.json'); // Faz uma requisição assíncrona para buscar o arquivo 'games.json'.
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        gamesList = await response.json();
        console.log(`[games.js] games.json carregado — total de itens: ${gamesList.length}`);

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

                li.addEventListener('mousedown', ev => {
                    ev.preventDefault();
                    input.value = title;
                    suggestionsList.innerHTML = '';
                    suggestionsList.style.display = 'none';
                    input.focus();
                });

                li.addEventListener('keydown', ev => {
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

function selectRandomGame(games) {
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
}

function checkGuess(guessedGame) {
    if (guessedGame.title === game.title) {
        revealAllHints();

        document.getElementById('giveUpButton').style.display = 'none';
        document.getElementById('enviarButton').style.display = 'none';

        tentativas = 0;

        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else if (tentativas === 1) {
        revealAllHints();

        document.getElementById('enviarButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';

        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else {
        tentativas--;

        const hintsContainer = document.getElementById('hints');

        if (hintsContainer) {
            hintsContainer.classList.add('hints-error');

            setTimeout(() => {
                hintsContainer.classList.remove('hints-error');
            }, 300);
        }

        const guessedTitle = guessedGame && guessedGame.title;

        if (guessedTitle) {
            if (game.genero === guessedGame.genero) {
                updateHint('hint1', `- Gênero: ${game.genero}`);
            }

            if (game.estudio === guessedGame.estudio) {
                updateHint('hint2', `- Estúdio: ${game.estudio}`);
            }

            if (game.year === guessedGame.year) {
                updateHint('hint3', `- Ano de lançamento: ${game.year}`);
            }

            if (game.protagonista === guessedGame.protagonista) {
                updateHint('hint4', `- Protagonista: ${game.protagonista}`);
            }
        }
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';

    if (tentativas == 9) revealHint();
    else if (tentativas == 6) revealHint();
    else if (tentativas == 3) revealHint();
    else if (tentativas == 1) revealHint();
}

function revealAllHints() {
    updateHint('nomeFCerto', `- Game: ${game.title}`);
    updateHint('hint1', `- Gênero: ${game.genero}`);
    updateHint('hint2', `- Estúdio: ${game.estudio}`);
    updateHint('hint3', `- Ano de lançamento: ${game.year}`);
    updateHint('hint4', `- Protagonista: ${game.protagonista}`);
    updateHint('hint5', `- Sinopse: ${game.synopse}`);

    allHintsRevealed = true;
    tentativas = 0;

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function startNewGame() {
    game = selectRandomGame(gamesList);
    allHintsRevealed = false;
    tentativas = 12;

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('nomeFCerto', '- Game: ???');
    updateHint('hint1', '- Gênero: ???');
    updateHint('hint2', '- Estúdio: ???');
    updateHint('hint3', '- Ano de lançamento: ???');
    updateHint('hint4', '- Protagonista: ???');
    updateHint('hint5', '- Sinopse: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function giveUp() {
    revealAllHints();

    document.getElementById('enviarButton').style.display = 'none';
    document.getElementById('giveUpButton').style.display = 'none';

    const guessInput = document.getElementById('guessInput');

    guessInput.disabled = true;
    guessInput.placeholder = 'O jogo terminou!';
    guessInput.style.backgroundColor = '#f0f0f0';
}

function revealHint() {
    const hints = [
        { id: 'hint1', text: `- Gênero: ${game.genero}` },
        { id: 'hint2', text: `- Estúdio: ${game.estudio}` },
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
    } else {
        updateHint('hint5', `- Sinopse: ${game.synopse}`);
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function updateHint(id, text) {
    const hint = document.getElementById(id);

    if (!hint) return;

    hint.textContent = text;
    hint.classList.toggle('revealed');

    setTimeout(() => {
        hint.classList.remove('revealed');
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    const voltar = document.getElementById('voltar');
    if (voltar) voltar.addEventListener('click', () => window.history.back());

    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) newGameButton.addEventListener('click', startNewGame);

    const giveUpButton = document.getElementById('giveUpButton');
    if (giveUpButton) giveUpButton.addEventListener('click', giveUp);

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();

                const guess = guessInput.value.trim();
                const guessedGame = gamesList.find(g => g.title === guess);

                if (guessedGame) {
                    checkGuess(guessedGame);
                } else {
                    alert('Objeto não encontrado no nosso banco de dados. Tente novamente!');
                }

                guessInput.value = '';
            }
        });
    }

    const enviarButton = document.getElementById('enviarButton');

    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();
            const guessedGame = gamesList.find(g => g.title === guess);

            if (guessedGame) {
                checkGuess(guessedGame);
            } else {
                alert('Objeto não encontrado no nosso banco de dados. Tente novamente!');
            }

            guessInput.value = '';
        });
    }

    loadGameData();
});