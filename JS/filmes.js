// filmes.js — totalmente comentado e com efeito visual de erro nas dicas
// Este script gerencia o jogo de adivinhação de filmes, incluindo autocomplete, dicas, tentativas e reinício.

// ---------------- CONFIGURAÇÕES INICIAIS ----------------

// Define o número máximo de sugestões mostradas ao digitar no campo
const SUGGESTION_LIMIT = 8;

// Define o tempo (em milissegundos) entre digitação e atualização das sugestões
const DEBOUNCE_MS = 120;

// ---------------- VARIÁVEIS GLOBAIS ----------------

// Objeto que representa o filme atual do jogo
let movie = {};

// Lista com todos os filmes carregados do arquivo JSON
let moviesList = [];

// Booleano que indica se todas as dicas já foram reveladas
let allHintsRevealed = false;

// Contador de tentativas restantes do jogador
let tentativas = 12;

// ---------------- FUNÇÃO DE CARREGAMENTO DO JSON ----------------

// Função assíncrona para carregar os dados do arquivo filmes.json
async function loadMovieData() {
    console.log('[filmes.js] Carregando filmes.json...'); // Mensagem no console indicando início do carregamento
    try {
        const response = await fetch('/BD/filmes.json'); // Faz a requisição do JSON
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`); // Verifica se ocorreu erro HTTP

        moviesList = await response.json(); // Converte a resposta para JSON
        console.log(`[filmes.js] filmes.json carregado — total de itens: ${moviesList.length}`); // Exibe número total carregado

        moviesList = moviesList.filter(f => f && typeof f.title === 'string'); // Mantém apenas filmes com título válido
        console.log(`[filmes.js] títulos válidos: ${moviesList.length}`); // Loga número de filmes válidos
    } catch (err) {
        console.error('[filmes.js] Erro ao carregar filmes.json:', err); // Exibe erro no console
        moviesList = []; // Zera lista se der erro
    } finally {
        initSuggestions(); // Inicializa sistema de sugestões
        if (moviesList.length > 0) movie = selectRandomMovie(moviesList); // Seleciona um filme aleatório
    }
}

// ---------------- AUTOCOMPLETE ----------------

// Configura o comportamento de autocomplete ao digitar no input
function initSuggestions() {
    const input = document.getElementById('guessInput'); // Obtém campo de entrada
    const suggestionsList = document.getElementById('suggestions'); // Obtém lista de sugestões
    if (!input || !suggestionsList) {
        console.warn('[filmes.js] initSuggestions: elementos DOM não encontrados');
        return; // Sai se não encontrar elementos
    }

    let debounceTimer = null; // Cria temporizador para limitar buscas rápidas

    input.addEventListener('input', () => { // Evento de digitação
        clearTimeout(debounceTimer); // Limpa temporizador anterior
        debounceTimer = setTimeout(() => { // Aguarda tempo de debounce
            const termo = input.value.trim().toLowerCase(); // Texto digitado pelo usuário
            suggestionsList.innerHTML = ''; // Limpa lista antiga
            suggestionsList.style.display = 'none'; // Oculta lista inicialmente

            if (termo.length === 0) return; // Sai se não houver texto

            const titulos = moviesList.map(f => f.title && f.title.trim()).filter(Boolean); // Cria lista com títulos válidos

            const filtrados = Array.from(new Set(titulos)) // Remove duplicados
                .filter(title => title.toLowerCase().includes(termo)) // Filtra pelo texto
                .slice(0, SUGGESTION_LIMIT); // Limita número de sugestões

            if (filtrados.length === 0) return; // Sai se nada encontrado

            filtrados.forEach(title => { // Cria item da lista para cada sugestão
                const li = document.createElement('li'); // Cria elemento <li>
                li.textContent = title; // Define texto do item
                li.classList.add('suggestion-item'); // Classe CSS
                li.setAttribute('role', 'option'); // Acessibilidade
                li.setAttribute('tabindex', '0'); // Permite foco via teclado

                li.addEventListener('mousedown', (ev) => { // Clique do mouse
                    ev.preventDefault(); // Evita perder foco
                    input.value = title; // Coloca valor selecionado
                    suggestionsList.innerHTML = ''; // Limpa lista
                    suggestionsList.style.display = 'none'; // Oculta lista
                    input.focus(); // Retorna foco ao input
                });

                li.addEventListener('keydown', (ev) => { // Teclas Enter ou Espaço
                    if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        input.value = title;
                        suggestionsList.innerHTML = '';
                        suggestionsList.style.display = 'none';
                        input.focus();
                    }
                });

                suggestionsList.appendChild(li); // Adiciona sugestão à lista
            });

            suggestionsList.style.display = 'block'; // Mostra lista
        }, DEBOUNCE_MS); // Tempo de espera
    });

    input.addEventListener('blur', () => { // Quando perde foco
        setTimeout(() => {
            suggestionsList.innerHTML = ''; // Limpa lista
            suggestionsList.style.display = 'none'; // Oculta
        }, 150);
    });
}

// ---------------- FUNÇÕES DO JOGO ----------------

// Seleciona um filme aleatoriamente
function selectRandomMovie(movies) {
    const randomIndex = Math.floor(Math.random() * movies.length); // Gera índice aleatório
    return movies[randomIndex]; // Retorna o filme escolhido
}

// Função principal para verificar o palpite
function checkGuess(guessedMovie) {
    if (guessedMovie.title === movie.title) { // Se o palpite for correto
        revealAllHints(); // Mostra todas as dicas
        document.getElementById('giveUpButton').style.display = 'none'; // Esconde botão desistir
        document.getElementById('enviarButton').style.display = 'none'; // Esconde botão enviar
        tentativas = 0; // Zera tentativas
        const guessInput = document.getElementById('guessInput'); // Obtém input
        guessInput.disabled = true; // Desativa campo
        guessInput.placeholder = 'O jogo terminou!'; // Mensagem de fim
        guessInput.style.backgroundColor = '#f0f0f0'; // Muda cor
    } else if (tentativas === 1) { // Última tentativa (derrota)
        revealAllHints(); // Mostra todas as dicas
        document.getElementById('enviarButton').style.display = 'none';
        document.getElementById('giveUpButton').style.display = 'none';
        const guessInput = document.getElementById('guessInput');
        guessInput.disabled = true;
        guessInput.placeholder = 'O jogo terminou!';
        guessInput.style.backgroundColor = '#f0f0f0';
    } else { // Palpite incorreto, mas ainda há tentativas
        tentativas--; // Reduz contador

        // >>> EFEITO DE ERRO NAS DICAS <<<
        const hintsContainer = document.getElementById('hints'); // Obtém contêiner de dicas
        if (hintsContainer) {
            hintsContainer.classList.add('hints-error'); // Adiciona classe de erro
            setTimeout(() => {
                hintsContainer.classList.remove('hints-error'); // Remove após 0,3s
            }, 300);
        }
        // >>> FIM DO EFEITO DE ERRO <<<

        const guessedTitle = guessedMovie && guessedMovie.title; // Obtém título
        if (guessedTitle) { // Se existe título
            if (movie.genre === guessedMovie.genre) updateHint('hint1', `- Gênero: ${movie.genre}`);
            if (movie.director === guessedMovie.director) updateHint('hint2', `- Diretor: ${movie.director}`);
            if (movie.year === guessedMovie.year) updateHint('hint3', `- Ano de lançamento: ${movie.year}`);
            if (movie.leadActor === guessedMovie.leadActor) updateHint('hint4', `- Ator principal: ${movie.leadActor}`);
        }
    }

    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12'; // Atualiza texto

    if (tentativas == 9) revealHint();
    else if (tentativas == 6) revealHint();
    else if (tentativas == 3) revealHint();
    else if (tentativas == 1) revealHint();
}

// Revela todas as dicas
function revealAllHints() {
    updateHint('hint1', `- Gênero: ${movie.genre}`);
    updateHint('hint2', `- Diretor: ${movie.director}`);
    updateHint('hint3', `- Ano de lançamento: ${movie.year}`);
    updateHint('hint4', `- Ator principal: ${movie.leadActor}`);
    updateHint('hint5', `- Sinopse: ${movie.synopsis}`);
    allHintsRevealed = true;
    tentativas = 0;
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

// Inicia um novo jogo
function startNewGame() {
    movie = selectRandomMovie(moviesList); // Escolhe novo filme
    allHintsRevealed = false; // Reseta estado
    tentativas = 12; // Reseta tentativas

    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.value = '';
        guessInput.placeholder = 'Digite seu palpite...';
        guessInput.style.backgroundColor = '';
    }

    // Reseta dicas
    updateHint('hint1', '- Gênero: ???');
    updateHint('hint2', '- Diretor: ???');
    updateHint('hint3', '- Ano de lançamento: ???');
    updateHint('hint4', '- Ator principal: ???');
    updateHint('hint5', '- Sinopse: ???');

    // Reexibe botões
    document.getElementById('giveUpButton').style.display = 'inline-block';
    document.getElementById('enviarButton').style.display = 'inline-block';

    // Atualiza tentativas
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

// Desistir do jogo
function giveUp() {
    alert(`Você desistiu! A resposta era: ${movie.title}`); // Exibe alerta com resposta
    revealAllHints(); // Mostra todas as dicas
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
        { id: 'hint1', text: `- Gênero: ${movie.genre}` },
        { id: 'hint2', text: `- Diretor: ${movie.director}` },
        { id: 'hint3', text: `- Ano de lançamento: ${movie.year}` },
        { id: 'hint4', text: `- Ator principal: ${movie.leadActor}` }
    ];

    const unrevealedHints = hints.filter(hint => {
        const hintElement = document.getElementById(hint.id);
        return hintElement && hintElement.textContent.includes('???');
    });

    if (unrevealedHints.length > 0) {
        const randomHint = unrevealedHints[Math.floor(Math.random() * unrevealedHints.length)];
        updateHint(randomHint.id, randomHint.text);
    } else {
        updateHint('hint5', `- Sinopse: ${movie.synopsis}`);
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
    setTimeout(function () {
        hint.classList.remove("revealed");
    }, 200);
}

// ---------------- INICIALIZAÇÃO ----------------

// Executa o código quando o DOM estiver carregado
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
                const guessedMovie = moviesList.find(m => m.title === guess);
                if (guessedMovie) {
                    checkGuess(guessedMovie);
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
            const guessedMovie = moviesList.find(m => m.title === guess);
            if (guessedMovie) {
                checkGuess(guessedMovie);
            } else {
                alert("Objeto não encontrado no nosso banco de dados. Tente novamente!");
            }
            guessInput.value = '';
        });
    }

    loadMovieData(); // Inicia carregamento do JSON
});
