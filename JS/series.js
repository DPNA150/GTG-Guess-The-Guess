const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

let series = {};
let seriesList = [];
let allHintsRevealed = false;
let tentativas = 13;

async function loadSeriesData() {
    console.log('[series.js] Carregando series.json...');

    try {
        const response = await fetch('/BD/series.json'); // Faz o fetch do JSON.

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} — ${response.statusText}`);
        }

        seriesList = await response.json();

        console.log(`[series.js] series.json carregado — total de itens: ${seriesList.length}`);

        seriesList = seriesList.filter(
            s => s && typeof s.title === 'string'
        );

        console.log(`[series.js] títulos válidos: ${seriesList.length}`);

    } catch (err) {
        console.error('[series.js] Erro ao carregar series.json:', err);
        seriesList = [];
    } finally {
        initSuggestions();

        if (seriesList.length > 0) {
            series = selectRandomSeries(seriesList);
        }
    }
}

function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');

    if (!input || !suggestionsList) {
        console.warn('[series.js] initSuggestions: elementos DOM não encontrados');
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

            const titulos = seriesList
                .map(s => s.title && s.title.trim())
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

function selectRandomSeries(seriesArray) {
    const randomIndex = Math.floor(Math.random() * seriesArray.length);
    return seriesArray[randomIndex];
}

function checkGuess(guessedSeries) {
    if (guessedSeries.title === series.title) {
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

        const guessedTitle = guessedSeries && guessedSeries.title;

        if (guessedTitle) {
            if (series.diretor === guessedSeries.diretor) {
                updateHint(
                    'hint1',
                    `- Diretor: ${series.diretor}`
                );
            }

            if (series.genero === guessedSeries.genero) {
                updateHint(
                    'hint2',
                    `- Gênero: ${series.genero}`
                );
            }

            if (series.protagonista === guessedSeries.protagonista) {
                updateHint(
                    'hint3',
                    `- Protagonista: ${series.protagonista}`
                );
            }
        }
    }

    document.getElementById('tentativas').innerHTML =
        'Tentativas restantes: ' + tentativas + '/13';

    if (tentativas == 9) revealHint();
    else if (tentativas == 6) revealHint();
    else if (tentativas == 3) revealHint();
    else if (tentativas == 1) revealHint();
}

function revealAllHints() {
    updateHint('nomeFCerto', `- Série: ${series.title}`);
    updateHint('hint1', `- Diretor: ${series.diretor}`);
    updateHint('hint2', `- Gênero: ${series.genero}`);
    updateHint('hint3', `- Protagonista: ${series.protagonista}`);
    updateHint('hint4', `- Sinopse: ${series.sinopse}`);

    allHintsRevealed = true;
    tentativas = 0;

    document.getElementById('tentativas').innerHTML =
        'Tentativas restantes: 0/13';
}

function startNewGame() {
    series = selectRandomSeries(seriesList);

    allHintsRevealed = false;
    tentativas = 13;

    const guessInput = document.getElementById('guessInput');

    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('nomeFCerto', '- Série: ???');
    updateHint('hint1', '- Diretor: ???');
    updateHint('hint2', '- Gênero: ???');
    updateHint('hint3', '- Protagonista: ???');
    updateHint('hint4', '- Sinopse: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';

    document.getElementById('tentativas').innerHTML =
        'Tentativas restantes: 13/13';
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
        {
            id: 'hint1',
            text: `- Diretor: ${series.diretor}`
        },
        {
            id: 'hint2',
            text: `- Gênero: ${series.genero}`
        },
        {
            id: 'hint3',
            text: `- Protagonista: ${series.protagonista}`
        }
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
        updateHint('hint4', `- Sinopse: ${series.sinopse}`);
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML =
        'Tentativas restantes: ' + tentativas + '/13';
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

                const guessedSeries =
                    seriesList.find(s => s.title === guess);

                if (guessedSeries) {
                    checkGuess(guessedSeries);
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

            const guessedSeries =
                seriesList.find(s => s.title === guess);

            if (guessedSeries) {
                checkGuess(guessedSeries);
            } else {
                alert('Objeto não encontrado no banco de dados. Tente novamente!');
            }

            guessInput.value = '';
        });
    }

    loadSeriesData();
});