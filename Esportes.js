// esportes.js — padronizado com filmes.js / animacoes.js

// Configurações
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

// Variáveis globais
let esporte = {}; // Objeto para armazenar o esporte atual
let esportesList = []; // Lista de todos os esportes carregados
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 9; // tentativas iniciais

// ------------ Funções principais ------------
// Carrega o JSON de esportes e inicializa tudo
async function loadEsportesData() {
    console.log('[esportes.js] Carregando Esportes.json...');
    try {
        const response = await fetch('Esportes.json');
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        esportesList = await response.json();
        console.log(`[esportes.js] Esportes.json carregado — total: ${esportesList.length}`);

        // opcional: filtrar só objetos válidos
        esportesList = esportesList.filter(e => e && typeof e.Nome === 'string');
        console.log(`[esportes.js] títulos válidos: ${esportesList.length}`);

    } catch (err) {
        console.error('[esportes.js] Erro ao carregar Esportes.json:', err);
        esportesList = [];
    } finally {
        initSuggestions();
        if (esportesList.length > 0) esporte = selectRandomEsporte(esportesList);
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');
    if (!input || !suggestionsList) {
        console.warn('[esportes.js] initSuggestions: elementos DOM não encontrados');
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

            const nomes = esportesList
                .map(e => e.Nome && e.Nome.trim())
                .filter(Boolean);

            const filtrados = Array.from(new Set(nomes))
                .filter(nome => nome.toLowerCase().includes(termo))
                .slice(0, SUGGESTION_LIMIT);

            if (filtrados.length === 0) return;

            filtrados.forEach(nome => {
                const li = document.createElement('li');
                li.textContent = nome;
                li.classList.add('suggestion-item');
                li.setAttribute('role', 'option');
                li.setAttribute('tabindex', '0');

                li.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    input.value = nome;
                    suggestionsList.innerHTML = '';
                    suggestionsList.style.display = 'none';
                    input.focus();
                });

                li.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        input.value = nome;
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

// Seleciona um esporte aleatório
function selectRandomEsporte(esportes) {
    const randomIndex = Math.floor(Math.random() * esportes.length);
    return esportes[randomIndex];
}

// ------------ Funções do jogo ------------
function checkGuess(guessedEsporte) {
    const feedback = document.getElementById('feedback');

    if (guessedEsporte.Nome === esporte.Nome) {
        feedback.textContent = `Parabéns! Você acertou: ${esporte.Nome}`;
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
        feedback.textContent = `Você Perdeu! O esporte era: ${esporte.Nome}`;
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
        const guessedNome = guessedEsporte && guessedEsporte.Nome;
        if (guessedNome) {
            if (esporte.ambientePraticado === guessedEsporte.ambientePraticado) updateHint('hint1', `- Ambiente Praticado: ${esporte.ambientePraticado}`);
            if (esporte.criador === guessedEsporte.criador) updateHint('hint2', `- Criador: ${esporte.criador}`);
            if (esporte.year === guessedEsporte.year) updateHint('hint3', `- Ano de Criação: ${esporte.year}`);
            if (esporte.maiorJogador === guessedEsporte.maiorJogador) updateHint('hint4', `- Maior Jogador: ${esporte.maiorJogador}`);
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9';
}

function revealAllHints() {
    updateHint('hint1', `- Ambiente Praticado: ${esporte.ambientePraticado}`);
    updateHint('hint2', `- Criador: ${esporte.criador}`);
    updateHint('hint3', `- Ano de Criação: ${esporte.year}`);
    updateHint('hint4', `- Maior Jogador: ${esporte.maiorJogador}`);
    updateHint('hint5', `- Objetivo do Jogo: ${esporte.objetivo}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9';
}

function startNewGame() {
    location.reload();
}

function giveUp() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Você desistiu! O esporte era: ${esporte.Nome}`;
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
        { id: 'hint1', text: `- Ambiente Praticado: ${esporte.ambientePraticado}` },
        { id: 'hint2', text: `- Criador: ${esporte.criador}` },
        { id: 'hint3', text: `- Ano de Criação: ${esporte.year}` },
        { id: 'hint4', text: `- Maior Jogador: ${esporte.maiorJogador}` }
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
        updateHint('hint5', `- Objetivo do Jogo: ${esporte.objetivo}`);
        allHintsRevealed = true;
        tentativas = 1;
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/9';
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
                const guessedEsporte = esportesList.find(e => e.Nome === guess);

                if (guessedEsporte) {
                    checkGuess(guessedEsporte);
                } else {
                    if (feedback) {
                        feedback.textContent = 'Esporte não encontrado. Tente novamente!';
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
            const guessedEsporte = esportesList.find(e => e.Nome === guess);

            if (guessedEsporte) {
                checkGuess(guessedEsporte);
            } else {
                if (feedback) {
                    feedback.textContent = 'Esporte não encontrado. Tente novamente!';
                    feedback.className = 'feedback incorrect';
                    const giveUpBtn = document.getElementById('giveUpButton');
                    if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                }
            }
            guessInput.value = '';
        });
    }

    loadEsportesData();
});
