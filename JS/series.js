// series_comentado.js — versão completa e comentada com efeito de erro visual
// Este arquivo gerencia o jogo de adivinhação de séries, incluindo:
// - Carregamento do arquivo JSON com as séries
// - Sistema de autocomplete para palpites
// - Controle de tentativas e dicas
// - Efeito visual: todas as dicas ficam vermelhas temporariamente quando o jogador erra.

// ---------------------- CONFIGURAÇÕES ----------------------
const SUGGESTION_LIMIT = 8; // Número máximo de sugestões exibidas no autocomplete.
const DEBOUNCE_MS = 120; // Tempo de espera (ms) para o autocomplete responder após digitação.

// ---------------------- VARIÁVEIS GLOBAIS ----------------------
let serie = {}; // Objeto que armazena a série sorteada.
let seriesList = []; // Lista de todas as séries carregadas do arquivo JSON.
let allHintsRevealed = false; // Indica se todas as dicas já foram reveladas.
let tentativas = 13; // Total de tentativas disponíveis no início do jogo.

// ---------------------- FUNÇÕES PRINCIPAIS ----------------------

// Carrega o arquivo JSON com as séries
async function loadserieData() {
    console.log('[series.js] Carregando series.json...');
    try {
        const response = await fetch('/BD/series.json'); // Faz o fetch do JSON.
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        seriesList = await response.json(); // Converte a resposta para objeto JS.
        console.log(`[series.js] series.json carregado — total de itens: ${seriesList.length}`);

        // Garante que apenas séries com título válido sejam mantidas
        seriesList = seriesList.filter(f => f && typeof f.title === 'string');
        console.log(`[series.js] títulos válidos: ${seriesList.length}`);
    } catch (err) {
        console.error('[series.js] Erro ao carregar series.json:', err);
        seriesList = []; // Se falhar, mantém a lista vazia.
    } finally {
        initSuggestions(); // Inicializa o autocomplete.
        if (seriesList.length > 0) serie = selectRandomserie(seriesList); // Sorteia uma série aleatória.
    }
}

// ---------------------- AUTOCOMPLETE ----------------------
function initSuggestions() {
    const input = document.getElementById('guessInput'); // Campo de entrada.
    const suggestionsList = document.getElementById('suggestions'); // Lista de sugestões.

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

            const titulos = seriesList.map(f => f.title && f.title.trim()).filter(Boolean);
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

// ---------------------- FUNÇÕES DO JOGO ----------------------

// Sorteia uma série aleatória da lista
function selectRandomserie(series) {
    const randomIndex = Math.floor(Math.random() * series.length);
    return series[randomIndex];
}

// Verifica o palpite do jogador
function checkGuess(guessedserie) {
    if (guessedserie.title === serie.title) {
        // ✅ Palpite correto
        revealAllHints();
        document.getElementById('giveUpButton').style.display = 'none';
        document.getElementById('enviarButton').style.display = 'none';
        tentativas = 0;
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else if (tentativas === 1) {
        // ❌ Última tentativa — derrota
        revealAllHints();
        document.getElementById('enviarButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else {
        // ❌ Palpite incorreto (com tentativas restantes)
        tentativas--; // Diminui o contador.

        // >>> EFEITO DE ERRO NAS DICAS <<<
        const hintsContainer = document.getElementById('hints'); // Obtém o contêiner das dicas.
        if (hintsContainer) { // Verifica se existe o elemento.
            hintsContainer.classList.add('hints-error'); // Aplica a classe CSS que deixa as dicas vermelhas.
            setTimeout(() => {
                hintsContainer.classList.remove('hints-error'); // Remove a classe após 0,3s.
            }, 300);
        }
        // >>> FIM DO EFEITO DE ERRO <<<

        const guessedTitle = guessedserie && guessedserie.title;
        if (guessedTitle) {
            // Verifica semelhanças e revela parcialmente as dicas
            if (serie.diretor === guessedserie.diretor) updateHint('hint1', `- Diretor: ${serie.diretor}`);
            if (serie.genero === guessedserie.genero) updateHint('hint2', `- Gênero: ${serie.genero}`);
            if (serie.protagonista === guessedserie.protagonista) updateHint('hint3', `- Protagonista: ${serie.protagonista}`);
        }
    }

    document.getElementById('tentativas').innerHTML = 'Tentativas restantes: ' + tentativas + '/13';

    if (tentativas === 8 || tentativas === 4 || tentativas === 1) revealHint(); // Mostra uma dica em pontos específicos.
}

// Revela todas as dicas de uma vez
function revealAllHints() {
    updateHint('hint1', `- Diretor: ${serie.diretor}`);
    updateHint('hint2', `- Gênero: ${serie.genero}`);
    updateHint('hint3', `- Protagonista: ${serie.protagonista}`);
    updateHint('hint4', `- Sinopse: ${serie.sinopse}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'Tentativas restantes: 0/13';
}

// Reinicia o jogo
function startNewGame() {
    serie = selectRandomserie(seriesList);
    allHintsRevealed = false;
    tentativas = 13;

    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('hint1', '- Diretor: ???');
    updateHint('hint2', '- Gênero: ???');
    updateHint('hint3', '- Protagonista: ???');
    updateHint('hint4', '- Sinopse: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';
    document.getElementById('tentativas').innerHTML = 'Tentativas restantes: 13/13';
}

// Jogador desiste
function giveUp() {
    alert(`Você desistiu! A resposta era: ${serie.title}`);
    revealAllHints();
    document.getElementById('enviarButton').style.display = 'none';
    document.getElementById('giveUpButton').style.display = 'none';
    const guessInput = document.getElementById('guessInput');
    guessInput.disabled = true;
    guessInput.placeholder = 'O jogo terminou!';
    guessInput.style.backgroundColor = '#f0f0f0';
}

// Revela uma dica aleatória
function revealHint() {
    const hints = [
        { id: 'hint1', text: `- Diretor: ${serie.diretor}` },
        { id: 'hint2', text: `- Gênero: ${serie.genero}` },
        { id: 'hint3', text: `- Protagonista: ${serie.protagonista}` },
        { id: 'hint4', text: `- Sinopse: ${serie.sinopse}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const el = document.getElementById(hint.id);
        return el && el.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text);
    } else {
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML = 'Tentativas restantes: ' + tentativas + '/13';
}

// Atualiza o texto de uma dica específica
function updateHint(id, text) {
    const hint = document.getElementById(id);
    if (!hint) return;
    hint.textContent = text;
    hint.classList.toggle("revealed");
    setTimeout(() => hint.classList.remove("revealed"), 200);
}

// ---------------------- INICIALIZAÇÃO ----------------------
document.addEventListener('DOMContentLoaded', () => {
    const voltar = document.getElementById('voltar');
    if (voltar) voltar.addEventListener('click', () => window.history.back());

    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) newGameButton.addEventListener('click', startNewGame);

    const giveUpButton = document.getElementById('giveUpButton');
    if (giveUpButton) giveUpButton.addEventListener('click', giveUp);

    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const guess = guessInput.value.trim();
                const guessedserie = seriesList.find(m => m.title === guess);
                if (guessedserie) {
                    checkGuess(guessedserie);
                } else {
                    alert("Objeto não encontrado no banco de dados. Tente novamente!");
                }
                guessInput.value = '';
            }
        });
    }

    const enviarButton = document.getElementById('enviarButton');
    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();
            const guessedserie = seriesList.find(m => m.title === guess);
            if (guessedserie) {
                checkGuess(guessedserie);
            } else {
                alert("Objeto não encontrado no banco de dados. Tente novamente!");
            }
            guessInput.value = '';
        });
    }

    loadserieData();
});
