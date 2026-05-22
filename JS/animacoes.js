// animacoes.js — totalmente comentado linha a linha
// Gerencia o jogo de adivinhação de animações: carregamento, lógica, tentativas e dicas.

// ---------------- CONFIGURAÇÕES INICIAIS ----------------

// Define o número máximo de sugestões exibidas no autocomplete
const SUGGESTION_LIMIT = 8;

// Define o tempo de espera (em milissegundos) entre a digitação e o carregamento das sugestões
const DEBOUNCE_MS = 120;

// ---------------- VARIÁVEIS GLOBAIS ----------------

// Objeto que armazenará os dados da animação atual do jogo
let animacao = {};

// Lista completa de animações carregadas do arquivo animacoes.json
let animacaosList = [];

// Indica se todas as dicas já foram reveladas
let allHintsRevealed = false;

// Número de tentativas restantes do jogador
let tentativas = 12;

// ---------------- FUNÇÃO PRINCIPAL DE CARREGAMENTO ----------------

// Função assíncrona que busca o arquivo animacoes.json e carrega os dados
async function loadanimacaoData() {
    console.log('[animacoes.js] Carregando animacoes.json...'); // Exibe log no console

    try {
        const response = await fetch('/BD/animacoes.json'); // Faz a requisição do arquivo JSON
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`); // Verifica erro HTTP

        animacaosList = await response.json(); // Converte resposta para JSON
        console.log(`[animacoes.js] animacoes.json carregado — total de itens: ${animacaosList.length}`); // Loga quantidade total

        animacaosList = animacaosList.filter(f => f && typeof f.title === 'string'); // Filtra apenas os objetos válidos
        console.log(`[animacoes.js] títulos válidos: ${animacaosList.length}`); // Exibe quantidade de válidos

    } catch (err) {
        console.error('[animacoes.js] Erro ao carregar animacoes.json:', err); // Exibe erro no console
        animacaosList = []; // Define lista vazia em caso de falha
    } finally {
        initSuggestions(); // Inicializa o sistema de sugestões
        if (animacaosList.length > 0) animacao = selectRandomanimacao(animacaosList); // Escolhe uma animação aleatória
    }
}

// ---------------- FUNÇÃO DE AUTOCOMPLETE ----------------

// Configura o sistema de autocomplete baseado no input do usuário
function initSuggestions() {
    const input = document.getElementById('guessInput'); // Obtém o campo de entrada
    const suggestionsList = document.getElementById('suggestions'); // Obtém a lista de sugestões

    if (!input || !suggestionsList) { // Verifica se os elementos existem
        console.warn('[animacoes.js] initSuggestions: elementos DOM não encontrados');
        return;
    }

    let debounceTimer = null; // Timer para evitar chamadas repetidas rápidas

    // Evento de digitação no campo de entrada
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer); // Cancela o timer anterior
        debounceTimer = setTimeout(() => { // Define novo timer
            const termo = input.value.trim().toLowerCase(); // Obtém o texto digitado
            suggestionsList.innerHTML = ''; // Limpa as sugestões anteriores
            suggestionsList.style.display = 'none'; // Oculta lista inicialmente

            if (termo.length === 0) return; // Não faz nada se campo estiver vazio

            const titulos = animacaosList // Mapeia todos os títulos válidos
                .map(f => f.title && f.title.trim())
                .filter(Boolean);

            const filtrados = Array.from(new Set(titulos)) // Remove duplicatas
                .filter(title => title.toLowerCase().includes(termo)) // Filtra pelo termo digitado
                .slice(0, SUGGESTION_LIMIT); // Limita quantidade exibida

            if (filtrados.length === 0) return; // Sai se não houver resultados

            // Cria elementos <li> para cada sugestão
            filtrados.forEach(title => {
                const li = document.createElement('li'); // Cria elemento
                li.textContent = title; // Define o texto da sugestão
                li.classList.add('suggestion-item'); // Aplica classe de estilo
                li.setAttribute('role', 'option'); // Acessibilidade
                li.setAttribute('tabindex', '0'); // Permite navegação com teclado

                // Evento ao clicar em uma sugestão
                li.addEventListener('mousedown', (ev) => {
                    ev.preventDefault();
                    input.value = title; // Preenche o campo com o título
                    suggestionsList.innerHTML = ''; // Limpa sugestões
                    suggestionsList.style.display = 'none'; // Oculta lista
                    input.focus(); // Retorna foco ao input
                });

                // Evento ao pressionar Enter ou Espaço sobre a sugestão
                li.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        input.value = title;
                        suggestionsList.innerHTML = '';
                        suggestionsList.style.display = 'none';
                        input.focus();
                    }
                });

                suggestionsList.appendChild(li); // Adiciona a sugestão na lista
            });

            suggestionsList.style.display = 'block'; // Exibe as sugestões
        }, DEBOUNCE_MS); // Aguarda o tempo definido
    });

    // Esconde a lista quando o campo perde o foco
    input.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';
        }, 150);
    });
}

// ---------------- FUNÇÕES DE JOGO ----------------

// Escolhe uma animação aleatória da lista
function selectRandomanimacao(animacao) {
    const randomIndex = Math.floor(Math.random() * animacao.length); // Gera número aleatório
    return animacao[randomIndex]; // Retorna animação selecionada
}

// Verifica se o palpite está correto
function checkGuess(guessedanimacao) {
    if (guessedanimacao.title === animacao.title) { // Se o palpite for correto
        revealAllHints(); // Revela todas as dicas
        document.getElementById('giveUpButton').style.display = 'none'; // Oculta botão desistir
        document.getElementById('enviarButton').style.display = 'none'; // Oculta botão enviar
        tentativas = 0; // Zera tentativas

        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true; // Desabilita input
        guessInput.placeholder = 'O jogo terminou!'; // Mostra mensagem
        guessInput.style.backgroundColor = '#f0f0f0'; // Muda cor de fundo
    } else if (tentativas === 1) { // Se for a última tentativa
        revealAllHints(); // Revela tudo
        document.getElementById('enviarButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else {
        tentativas--; // Reduz tentativas

        // Adiciona efeito visual de erro
        const hintsContainer = document.getElementById('hints');
        if (hintsContainer) {
            hintsContainer.classList.add('hints-error'); // Aplica classe CSS
            setTimeout(() => {
                hintsContainer.classList.remove('hints-error'); // Remove após 300ms
            }, 300);
        }

        // Atualiza dicas específicas se o palpite acertar algum detalhe
        const guessedTitle = guessedanimacao && guessedanimacao.title;
        if (guessedTitle) {
            if (animacao.genre === guessedanimacao.genre) updateHint('hint1', `- Gênero: ${animacao.genre}`);
            if (animacao.director === guessedanimacao.director) updateHint('hint2', `- Diretor: ${animacao.director}`);
            if (animacao.MainCharacter === guessedanimacao.MainCharacter) updateHint('hint3', `- Ator Principal: ${animacao.MainCharacter}`);
            if (animacao.synopsis === guessedanimacao.synopsis) updateHint('hint4', `- Synopsis : ${animacao.synopsis}`);
        }
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza contador

    if (tentativas == 12) revealHint();
    else if (tentativas == 8) revealHint();
    else if (tentativas == 4) revealHint();
    else if (tentativas == 1) revealHint();
}

// Revela todas as dicas de uma vez
function revealAllHints() {
    updateHint('hint1', `- Gênero: ${animacao.genre}`);
    updateHint('hint2', `- Diretor: ${animacao.director}`);
    updateHint('hint3', `- Ator principal: ${animacao.MainCharacter}`);
    updateHint('hint4', `- Sinopse: ${animacao.synopsis}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

// Inicia um novo jogo
function startNewGame() {
    animacao = selectRandomanimacao(animacaosList);
    allHintsRevealed = false;
    tentativas = 12;

    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    updateHint('hint1', '- Gênero: ???');
    updateHint('hint2', '- Diretor: ???');
    updateHint('hint3', '- Ator principal: ???');
    updateHint('hint4', '- Sinopse: ???');

    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

// Desistir e revelar resposta
function giveUp() {
    alert(`Você desistiu! A resposta era: ${animacao.title}`);
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
        { id: 'hint1', text: `- Gênero: ${animacao.genre}` },
        { id: 'hint2', text: `- Diretor: ${animacao.director}` },
        { id: 'hint3', text: `- Ator principal: ${animacao.MainCharacter}` },
        { id: 'hint4', text: `- Ano de lançamento: ${animacao.synopsis}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);
        return hintElement && hintElement.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text);
    } else {
        updateHint('hint4', `- Sinopse: ${animacao.synopsis}`);
        allHintsRevealed = true;
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

// Atualiza o texto de uma dica específica
function updateHint(id, text) {
    const hint = document.getElementById(id);
    if (!hint) return;
    hint.textContent = text;
    hint.classList.toggle("revealed");
    setTimeout(() => {
        hint.classList.remove("revealed");
    }, 200);
}

// ---------------- INICIALIZAÇÃO DO DOM ----------------

// Executa quando o documento é carregado
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
                const guessedanimacao = animacaosList.find(m => m.title === guess);

                if (guessedanimacao) {
                    checkGuess(guessedanimacao);
                } else {
                    alert("Objeto não encontrado no nosso banco de dados. Tente novamente!");
                }
                guessInput.value = '';
            }
        });
    }

    const enviarButton = document.getElementById('enviarButton');
    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();
            const guessedanimacao = animacaosList.find(m => m.title === guess);

            if (guessedanimacao) {
                checkGuess(guessedanimacao);
            } else {
                alert("Objeto não encontrado no nosso banco de dados. Tente novamente!");
            }
            guessInput.value = '';
        });
    }

    loadanimacaoData(); // Carrega os dados JSON e inicia o jogo
});
