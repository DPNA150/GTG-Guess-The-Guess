// historia.js — adaptado do filmes.js

// Configurações
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

// Variáveis globais
let persoHist = {}; // Objeto para armazenar a personalidade atual
let persoHistList = []; // Lista de todas as personalidades carregadas
let allHintsRevealed = false;
let tentativas = 12;

// ------------ Funções principais ------------
// Carrega o JSON de personalidades e inicializa tudo
async function loadPersoHistData() {
    console.log('[historia.js] Carregando historia.json...');
    try {
        const response = await fetch('historia.json');
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        persoHistList = await response.json();
        console.log(`[historia.js] historia.json carregado — total: ${persoHistList.length}`);

        // Filtra apenas itens com title válido
        persoHistList = persoHistList.filter(p => p && typeof p.title === 'string');
        console.log(`[historia.js] títulos válidos: ${persoHistList.length}`);

    } catch (err) {
        console.error('[historia.js] Erro ao carregar historia.json:', err);
        persoHistList = [];
    } finally {
        initSuggestions();
        if (persoHistList.length > 0) persoHist = selectRandomPersoHist(persoHistList);
    }
}

// Inicializa o autocomplete
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

            const titulos = persoHistList
                .map(p => p.title && p.title.trim())
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

// Seleciona uma personalidade aleatória
function selectRandomPersoHist(list) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

// ------------ Funções do jogo ------------
function checkGuess(guessedPersoHist) {
    const feedback = document.getElementById('feedback');

    if (guessedPersoHist.title === persoHist.title) {
        feedback.textContent = `Parabéns! Você acertou: ${persoHist.title}`;
        feedback.className = 'feedback correct';
        revealAllHints();
        document.getElementById('hintButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        tentativas = 0;
        disableInput();
    } else if (tentativas === 1) {
        feedback.textContent = `Você Perdeu! A personalidade era: ${persoHist.title}`;
        feedback.className = 'feedback incorrect';
        revealAllHints();
        document.getElementById('hintButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        disableInput();
    } else {
        feedback.textContent = 'Palpite incorreto. Tente novamente!';
        feedback.className = 'feedback incorrect';
        tentativas--;
        if (persoHist.periodo === guessedPersoHist.periodo) updateHint('hint1', `- Período que viveu: ${persoHist.periodo}`);
        if (persoHist.local === guessedPersoHist.local) updateHint('hint2', `- Local que viveu: ${persoHist.local}`);
        if (persoHist.frase === guessedPersoHist.frase) updateHint('hint3', `- Frase famosa: ${persoHist.frase}`);
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function revealAllHints() {
    updateHint('hint1', `- Período que viveu: ${persoHist.periodo}`);
    updateHint('hint2', `- Local que viveu: ${persoHist.local}`);
    updateHint('hint3', `- Frase famosa: ${persoHist.frase}`);
    updateHint('hint4', `- Maior feito: ${persoHist.feito}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function disableInput() {
    const guessInput = document.getElementById('guessInput');
    guessInput.disabled = true;
    guessInput.placeholder = 'O jogo terminou!';
    guessInput.style.backgroundColor = '#f0f0f0';
}

function startNewGame() {
    location.reload();
}

function giveUp() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Você desistiu! A personalidade era: ${persoHist.title}`;
    feedback.className = 'feedback incorrect';
    revealAllHints();
    document.getElementById('hintButton').style.display = 'none';
    document.getElementById('giveUpButton').style.display = 'none';
    disableInput();
}

function revealHint() {
    const hints = [
        { id: 'hint1', text: `- Período que viveu: ${persoHist.periodo}` },
        { id: 'hint2', text: `- Local que viveu: ${persoHist.local}` },
        { id: 'hint3', text: `- Frase famosa: ${persoHist.frase}` }
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
        updateHint('hint4', `- Maior feito: ${persoHist.feito}`);
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
                const guessedPersoHist = persoHistList.find(p => p.title === guess);

                if (guessedPersoHist) {
                    checkGuess(guessedPersoHist);
                } else {
                    if (feedback) {
                        feedback.textContent = 'Personalidade não encontrada. Tente novamente!';
                        feedback.className = 'feedback incorrect';
                        const giveUpBtn = document.getElementById('giveUpButton');
                        if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                    }
                }
                guessInput.value = '';
            }
        });
    }

    // Botão enviar
    const enviarButton = document.getElementById('enviarButton');
    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();
            const feedback = document.getElementById('feedback');
            const guessedPersoHist = persoHistList.find(p => p.title === guess);

            if (guessedPersoHist) {
                checkGuess(guessedPersoHist);
            } else {
                if (feedback) {
                    feedback.textContent = 'Personalidade não encontrada. Tente novamente!';
                    feedback.className = 'feedback incorrect';
                    const giveUpBtn = document.getElementById('giveUpButton');
                    if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                }
            }
            guessInput.value = '';
        });
    }

    loadPersoHistData();
});
