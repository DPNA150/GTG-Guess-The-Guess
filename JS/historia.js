// historia_comentado.js — versão comentada com efeito de erro visual
// Este arquivo controla o jogo de adivinhação de eventos históricos, incluindo:
// - Carregamento de dados a partir de um arquivo JSON
// - Sistema de dicas progressivas
// - Autocomplete para palpites
// - Verificação de respostas com tentativas limitadas
// - Novo efeito visual: todas as dicas ficam vermelhas por 0,6 segundos quando o jogador erra um palpite.

// ------------------------------ CONFIGURAÇÕES -----------------------------------
const SUGGESTION_LIMIT = 8; // Número máximo de sugestões exibidas no autocomplete.
const DEBOUNCE_MS = 120; // Tempo (em ms) para ativar o autocomplete após digitação.

// ------------------------------ VARIÁVEIS GLOBAIS -------------------------------
let historia = {}; // Objeto que guarda o evento histórico a ser adivinhado.
let historiasList = []; // Lista completa dos eventos históricos do JSON.
let allHintsRevealed = false; // Indica se todas as dicas já foram reveladas.
let tentativas = 12; // Número de tentativas disponíveis.

// ------------------------------ FUNÇÕES PRINCIPAIS -------------------------------

// Carrega o JSON de eventos históricos
async function loadHistoriaData() {
    console.log('[historia.js] Carregando historia.json...');
    try {
        const response = await fetch('https://dpna150.github.io/GTG-Guess-The-Guess//BD/historia.json'); // Faz o fetch do arquivo JSON.
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        historiasList = await response.json(); // Converte o JSON em objeto JS.
        console.log(`[historia.js] historia.json carregado — total: ${historiasList.length}`);

        // Filtra apenas objetos com título válido
        historiasList = historiasList.filter(f => f && typeof f.title === 'string');
        console.log(`[historia.js] Títulos válidos: ${historiasList.length}`);
    } catch (err) {
        console.error('[historia.js] Erro ao carregar historia.json:', err);
        historiasList = []; // Se der erro, deixa a lista vazia.
    } finally {
        initSuggestions(); // Inicializa o autocomplete de qualquer forma.
        if (historiasList.length > 0) historia = selectRandomHistoria(historiasList);
    }
}

// Inicializa o sistema de autocomplete
function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');
    if (!input || !suggestionsList) {
        console.warn('[historia.js] initSuggestions: elementos DOM não encontrados');
        return;
    }

    let debounceTimer = null; // Temporizador para controlar o delay.

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const termo = input.value.trim().toLowerCase();
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';

            if (termo.length === 0) return;

            const titulos = historiasList
                .map(f => f.title && f.title.trim())
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

// Seleciona um evento histórico aleatório
function selectRandomHistoria(historiaList) {
    const randomIndex = Math.floor(Math.random() * historiaList.length);
    return historiaList[randomIndex];
}

// ------------------------------ FUNÇÕES DO JOGO -------------------------------

// Verifica se o palpite do jogador está correto
function checkGuess(guessedHistoria) {
    if (guessedHistoria.title === historia.title) {
        // Caso o palpite esteja correto
        revealAllHints();
        document.getElementById('giveUpButton').style.display = 'none';
        document.getElementById('enviarButton').style.display = 'none';
        tentativas = 0;
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else if (tentativas === 1) {
        // Última tentativa — derrota
        revealAllHints();
        document.getElementById('enviarButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else {
        // Palpite incorreto, mas ainda restam tentativas
        tentativas--; // Decrementa o número de tentativas restantes.

        // >>> EFEITO DE ERRO NAS DICAS <<<
        const hintsContainer = document.getElementById('hints'); // Obtém o contêiner principal das dicas.
        if (hintsContainer) { // Verifica se o contêiner existe.
            hintsContainer.classList.add('hints-error'); // Adiciona a classe CSS que deixa todas as dicas vermelhas.
            setTimeout(() => { // Define um temporizador para reverter o efeito.
                hintsContainer.classList.remove('hints-error'); // Remove a classe após o tempo definido.
            }, 300); // O efeito dura 0,3 segundos.
        }
        // >>> FIM DO EFEITO DE ERRO <<<

        const guessedTitle = guessedHistoria && guessedHistoria.title;
        if (guessedTitle) {
            if (historia.periodo === guessedHistoria.periodo) updateHint('hint1', `- Periodo que Vivel: ${historia.periodo}`);
            if (historia.local === guessedHistoria.local) updateHint('hint2', `- Local que Nasceu: ${historia.local}`);
            if (historia.categoria === guessedhistoria.categoria) updateHint('hint3', `- Categoria/Função: ${historia.categoria}`);
            if (historia.feito === guessedHistoria.feito) updateHint('hint4', `- Maior Feito: ${historia.feito}`);
        }
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';

    if ([12, 8, 4, 1].includes(tentativas)) revealHint();
}

// Revela todas as dicas de uma vez
function revealAllHints() {
    updateHint('nomeFCerto', `- Personalidade Histórica: ${historia.title}`);
    updateHint('hint1', `- Período que Vivel: ${historia.periodo}`);
    updateHint('hint2', `- Local que Nasceu: ${historia.local}`);
    updateHint('hint3', `- Categoria/Função: ${historia.categoria}`);
    updateHint('hint4', `- Maior Feito: ${historia.feito}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: 0/12';
}

// Inicia um novo jogo
function startNewGame() {
    historia = selectRandomHistoria(historiasList);
    allHintsRevealed = false;
    tentativas = 12;

    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('nomeFCerto', `- Personalidade Histórica: ???`);
    updateHint('hint1', '- Período que Vivel: ???');
    updateHint('hint2', '- Local que Nasceu: ???');
    updateHint('hint3', '- Categoria/Função: ???');
    updateHint('hint4', '- Maior Feito: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: 12/12';
}

// Jogador desiste
function giveUp() {
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
        { id: 'hint1', text: `- Período que Vivel: ${historia.periodo}` },
        { id: 'hint2', text: `- Local que Nasceu: ${historia.local}` },
        { id: 'hint3', text: `- Categoria/Função: ${historia.categoria}` },
        { id: 'hint4', text: `- Maior Feito: ${historia.feito}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const el = document.getElementById(hint.id);
        return el && el.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text);
    } else {
        updateHint('nomeFCerto', `- Personalidade Histórica: ${historia.title}`);
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

// Atualiza o texto de uma dica específica
function updateHint(id, text) {
    const hint = document.getElementById(id);
    if (!hint) return;
    hint.textContent = text;
    hint.classList.toggle('revealed');
    setTimeout(() => hint.classList.remove('revealed'), 200);
}

// ------------------------------ INICIALIZAÇÃO -------------------------------
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
                const guessedHistoria = historiasList.find(m => m.title === guess);
                if (guessedHistoria) {
                    checkGuess(guessedHistoria);
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
            const guessedHistoria = historiasList.find(m => m.title === guess);
            if (guessedHistoria) {
                checkGuess(guessedHistoria);
            } else {
                alert("Objeto não encontrado no banco de dados. Tente novamente!");
            }
            guessInput.value = '';
        });
    }

    loadHistoriaData();
});
