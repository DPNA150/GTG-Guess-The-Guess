// filmes.js — atualizado: autocomplete robusto e debug

// Configurações
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 120;

// Variáveis globais
let movie = {}; // Objeto para armazenar o filme atual
let moviesList = []; // Lista de todos os filmes carregados
let allHintsRevealed = false; // Indicador se todas as dicas já foram reveladas
let tentativas = 12; // mostra as tentativas restantes

// ------------ Funções principais ------------
// Carrega o JSON de filmes e inicializa tudo
async function loadMovieData() {
    console.log('[filmes.js] Carregando filmes.json...');
    try {
        const response = await fetch('filmes.json');
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        moviesList = await response.json();
        console.log(`[filmes.js] filmes.json carregado — total de itens: ${moviesList.length}`);

        // opcional: extrair apenas objetos que tenham title
        moviesList = moviesList.filter(f => f && typeof f.title === 'string');
        console.log(`[filmes.js] títulos válidos: ${moviesList.length}`);

    } catch (err) {
        console.error('[filmes.js] Erro ao carregar filmes.json:', err);
        moviesList = [];
    } finally {
        initSuggestions();
        if (moviesList.length > 0) movie = selectRandomMovie(moviesList);
    }
}

// Inicializa o sistema de sugestões (autocomplete)
function initSuggestions() {
    const input = document.getElementById('guessInput');
    const suggestionsList = document.getElementById('suggestions');
    if (!input || !suggestionsList) {
        console.warn('[filmes.js] initSuggestions: elementos DOM não encontrados');
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

            const titulos = moviesList
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

// Seleciona um filme aleatório
function selectRandomMovie(movies) {
    const randomIndex = Math.floor(Math.random() * movies.length);
    return movies[randomIndex];
}

// ------------ Funções do jogo ------------
function checkGuess(guessedMovie) {
    const feedback = document.getElementById('feedback');

    if (guessedMovie.title === movie.title) {
        feedback.textContent = `Parabéns! Você acertou: ${movie.title}`;
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
        feedback.textContent = `Você Perdeu! O filme era: ${movie.title}`;
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
        const guessedTitle = guessedMovie && guessedMovie.title;
        if (guessedTitle) {
            if (movie.genre === guessedMovie.genre) updateHint('hint1', `- Gênero: ${movie.genre}`);
            if (movie.director === guessedMovie.director) updateHint('hint2', `- Diretor: ${movie.director}`);
            if (movie.year === guessedMovie.year) updateHint('hint3', `- Ano de lançamento: ${movie.year}`);
            if (movie.leadActor === guessedMovie.leadActor) updateHint('hint4', `- Ator principal: ${movie.leadActor}`);
        }
    }
    document.getElementById('tentativas').innerHTML = 'tentativas restantes: ' + tentativas + '/12';
}

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

function startNewGame() {
    location.reload();
}

function giveUp() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Você desistiu! O filme era: ${movie.title}`;
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
        tentativas -= 2;
    } else {
        updateHint('hint5', `- Sinopse: ${movie.synopsis}`);
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
                const guessedMovie = moviesList.find(m => m.title === guess);

                if (guessedMovie) {
                    checkGuess(guessedMovie);
                } else {
                    if (feedback) {
                        feedback.textContent = 'Filme não encontrado. Tente novamente!';
                        feedback.className = 'feedback incorrect';
                        const giveUpBtn = document.getElementById('giveUpButton');
                        if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                    }
                }
                guessInput.value = '';
            }
        });
    }

    // >>>>>>> ADICIONADO: clique no botão Enviar <<<<<<
    const enviarButton = document.getElementById('enviarButton');
    if (enviarButton && guessInput) {
        enviarButton.addEventListener('click', () => {
            const guess = guessInput.value.trim();
            const feedback = document.getElementById('feedback');
            const guessedMovie = moviesList.find(m => m.title === guess);

            if (guessedMovie) {
                checkGuess(guessedMovie);
            } else {
                if (feedback) {
                    feedback.textContent = 'Filme não encontrado. Tente novamente!';
                    feedback.className = 'feedback incorrect';
                    const giveUpBtn = document.getElementById('giveUpButton');
                    if (giveUpBtn) giveUpBtn.style.display = 'inline-block';
                }
            }
            guessInput.value = '';
        });
    }
    // >>>>>>> FIM DA ADIÇÃO <<<<<<

    loadMovieData();
});
