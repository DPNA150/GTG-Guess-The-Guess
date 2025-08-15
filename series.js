// series.js — padronizado com filmes.js / animacoes.js / esportes.js / games.js

// Configurações
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

// Variáveis globais
let serie = {}; // Objeto para armazenar a série atual
let seriesList = []; // Lista de todas as séries carregadas
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 12; // tentativas iniciais

// ------------ Funções principais ------------
// Carrega o JSON de séries e inicializa tudo
async function loadSeriesData() {
    console.log('[series.js] Carregando series.json...');
    try {
        const response = await fetch('series.json');
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        seriesList = await response.json();
        console.log(`[series.js] series.json carregado — total: ${seriesList.length}`);

        // filtra objetos válidos
        seriesList = seriesList.filter(s => s && typeof s.title === 'string');
        console.log(`[series.js] títulos válidos: ${seriesList.length}`);

    } catch (err) {
        console.error('[series.js] Erro ao carregar series.json:', err);
        seriesList = [];
    } finally {
        initSuggestions();
        if (seriesList.length > 0) serie = selectRandomSeries(seriesList);
    }
}

// Inicializa o sistema de sugestões (autocomplete)
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

// Seleciona uma série aleatória
function selectRandomSeries(series) {
    const randomIndex = Math.floor(Math.random() * series.length);
    return series[randomIndex];
}

// ------------ Funções do jogo ------------
function checkGuess(guessedSerie) {
    const feedback = document.getElementById('feedback');

    if (guessedSerie.title === serie.title) {
        feedback.textContent = `Parabéns! Você acertou: ${serie.title}`;
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
        feedback.textContent = `Você Perdeu! A série era: ${serie.title}`;
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
        const guessedTitle = guessedSerie && guessedSerie.title;
        if (guessedTitle) {
            if (serie.diretor === guessedSerie.diretor) updateHint('hint1', `- Diretor: ${serie.diretor}`);
            if (serie.genero === guessedSerie.genero) updateHint('hint2', `- Gênero: ${serie.genero}`);
            if (serie.protagonista === guessedSerie.protagonista) updateHint('hint3', `- Protagonista: ${serie.protagonista}`);
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function revealAllHints() {
    updateHint('hint1', `- Diretor: ${serie.diretor}`);
    updateHint('hint2', `- Gênero: ${serie.genero}`);
    updateHint('hint3', `- Protagonista: ${serie.protagonista}`);
    updateHint('hint4', `- Sinopse: ${serie.sinopse}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function startNewGame() {
    location.reload();
}

function giveUp() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Você desistiu! A série era: ${serie.title}`;
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
        { id: 'hint1', text: `- Diretor: ${serie.diretor}` },
        { id: 'hint2', text: `- Gênero: ${serie.genero}` },
        { id: 'hint3', text: `- Protagonista: ${serie.protagonista}` }
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
        updateHint('hint4', `- Sinopse: ${serie.sinopse}`);
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
                const guessedSerie = seriesList.find(s => s.title === guess);

                if (guessedSerie) {
                    checkGuess(guessedSerie);
                } else {
                    if (feedback) {
                        feedback.textContent = 'Série não encontrada. Tente novamente!';
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
            const guessedSerie = seriesList.find(s => s.title === guess);

            if (guessedSerie) {
                checkGuess(guessedSerie);
            } else {
                if (feedback) {
                    feedback.textContent = 'Série não encontrada. Tente novamente!';
                    feedback.className = 'feedback incorrect';
                    const giveUpBtn = document.getElementById('giveUpButton');
                    if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                }
            }
            guessInput.value = '';
        });
    }

    loadSeriesData();
});
