const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

let historyCharacter = {};
let historyCharactersList = [];
let allHintsRevealed = false;
let tentativas = 12;

async function loadHistoryData() {
    console.log('[historia.js] Carregando historia.json...');

    try {
        const response = await fetch('https://dpna150.github.io/GTG-Guess-The-Guess//BD/historia.json'); // Faz o fetch do arquivo JSON.

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} — ${response.statusText}`);
        }

        historyCharactersList = await response.json();

        console.log(`[historia.js] historia.json carregado — total: ${historyCharactersList.length}`);

        historyCharactersList = historyCharactersList.filter(
            h => h && typeof h.title === 'string'
        );

        console.log(`[historia.js] títulos válidos: ${historyCharactersList.length}`);

    } catch (err) {
        console.error('[historia.js] Erro ao carregar historia.json:', err);
        historyCharactersList = [];
    } finally {
        initSuggestions();

        if (historyCharactersList.length > 0) {
            historyCharacter = selectRandomHistoryCharacter(historyCharactersList);
        }
    }
}

function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');

    if (!input || !suggestionsList) {
        console.warn('[historia.js] initSuggestions: elementos DOM não encontrados');
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

            const titulos = historyCharactersList
                .map(h => h.title && h.title.trim())
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

function selectRandomHistoryCharacter(historyList) {
    const randomIndex = Math.floor(Math.random() * historyList.length);
    return historyList[randomIndex];
}

function checkGuess(guessedHistoryCharacter) {
    if (guessedHistoryCharacter.title === historyCharacter.title) {
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

        const guessedTitle =
            guessedHistoryCharacter && guessedHistoryCharacter.title;

        if (guessedTitle) {
            if (historyCharacter.periodo === guessedHistoryCharacter.periodo) {
                updateHint('hint1', `- Período em que viveu: ${historyCharacter.periodo}`
                );
            }

            if (historyCharacter.local === guessedHistoryCharacter.local) {
                updateHint('hint2', `- Local de nascimento: ${historyCharacter.local}`
                );
            }

            if (historyCharacter.categoria === guessedHistoryCharacter.categoria) {
                updateHint('hint3', `- Categoria/Função: ${historyCharacter.categoria}`
                );
            }

            if (historyCharacter.feito === guessedHistoryCharacter.feito) {
                updateHint('hint4', `- Maior feito: ${historyCharacter.feito}`
                );
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
    updateHint(
        'nomeFCerto',
        `- Personalidade Histórica: ${historyCharacter.title}`
    );

    updateHint('hint1', `- Período em que viveu: ${historyCharacter.periodo}`);
    updateHint('hint2', `- Local de nascimento: ${historyCharacter.local}`);
    updateHint('hint3', `- Categoria/Função: ${historyCharacter.categoria}`);
    updateHint('hint4', `- Maior feito: ${historyCharacter.feito}`);

    allHintsRevealed = true;
    tentativas = 0;

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: 0/12';
}

function startNewGame() {
    historyCharacter = selectRandomHistoryCharacter(historyCharactersList);

    allHintsRevealed = false;
    tentativas = 12;

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('nomeFCerto', '- Personalidade Histórica: ???');
    updateHint('hint1', '- Período em que viveu: ???');
    updateHint('hint2', '- Local de nascimento: ???');
    updateHint('hint3', '- Categoria/Função: ???');
    updateHint('hint4', '- Maior feito: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: 12/12';
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
        { id: 'hint1', text: `- Período em que viveu: ${historyCharacter.periodo}` },
        { id: 'hint2', text: `- Local de nascimento: ${historyCharacter.local}` },
        { id: 'hint3', text: `- Categoria/Função: ${historyCharacter.categoria}` },
        { id: 'hint4', text: `- Maior feito: ${historyCharacter.feito}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);

        return hintElement && hintElement.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint =
            unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];

        updateHint(randomHint.id, randomHint.text);

    } else {
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML =
        'tentativas restantes: ' + tentativas + '/12';
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

    if (voltar) {
        voltar.addEventListener('click', () => window.history.back());
    }

    const newGameButton = document.getElementById('newGameButton');

    if (newGameButton) {
        newGameButton.addEventListener('click', startNewGame);
    }

    const giveUpButton = document.getElementById('giveUpButton');

    if (giveUpButton) {
        giveUpButton.addEventListener('click', giveUp);
    }

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();

                const guess = guessInput.value.trim();

                const guessedHistoryCharacter =
                    historyCharactersList.find(h => h.title === guess);

                if (guessedHistoryCharacter) {
                    checkGuess(guessedHistoryCharacter);
                } else {
                    alert('Objeto não encontrado no banco de dados. Tente novamente!');
                }

                guessInput.value = '';
            }
        });
    }

    const enviarButton = document.getElementById('enviarButton');

    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();

            const guessedHistoryCharacter =
                historyCharactersList.find(h => h.title === guess);

            if (guessedHistoryCharacter) {
                checkGuess(guessedHistoryCharacter);
            } else {
                alert('Objeto não encontrado no banco de dados. Tente novamente!');
            }

            guessInput.value = '';
        });
    }

    loadHistoryData();
});