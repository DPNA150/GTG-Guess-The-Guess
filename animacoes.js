// animacoes.js — padronizado com filmes.js

// Configurações
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

// Variáveis globais
let animacao = {}; // Objeto para armazenar a animação atual
let animacoesList = []; // Lista de todas as animações carregadas
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 12; // tentativas iniciais

// ------------ Funções principais ------------
// Carrega o JSON de animações e inicializa tudo
async function loadAnimacoesData() {
    console.log('[animacoes.js] Carregando animacoes.json...');
    try {
        const response = await fetch('animacoes.json');
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        animacoesList = await response.json();
        console.log(`[animacoes.js] animacoes.json carregado — total: ${animacoesList.length}`);

        // opcional: filtrar só objetos válidos
        animacoesList = animacoesList.filter(a => a && typeof a.title === 'string');
        console.log(`[animacoes.js] títulos válidos: ${animacoesList.length}`);

    } catch (err) {
        console.error('[animacoes.js] Erro ao carregar animacoes.json:', err);
        animacoesList = [];
    } finally {
        initSuggestions();
        if (animacoesList.length > 0) animacao = selectRandomAnimacao(animacoesList);
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');
    if (!input || !suggestionsList) {
        console.warn('[animacoes.js] initSuggestions: elementos DOM não encontrados');
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

            const titulos = animacoesList
                .map(a => a.title && a.title.trim())
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

// Seleciona uma animação aleatória
function selectRandomAnimacao(animacoes) {
    const randomIndex = Math.floor(Math.random() * animacoes.length);
    return animacoes[randomIndex];
}

// ------------ Funções do jogo ------------
function checkGuess(guessedAnimacao) {
    const feedback = document.getElementById('feedback');

    if (guessedAnimacao.title === animacao.title) {
        feedback.textContent = `Parabéns! Você acertou: ${animacao.title}`;
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
        feedback.textContent = `Você Perdeu! A animação era: ${animacao.title}`;
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
        const guessedTitle = guessedAnimacao && guessedAnimacao.title;
        if (guessedTitle) {
            if (animacao.genre === guessedAnimacao.genre) updateHint('hint1', `- Gênero: ${animacao.genre}`);
            if (animacao.director === guessedAnimacao.director) updateHint('hint2', `- Diretor: ${animacao.director}`);
            if (animacao.year === guessedAnimacao.year) updateHint('hint3', `- Ano de lançamento: ${animacao.year}`);
            if (animacao.MainCharacter === guessedAnimacao.MainCharacter) updateHint('hint4', `- Protagonista: ${animacao.MainCharacter}`);
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function revealAllHints() {
    updateHint('hint1', `- Diretor: ${animacao.director}`);
    updateHint('hint2', `- Gênero: ${animacao.genre}`);
    updateHint('hint3', `- Protagonista: ${animacao.MainCharacter}`);
    updateHint('hint4', `- Sinopse: ${animacao.synopsis}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

function startNewGame() {
    location.reload();
}

function giveUp() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Você desistiu! A animação era: ${animacao.title}`;
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
        { id: 'hint1', text: `- Diretor: ${animacao.director}` },
        { id: 'hint2', text: `- Gênero: ${animacao.genre}` },
        { id: 'hint3', text: `- Protagonista: ${animacao.MainCharacter}` }
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
        updateHint('hint4', `- Sinopse: ${animacao.synopsis}`);
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
                const guessedAnimacao = animacoesList.find(a => a.title === guess);

                if (guessedAnimacao) {
                    checkGuess(guessedAnimacao);
                } else {
                    if (feedback) {
                        feedback.textContent = 'Animação não encontrada. Tente novamente!';
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
            const guessedAnimacao = animacoesList.find(a => a.title === guess);

            if (guessedAnimacao) {
                checkGuess(guessedAnimacao);
            } else {
                if (feedback) {
                    feedback.textContent = 'Animação não encontrada. Tente novamente!';
                    feedback.className = 'feedback incorrect';
                    const giveUpBtn = document.getElementById('giveUpButton');
                    if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                }
            }
            guessInput.value = '';
        });
    }

    loadAnimacoesData();
});
